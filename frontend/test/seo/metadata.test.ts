import { describe, it, expect } from 'vitest';
import type { HtmlTagDescriptor } from 'vite';
import {
  buildHeadTags,
  buildJsonLd,
  buildMetadata,
  renderRobotsTxt,
  renderSitemapXml,
} from '../../seo/metadata';
import type { SiteOwner } from '../../seo/seed';
import { metadata, owner } from './fixtures';

function attrOf(tags: HtmlTagDescriptor[], key: string, value: string): HtmlTagDescriptor {
  const tag = tags.find((candidate) => candidate.attrs?.[key] === value);
  if (!tag) throw new Error(`no tag with ${key}="${value}"`);
  return tag;
}

describe('buildMetadata', () => {
  it('derives the canonical URLs from the host', () => {
    expect(metadata).toMatchObject({
      host: 'sample-person.test',
      origin: 'https://sample-person.test',
      canonical: 'https://sample-person.test/',
      ogImageUrl: 'https://sample-person.test/og-image.png',
      profileImageUrl: 'https://sample-person.test/images/sam-profile.jpg',
    });
  });

  it('builds the page title and image alt from the name and role', () => {
    expect(metadata.pageTitle).toBe("Sam O'Toole | Staff Platform Engineer");
    expect(metadata.ogImageAlt).toBe("Sam O'Toole, Staff Platform Engineer");
  });

  it('takes the email from the contact rows', () => {
    expect(metadata.email).toBe('sam@sample-person.test');
  });

  it('lists profiles elsewhere but not the site itself', () => {
    expect(metadata.sameAs).toEqual([
      'https://github.com/sample-person',
      'https://www.linkedin.com/in/sample-person',
    ]);
  });

  it('drops contact values that are not absolute URLs', () => {
    const withHandles: SiteOwner = {
      ...owner,
      contacts: [
        { type: 'github', value: 'sample-person' },
        { type: 'linkedin', value: 'https://www.linkedin.com/in/sample-person' },
      ],
    };

    expect(buildMetadata(withHandles, 'sample-person.test').sameAs).toEqual([
      'https://www.linkedin.com/in/sample-person',
    ]);
  });

  it('drops a contact value that is not a parseable URL', () => {
    const broken: SiteOwner = { ...owner, contacts: [{ type: 'github', value: 'https://' }] };
    expect(buildMetadata(broken, 'sample-person.test').sameAs).toEqual([]);
  });

  it('leaves the profile image null when the seed names none', () => {
    const noPhoto: SiteOwner = { ...owner, profileImage: null };
    expect(buildMetadata(noPhoto, 'sample-person.test').profileImageUrl).toBeNull();
  });

  it('normalises a leading slash on the profile image path', () => {
    const rooted: SiteOwner = { ...owner, profileImage: '/images/sam-profile.jpg' };
    expect(buildMetadata(rooted, 'sample-person.test').profileImageUrl).toBe(
      'https://sample-person.test/images/sam-profile.jpg'
    );
  });

  it('leaves the email null when there is no email contact', () => {
    const noEmail: SiteOwner = { ...owner, contacts: [] };
    expect(buildMetadata(noEmail, 'sample-person.test').email).toBeNull();
  });
});

describe('description', () => {
  it('uses a short bio unchanged', () => {
    expect(buildMetadata(owner, 'sample-person.test').description).toBe(
      'Sam builds resilient delivery platforms for large teams.'
    );
  });

  it('collapses whitespace in the bio', () => {
    const spaced: SiteOwner = { ...owner, bio: '  one\n  two   three  ' };
    expect(buildMetadata(spaced, 'sample-person.test').description).toBe('one two three');
  });

  it('keeps whole sentences up to the limit', () => {
    const long: SiteOwner = {
      ...owner,
      bio: `${'A'.repeat(80)}. ${'B'.repeat(60)}. ${'C'.repeat(60)}.`,
    };

    const { description } = buildMetadata(long, 'sample-person.test');
    expect(description).toBe(`${'A'.repeat(80)}. ${'B'.repeat(60)}.`);
    expect(description.length).toBeLessThanOrEqual(160);
  });

  it('trims on a word boundary when the first sentence is too long', () => {
    const long: SiteOwner = { ...owner, bio: `${'word '.repeat(60)}end.` };
    const { description } = buildMetadata(long, 'sample-person.test');

    expect(description.endsWith('…')).toBe(true);
    expect(description.length).toBeLessThanOrEqual(160);
    expect(description).not.toContain('  ');
  });

  it('trims a single long token that has no word boundary', () => {
    const long: SiteOwner = { ...owner, bio: 'x'.repeat(300) };
    expect(buildMetadata(long, 'sample-person.test').description).toBe(`${'x'.repeat(159)}…`);
  });

  it('falls back to the name and role when there is no bio', () => {
    const noBio: SiteOwner = { ...owner, bio: '' };
    expect(buildMetadata(noBio, 'sample-person.test').description).toBe(
      "Sam O'Toole — Staff Platform Engineer"
    );
  });
});

