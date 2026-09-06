import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import {
  CADDYFILE_PATH,
  loadDeploymentSeo,
  PROD_SEED_PATH,
  readProfilePhoto,
} from '../../seo/deployment';
import { caddyfile, placeholderCaddyfile, seedSql } from './fixtures';

let repoRoot: string;
let publicDir: string;

async function writeSource(relativePath: string, content: string) {
  const path = join(repoRoot, relativePath);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
}

async function writePhoto() {
  await mkdir(join(publicDir, 'images'), { recursive: true });
  const jpeg = await sharp({
    create: { width: 60, height: 60, channels: 3, background: '#00ff00' },
  })
    .jpeg()
    .toBuffer();
  await writeFile(join(publicDir, 'images/sam-profile.jpg'), jpeg);
}

beforeEach(async () => {
  repoRoot = await mkdtemp(join(tmpdir(), 'seo-deployment-'));
  publicDir = join(repoRoot, 'frontend/public');
  await mkdir(publicDir, { recursive: true });
});

afterEach(async () => {
  await rm(repoRoot, { recursive: true, force: true });
});

describe('loadDeploymentSeo', () => {
  it('builds metadata from both sources', async () => {
    await writeSource(CADDYFILE_PATH, caddyfile);
    await writeSource(PROD_SEED_PATH, seedSql);

    const loaded = await loadDeploymentSeo({ repoRoot, publicDir });

    expect(loaded?.metadata).toMatchObject({
      host: 'sample-person.test',
      pageTitle: "Sam O'Toole | Staff Platform Engineer",
    });
  });

  it('reads the photo the seed names', async () => {
    await writeSource(CADDYFILE_PATH, caddyfile);
    await writeSource(PROD_SEED_PATH, seedSql);
    await writePhoto();

    const loaded = await loadDeploymentSeo({ repoRoot, publicDir });
    expect(loaded?.photo).toBeInstanceOf(Buffer);
  });

  it('leaves the photo null when the file is not there', async () => {
    await writeSource(CADDYFILE_PATH, caddyfile);
    await writeSource(PROD_SEED_PATH, seedSql);

    const loaded = await loadDeploymentSeo({ repoRoot, publicDir });
    expect(loaded?.photo).toBeNull();
  });

  it('returns null when the Caddyfile is missing', async () => {
    await writeSource(PROD_SEED_PATH, seedSql);
    expect(await loadDeploymentSeo({ repoRoot, publicDir })).toBeNull();
  });

  it('returns null when the seed is missing', async () => {
    await writeSource(CADDYFILE_PATH, caddyfile);
    expect(await loadDeploymentSeo({ repoRoot, publicDir })).toBeNull();
  });

  it('returns null when both are missing', async () => {
    expect(await loadDeploymentSeo({ repoRoot, publicDir })).toBeNull();
  });

  it('returns null when the Caddyfile is still the template', async () => {
    await writeSource(CADDYFILE_PATH, placeholderCaddyfile);
    await writeSource(PROD_SEED_PATH, seedSql);

    expect(await loadDeploymentSeo({ repoRoot, publicDir })).toBeNull();
  });

  it('returns null when the seed is still the template', async () => {
    await writeSource(CADDYFILE_PATH, caddyfile);
    await writeSource(PROD_SEED_PATH, "INSERT INTO users (name, title) VALUES ('Your Name', 'X');");

    expect(await loadDeploymentSeo({ repoRoot, publicDir })).toBeNull();
  });

  it('returns null when a source is a directory rather than a file', async () => {
    await mkdir(join(repoRoot, CADDYFILE_PATH), { recursive: true });
    await writeSource(PROD_SEED_PATH, seedSql);

    expect(await loadDeploymentSeo({ repoRoot, publicDir })).toBeNull();
  });
});

describe('readProfilePhoto', () => {
  beforeEach(writePhoto);

  it('reads a path relative to the public directory', async () => {
    expect(await readProfilePhoto(publicDir, 'images/sam-profile.jpg')).toBeInstanceOf(Buffer);
  });

  it('reads a path written with a leading slash', async () => {
    expect(await readProfilePhoto(publicDir, '/images/sam-profile.jpg')).toBeInstanceOf(Buffer);
  });

  it('returns null when the seed names no photo', async () => {
    expect(await readProfilePhoto(publicDir, null)).toBeNull();
  });

  it('returns null for a path that is only slashes', async () => {
    expect(await readProfilePhoto(publicDir, '///')).toBeNull();
  });

  it('returns null for a path that climbs out of the public directory', async () => {
    expect(await readProfilePhoto(publicDir, '../../secrets.txt')).toBeNull();
  });

  it('returns null for a file that is not there', async () => {
    expect(await readProfilePhoto(publicDir, 'images/missing.jpg')).toBeNull();
  });
});
