import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite';
import sharp from 'sharp';
import { CADDYFILE_PATH, PROD_SEED_PATH } from '../../seo/deployment';
import { deploymentSeo, readHtmlLang, replaceTitle } from '../../seo/plugin';
import { caddyfile, seedSql } from './fixtures';

const INDEX_HTML = `<!doctype html>
<html lang="en">
  <head>
    <title>Personal Website</title>
  </head>
  <body><div id="root"></div></body>
</html>
`;

let repoRoot: string;
let root: string;
let outDir: string;

async function writeSource(relativePath: string, content: string) {
  const path = join(repoRoot, relativePath);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
}

/** Drives the plugin hooks the way Vite does for a build. */
async function runBuild(plugin: Plugin) {
  const logs: string[] = [];
  const config = {
    root,
    publicDir: join(root, 'public'),
    command: 'build',
    build: { outDir: 'build' },
    logger: { info: (message: string) => logs.push(message) },
  } as unknown as ResolvedConfig;

  await (plugin.configResolved as (config: ResolvedConfig) => Promise<void>)(config);

  const transform = plugin.transformIndexHtml as (html: string) => unknown;
  const html = transform(INDEX_HTML);

  await (plugin.writeBundle as () => Promise<void>)();

  return { html, logs };
}

/** Captures the middleware the plugin registers on a dev server. */
function devMiddleware(plugin: Plugin) {
  let handler: ((request: unknown, response: unknown, next: () => void) => void) | undefined;
  const server = {
    middlewares: {
      use: (fn: typeof handler) => {
        handler = fn;
      },
    },
  } as unknown as ViteDevServer;

  (plugin.configureServer as (server: ViteDevServer) => void)(server);
  if (!handler) throw new Error('no middleware registered');
  return handler;
}

function fakeResponse() {
  const headers: Record<string, string> = {};
  let body: string | Buffer | undefined;

  const response = {
    setHeader: (key: string, value: string) => {
      headers[key] = value;
    },
    end: (value: string | Buffer) => {
      body = value;
    },
  } as unknown as ServerResponse;

  return { response, headers, read: () => body };
}

beforeEach(async () => {
  repoRoot = await mkdtemp(join(tmpdir(), 'seo-plugin-'));
  root = join(repoRoot, 'frontend');
  outDir = join(root, 'build');
  await mkdir(join(root, 'public'), { recursive: true });
});

afterEach(async () => {
  await rm(repoRoot, { recursive: true, force: true });
});

describe('readHtmlLang', () => {
  it('reads the lang attribute', () => {
    expect(readHtmlLang('<html lang="ga">')).toBe('ga');
  });

  it('falls back to English when there is none', () => {
    expect(readHtmlLang('<html>')).toBe('en');
  });
});

describe('replaceTitle', () => {
  it('replaces the title text', () => {
    expect(replaceTitle('<title>Old</title>', 'New')).toBe('<title>New</title>');
  });

  it('escapes markup in the title', () => {
    expect(replaceTitle('<title>Old</title>', 'A & <b>B</b>')).toBe(
      '<title>A &amp; &lt;b&gt;B&lt;/b&gt;</title>'
    );
  });

  it('leaves a document with no title alone', () => {
    expect(replaceTitle('<head></head>', 'New')).toBe('<head></head>');
  });
});

