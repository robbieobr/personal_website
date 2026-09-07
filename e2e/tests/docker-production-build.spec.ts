import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Builds the production image and checks what the SEO stage put in the web root.
 *
 * The build context is an export of the tracked tree. The deployment's real
 * Caddyfile and production seed are gitignored, so they are absent from that
 * export and the build runs against the dummy data written below instead.
 */

const SITE = 'petrichor-labs.dev';
const OWNER = "Mira D'Alessandro";
const ROLE = 'Principal Reliability Engineer';
const EMPLOYER = 'Petrichor Labs';
const INSTITUTION = 'Northgate University';
const WEB_ROOT = '/usr/share/nginx/html';

const SEED = `USE personal_website;
INSERT INTO users (name, title, profileImage, bio) VALUES
('Mira D''Alessandro', '${ROLE}', '/images/placeholder-profile.jpeg',
 'Keeps distributed systems upright and on call rotas humane.');
INSERT INTO contact_info (user_id, type, value, display_order) VALUES
(1, 'email', 'mira@${SITE}', 1),
(1, 'github', 'https://github.com/petrichor-mira', 2);
INSERT INTO job_history (userId, company, position, startDate, endDate) VALUES
(1, 'Halcyon Systems', 'Engineer', '2015-01-01', '2019-12-31'),
(1, '${EMPLOYER}', '${ROLE}', '2020-01-01', NULL);
INSERT INTO education (userId, institution, degree, startDate, endDate) VALUES
(1, 'Riverbank College', 'Diploma', '2009-09-01', '2011-06-30'),
(1, '${INSTITUTION}', 'BSc', '2011-09-01', '2015-06-30');
INSERT INTO skills (userId, skill) VALUES (1, 'Python'), (1, 'Docker'), (1, 'nginx');
`;

const run = (file: string, args: string[], opts: { cwd?: string } = {}) =>
  execFileSync(file, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...opts });

const dockerAvailable = () => {
  try {
    run('docker', ['info', '--format', '{{.ServerVersion}}']);
    return true;
  } catch {
    return false;
  }
};

/** Ids of every image and container the daemon holds, used to detect leaks. */
const inventory = () => ({
  images: run('docker', ['images', '-aq']).split('\n').filter(Boolean).sort().join(','),
  containers: run('docker', ['ps', '-aq']).split('\n').filter(Boolean).sort().join(','),
});

/** Reads a file out of an image. The container is discarded as it exits. */
const readFile = (tag: string, path: string) =>
  run('docker', ['run', '--rm', '--entrypoint', 'cat', tag, path]);

const readFileBytes = (tag: string, path: string): Buffer =>
  execFileSync('docker', ['run', '--rm', '--entrypoint', 'cat', tag, path], {
    maxBuffer: 64 * 1024 * 1024,
  });

/** Shell inside the image, for existence checks and directory listings. */
const shell = (tag: string, script: string) =>
  run('docker', ['run', '--rm', '--entrypoint', 'sh', tag, '-c', script]);

const repoRoot = () => run('git', ['rev-parse', '--show-toplevel']).trim();

/** Exports the tracked tree, optionally seeded with the dummy deployment data. */
const exportContext = (withSeed: boolean) => {
  const dir = mkdtempSync(join(tmpdir(), 'prodbuild-'));
  const archive = execFileSync('git', ['archive', 'HEAD'], {
    cwd: repoRoot(),
    maxBuffer: 256 * 1024 * 1024,
  });
  execFileSync('tar', ['-x', '-C', dir], { input: archive });
  if (withSeed) {
    writeFileSync(join(dir, 'database/prod-initdb.d/500_prod_seed.sql'), SEED);
  }
  return dir;
};

const buildProduction = (context: string, tag: string, siteUrl: string) =>
  run('docker', [
    'build',
    '--quiet',
    '--file',
    join(context, 'frontend/Dockerfile'),
    '--target',
    'production',
    '--build-arg',
    `SITE_URL=${siteUrl}`,
    '--tag',
    tag,
    context,
  ]);

