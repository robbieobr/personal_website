/**
 * Loads the two deployment-provided sources the SEO artefacts are derived from.
 *
 * Both files are gitignored host state. When either is missing, unreadable or
 * still holds its template placeholders, this returns null and the build carries
 * on without any of the artefacts.
 */

import { readFile } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { parseSiteHost } from './caddyfile';
import { buildMetadata, type SiteMetadata } from './metadata';
import { parseSiteOwner } from './seed';

/** Path of the Caddy configuration, relative to the repository root. */
export const CADDYFILE_PATH = 'Caddyfile';

/** Path of the production seed, relative to the repository root. */
export const PROD_SEED_PATH = 'database/prod-initdb.d/500_prod_seed.sql';

export interface DeploymentSeo {
  metadata: SiteMetadata;
  photo: Buffer | null;
}

export interface LoadOptions {
  repoRoot: string;
  publicDir: string;
}

async function readTextFile(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return null;
  }
}

/** Reads the profile photo the seed names, resolved inside the public directory. */
export async function readProfilePhoto(
  publicDir: string,
  profileImage: string | null
): Promise<Buffer | null> {
  if (!profileImage) return null;

  const requested = profileImage.replace(/^\/+/, '');
  if (!requested || isAbsolute(requested)) return null;

  const path = resolve(publicDir, requested);
  const inside = relative(resolve(publicDir), path);
  if (inside.startsWith('..') || isAbsolute(inside)) return null;

  try {
    return await readFile(path);
  } catch {
    return null;
  }
}

export async function loadDeploymentSeo(options: LoadOptions): Promise<DeploymentSeo | null> {
  const caddyfile = await readTextFile(join(options.repoRoot, CADDYFILE_PATH));
  if (caddyfile === null) return null;

  const host = parseSiteHost(caddyfile);
  if (host === null) return null;

  const seed = await readTextFile(join(options.repoRoot, PROD_SEED_PATH));
  if (seed === null) return null;

  const owner = parseSiteOwner(seed);
  if (owner === null) return null;

  return {
    metadata: buildMetadata(owner, host),
    photo: await readProfilePhoto(options.publicDir, owner.profileImage),
  };
}