describe('deploymentSeo with deployment data', () => {
  beforeEach(async () => {
    await writeSource(CADDYFILE_PATH, caddyfile);
    await writeSource(PROD_SEED_PATH, seedSql);

    const jpeg = await sharp({
      create: { width: 60, height: 60, channels: 3, background: '#00ff00' },
    })
      .jpeg()
      .toBuffer();
    await mkdir(join(root, 'public/images'), { recursive: true });
    await writeFile(join(root, 'public/images/sam-profile.jpg'), jpeg);
  });

  it('rewrites the title and injects the head tags', async () => {
    const { html } = await runBuild(deploymentSeo({ repoRoot }));
    const result = html as { html: string; tags: Array<{ attrs?: Record<string, string> }> };

    expect(result.html).toContain("<title>Sam O'Toole | Staff Platform Engineer</title>");
    expect(result.tags.some((tag) => tag.attrs?.rel === 'canonical')).toBe(true);
    expect(result.tags.some((tag) => tag.attrs?.property === 'og:image')).toBe(true);
  });

  it('writes the crawler files and the social card', async () => {
    await runBuild(deploymentSeo({ repoRoot, lastModified: '2026-09-06' }));

    expect((await readdir(outDir)).sort()).toEqual(['og-image.png', 'robots.txt', 'sitemap.xml']);
    expect(await readFile(join(outDir, 'robots.txt'), 'utf8')).toContain(
      'Sitemap: https://sample-person.test/sitemap.xml'
    );
    expect(await readFile(join(outDir, 'sitemap.xml'), 'utf8')).toContain(
      '<lastmod>2026-09-06</lastmod>'
    );

    const card = await sharp(await readFile(join(outDir, 'og-image.png'))).metadata();
    expect([card.width, card.height]).toEqual([1200, 630]);
  });

  it('stamps the day of the build when no date is given', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-04T10:00:00Z'));

    try {
      await runBuild(deploymentSeo({ repoRoot }));
      expect(await readFile(join(outDir, 'sitemap.xml'), 'utf8')).toContain(
        '<lastmod>2026-03-04</lastmod>'
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('names the site host in the build log', async () => {
    const { logs } = await runBuild(deploymentSeo({ repoRoot }));
    expect(logs.join('\n')).toContain('sample-person.test');
  });

  it('serves the crawler files and the card in dev', async () => {
    const plugin = deploymentSeo({ repoRoot, lastModified: '2026-09-06' });
    await runBuild(plugin);
    const handler = devMiddleware(plugin);

    for (const [url, type] of [
      ['/robots.txt', 'text/plain; charset=utf-8'],
      ['/sitemap.xml', 'application/xml; charset=utf-8'],
    ]) {
      const { response, headers, read } = fakeResponse();
      handler({ url } as IncomingMessage, response, () => {
        throw new Error(`${url} was not served`);
      });
      expect(headers['Content-Type']).toBe(type);
      expect(String(read()).length).toBeGreaterThan(0);
    }

    const card = fakeResponse();
    await new Promise<void>((resolve) => {
      card.response.end = ((value: Buffer) => {
        expect(value.subarray(1, 4).toString()).toBe('PNG');
        resolve();
      }) as ServerResponse['end'];
      handler({ url: '/og-image.png?v=1' } as IncomingMessage, card.response, () => {
        throw new Error('og-image was not served');
      });
    });
  });

  it('passes other dev requests through', async () => {
    const plugin = deploymentSeo({ repoRoot });
    await runBuild(plugin);
    const handler = devMiddleware(plugin);
    const next = vi.fn();

    handler({ url: '/index.html' } as IncomingMessage, fakeResponse().response, next);
    expect(next).toHaveBeenCalled();
  });

  it('passes a request with no URL through', async () => {
    const plugin = deploymentSeo({ repoRoot });
    await runBuild(plugin);
    const handler = devMiddleware(plugin);
    const next = vi.fn();

    handler({} as IncomingMessage, fakeResponse().response, next);
    expect(next).toHaveBeenCalled();
  });
});

describe('deploymentSeo without deployment data', () => {
  it('leaves the document untouched and writes nothing', async () => {
    const { html, logs } = await runBuild(deploymentSeo({ repoRoot }));

    expect(html).toBe(INDEX_HTML);
    expect(logs.join('\n')).toContain('omitting SEO artefacts');
    await expect(readdir(outDir)).rejects.toThrow();
  });

  it('passes every dev request through', async () => {
    const plugin = deploymentSeo({ repoRoot });
    await runBuild(plugin);
    const next = vi.fn();

    devMiddleware(plugin)({ url: '/robots.txt' } as IncomingMessage, fakeResponse().response, next);
    expect(next).toHaveBeenCalled();
  });
});