test.describe('production image', () => {
  // A cold image build runs well past the suite's default per-test timeout.
  test.describe.configure({ timeout: 900_000 });
  test.skip(!dockerAvailable(), 'Docker daemon is not reachable');

  const created: string[] = [];
  const contexts: string[] = [];
  let before: ReturnType<typeof inventory>;
  let seeded: string;

  test.beforeAll(() => {
    before = inventory();
    const context = exportContext(true);
    contexts.push(context);
    seeded = uniqueTag();
    buildProduction(context, seeded, SITE);
  });

  test.afterAll(() => {
    for (const tag of created) {
      // Resolve to an id first: another build may have moved the tag.
      try {
        const id = run('docker', ['image', 'inspect', '--format', '{{.Id}}', tag]).trim();
        run('docker', ['rmi', '--force', id]);
      } catch {
        /* already gone */
      }
    }
    for (const dir of contexts) rmSync(dir, { recursive: true, force: true });

    const after = inventory();
    expect(after.images, 'the test left an image behind').toBe(before.images);
    expect(after.containers, 'the test left a container behind').toBe(before.containers);
  });

  /** A tag that cannot collide with the deployment's own images. */
  const uniqueTag = () => {
    const tag = `e2e-prodbuild-${process.pid}-${created.length}:tmp`;
    created.push(tag);
    return tag;
  };

  test('publishes the deployment metadata into the web root', () => {
    const tag = seeded;
    const document = readFile(tag, `${WEB_ROOT}/index.html`);
    expect(document).toContain(`<title>${OWNER} | ${ROLE}</title>`);
    expect(document).toContain(`https://${SITE}/`);

    const graph = JSON.parse(
      document
        .split('<script type="application/ld+json">')[1]
        .split('</script>')[0]
        .replace(/\\u003c/g, '<')
    );
    const person = graph['@graph'][0];
    expect(person.name).toBe(OWNER);
    expect(person.jobTitle).toBe(ROLE);
    // The open-ended job_history row is the current one.
    expect(person.worksFor).toEqual({ '@type': 'Organization', name: EMPLOYER });
    // The education row with the latest start date wins.
    expect(person.alumniOf).toEqual({ '@type': 'CollegeOrUniversity', name: INSTITUTION });

    expect(readFile(tag, `${WEB_ROOT}/sitemap.xml`)).toContain(`<loc>https://${SITE}/</loc>`);
    expect(readFile(tag, `${WEB_ROOT}/robots.txt`)).toContain(
      `Sitemap: https://${SITE}/sitemap.xml`
    );

    const card = readFileBytes(tag, `${WEB_ROOT}/og-image.png`);
    expect(card.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    );
    expect(card.readUInt32BE(16)).toBe(1200);
    expect(card.readUInt32BE(20)).toBe(630);
  });

  test('ships neither the generator nor its inputs', () => {
    const leftovers = shell(
      seeded,
      'find / -xdev \\( -iname "*prod_seed*" -o -name "*.py" -o -iname "Caddyfile*" \\) 2>/dev/null | head -20'
    ).trim();
    expect(leftovers, 'the image carries build inputs it should not').toBe('');
  });

  test('omits the metadata when the deployment supplies none', () => {
    const context = exportContext(false);
    contexts.push(context);
    const tag = uniqueTag();
    buildProduction(context, tag, '');

    const present = shell(
      tag,
      `ls ${WEB_ROOT} | grep -cE '^(robots.txt|sitemap.xml|og-image.png)$' || true`
    ).trim();
    expect(present, 'artefacts were written without deployment data').toBe('0');

    const document = readFile(tag, `${WEB_ROOT}/index.html`);
    expect(document).toContain('<title>Personal Website</title>');
    expect(document).not.toContain('application/ld+json');
    expect(document).not.toContain('og:image');
  });
});
