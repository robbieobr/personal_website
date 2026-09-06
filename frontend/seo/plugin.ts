/**
 * Vite plugin that generates the SEO artefacts from deployment-provided data.
 *
 * The document head is rewritten during `transformIndexHtml`; `robots.txt`,
 * `sitemap.xml` and `og-image.png` are written into the build output. With no
 * deployment data present the plugin does nothing and none of the artefacts are
 * produced.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { Plugin, ResolvedConfig } from 'vite';
import { loadDeploymentSeo, type DeploymentSeo } from './deployment';
import {
  buildHeadTags,
  OG_IMAGE_FILE,
  renderRobotsTxt,
  renderSitemapXml,
  ROBOTS_FILE,
  SITEMAP_FILE,
} from './metadata';
import { renderOgImage } from './ogImage';

export interface DeploymentSeoOptions {
  /** Directory holding the Caddyfile and the database directory. Defaults to the repository root. */
  repoRoot?: string;
  /** Date stamped into the sitemap. Defaults to the day of the build. */
  lastModified?: string;
}

/** The `lang` attribute of the document, which the metadata declares as the page language. */
export function readHtmlLang(html: string): string {
  return /<html[^>]*\slang=["']([^"']+)["']/i.exec(html)?.[1] ?? 'en';
}

export function replaceTitle(html: string, title: string): string {
  const escaped = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escaped}</title>`);
}

function isoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function deploymentSeo(options: DeploymentSeoOptions = {}): Plugin {
  let seo: DeploymentSeo | null = null;
  let outDir = '';
  let ogImage: Buffer | null = null;

  const ogImageBytes = async (data: DeploymentSeo): Promise<Buffer> => {
    ogImage ??= await renderOgImage(data.metadata, data.photo);
    return ogImage;
  };

  return {
    name: 'deployment-seo',

    async configResolved(config: ResolvedConfig) {
      outDir = resolve(config.root, config.build.outDir);
      seo = await loadDeploymentSeo({
        repoRoot: options.repoRoot ?? resolve(config.root, '..'),
        publicDir: config.publicDir,
      });

      if (config.command === 'build') {
        config.logger.info(
          seo
            ? `deployment-seo: generating metadata and crawler files for ${seo.metadata.host}`
            : 'deployment-seo: no deployment data found, omitting SEO artefacts'
        );
      }
    },

    transformIndexHtml(html) {
      if (!seo) return html;
      return {
        html: replaceTitle(html, seo.metadata.pageTitle),
        tags: buildHeadTags(seo.metadata, readHtmlLang(html)),
      };
    },

    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const data = seo;
        if (!data || !request.url) {
          next();
          return;
        }

        const path = request.url.split('?')[0];

        if (path === `/${ROBOTS_FILE}`) {
          response.setHeader('Content-Type', 'text/plain; charset=utf-8');
          response.end(renderRobotsTxt(data.metadata));
          return;
        }

        if (path === `/${SITEMAP_FILE}`) {
          response.setHeader('Content-Type', 'application/xml; charset=utf-8');
          response.end(renderSitemapXml(data.metadata, options.lastModified ?? isoDate()));
          return;
        }

        if (path === `/${OG_IMAGE_FILE}`) {
          ogImageBytes(data).then((png) => {
            response.setHeader('Content-Type', 'image/png');
            response.end(png);
          }, next);
          return;
        }

        next();
      });
    },

    async writeBundle() {
      const data = seo;
      if (!data) return;

      await mkdir(outDir, { recursive: true });
      await Promise.all([
        writeFile(join(outDir, ROBOTS_FILE), renderRobotsTxt(data.metadata)),
        writeFile(
          join(outDir, SITEMAP_FILE),
          renderSitemapXml(data.metadata, options.lastModified ?? isoDate())
        ),
        ogImageBytes(data).then((png) => writeFile(join(outDir, OG_IMAGE_FILE), png)),
      ]);
    },
  };
}