describe('buildJsonLd', () => {
  it('describes the person, the page and the site', () => {
    const graph = buildJsonLd(metadata, 'en') as {
      '@graph': Array<Record<string, unknown>>;
    };

    expect(graph['@graph'].map((node) => node['@type'])).toEqual([
      'Person',
      'ProfilePage',
      'WebSite',
    ]);
  });

  it('carries the derived person fields', () => {
    const [person] = (buildJsonLd(metadata, 'en') as { '@graph': Array<Record<string, unknown>> })[
      '@graph'
    ];

    expect(person).toMatchObject({
      name: "Sam O'Toole",
      jobTitle: 'Staff Platform Engineer',
      email: 'mailto:sam@sample-person.test',
      image: 'https://sample-person.test/images/sam-profile.jpg',
      worksFor: { '@type': 'Organization', name: 'Northwind Platforms' },
      alumniOf: { '@type': 'CollegeOrUniversity', name: 'Sample University' },
      sameAs: ['https://github.com/sample-person', 'https://www.linkedin.com/in/sample-person'],
    });
  });

  it('omits fields the seed does not supply', () => {
    const bare = buildMetadata(
      { ...owner, profileImage: null, contacts: [], employer: null, institution: null },
      'sample-person.test'
    );

    const [person] = (buildJsonLd(bare, 'en') as { '@graph': Array<Record<string, unknown>> })[
      '@graph'
    ];

    expect(person).not.toHaveProperty('image');
    expect(person).not.toHaveProperty('email');
    expect(person).not.toHaveProperty('worksFor');
    expect(person).not.toHaveProperty('alumniOf');
    expect(person).not.toHaveProperty('sameAs');
  });

  it('stamps the page language on the page and site nodes', () => {
    const graph = buildJsonLd(metadata, 'ga') as { '@graph': Array<Record<string, unknown>> };
    expect(graph['@graph'][1].inLanguage).toBe('ga');
    expect(graph['@graph'][2].inLanguage).toBe('ga');
  });
});

describe('buildHeadTags', () => {
  const tags = buildHeadTags(metadata, 'en');

  it('injects everything into the head', () => {
    expect(tags.every((tag) => tag.injectTo === 'head')).toBe(true);
  });

  it('sets the canonical link', () => {
    expect(attrOf(tags, 'rel', 'canonical').attrs?.href).toBe('https://sample-person.test/');
  });

  it('sets the description on the meta, Open Graph and Twitter tags', () => {
    for (const [key, value] of [
      ['name', 'description'],
      ['property', 'og:description'],
      ['name', 'twitter:description'],
    ]) {
      expect(attrOf(tags, key, value).attrs?.content).toBe(metadata.description);
    }
  });

  it('declares the social card and its dimensions', () => {
    expect(attrOf(tags, 'property', 'og:image').attrs?.content).toBe(metadata.ogImageUrl);
    expect(attrOf(tags, 'property', 'og:image:width').attrs?.content).toBe('1200');
    expect(attrOf(tags, 'property', 'og:image:height').attrs?.content).toBe('630');
    expect(attrOf(tags, 'name', 'twitter:card').attrs?.content).toBe('summary_large_image');
  });

  it('writes the JSON-LD graph with no literal script terminator', () => {
    const script = tags.find((tag) => tag.tag === 'script');
    const body = String(script?.children);

    expect(body).not.toContain('<');
    expect(JSON.parse(body.replace(/\\u003c/g, '<'))).toMatchObject({
      '@context': 'https://schema.org',
    });
  });

  it('escapes a name that carries markup', () => {
    const injected = buildMetadata({ ...owner, name: '</script><b>x' }, 'sample-person.test');
    const script = buildHeadTags(injected, 'en').find((tag) => tag.tag === 'script');

    expect(String(script?.children)).not.toContain('</script>');
  });
});

describe('renderRobotsTxt', () => {
  const robots = renderRobotsTxt(metadata);

  it('allows every crawler', () => {
    expect(robots).toContain('User-agent: *\nAllow: /');
    for (const agent of ['Googlebot', 'Bingbot', 'GPTBot', 'ClaudeBot', 'PerplexityBot']) {
      expect(robots).toContain(`User-agent: ${agent}\nAllow: /`);
    }
  });

  it('points at the sitemap on the site host', () => {
    expect(robots).toContain('Sitemap: https://sample-person.test/sitemap.xml');
  });
});

describe('renderSitemapXml', () => {
  it('lists the canonical URL with the given date', () => {
    const sitemap = renderSitemapXml(metadata, '2026-09-06');

    expect(sitemap).toContain('<loc>https://sample-person.test/</loc>');
    expect(sitemap).toContain('<lastmod>2026-09-06</lastmod>');
    expect(sitemap.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
  });
});
