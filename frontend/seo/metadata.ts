/**
 * Turns a site host and a site owner into the document head, the crawler files
 * and the values the social card is drawn from.
 */

import type { HtmlTagDescriptor } from 'vite';
import type { SiteOwner } from './seed';

export const OG_IMAGE_FILE = 'og-image.png';
export const ROBOTS_FILE = 'robots.txt';
export const SITEMAP_FILE = 'sitemap.xml';

/** Length at which the meta description is trimmed. */
const DESCRIPTION_LIMIT = 160;

/** Contact types whose values are public profiles elsewhere. */
const PROFILE_CONTACT_TYPES = ['github', 'linkedin', 'website'];

/** Crawlers named individually so each gets an explicit allow rule. */
const NAMED_CRAWLERS = ['Googlebot', 'Bingbot', 'GPTBot', 'ClaudeBot', 'PerplexityBot'];

export interface SiteMetadata {
  host: string;
  origin: string;
  canonical: string;
  pageTitle: string;
  description: string;
  name: string;
  jobTitle: string;
  ogImageUrl: string;
  ogImageAlt: string;
  profileImageUrl: string | null;
  email: string | null;
  sameAs: string[];
  employer: string | null;
  institution: string | null;
  skills: string[];
}

function collapse(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/** Keeps whole sentences up to the description limit, trimming on a word boundary otherwise. */
function summarise(bio: string, fallback: string): string {
  const text = collapse(bio);
  if (!text) return fallback;
  if (text.length <= DESCRIPTION_LIMIT) return text;

  let summary = '';
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    const candidate = summary ? `${summary} ${sentence}` : sentence;
    if (candidate.length > DESCRIPTION_LIMIT) break;
    summary = candidate;
  }
  if (summary) return summary;

  const clipped = text.slice(0, DESCRIPTION_LIMIT - 1);
  const lastSpace = clipped.lastIndexOf(' ');
  return `${(lastSpace > 0 ? clipped.slice(0, lastSpace) : clipped).replace(/[,;:.]$/, '')}…`;
}

/** The hostname of an absolute http(s) URL, without any `www.` prefix. */
function hostnameOf(value: string): string | null {
  if (!/^https?:\/\//i.test(value)) return null;
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

export function buildMetadata(owner: SiteOwner, host: string): SiteMetadata {
  const origin = `https://${host}`;
  const email = owner.contacts.find((contact) => contact.type === 'email')?.value ?? null;

  const sameAs = owner.contacts
    .filter((contact) => PROFILE_CONTACT_TYPES.includes(contact.type))
    .map((contact) => contact.value)
    // The site's own address is the canonical URL, not a profile elsewhere.
    .filter((url) => {
      const hostname = hostnameOf(url);
      return hostname !== null && hostname !== host.replace(/^www\./, '');
    });

  const profileImage = owner.profileImage?.replace(/^\/+/, '') ?? null;

  return {
    host,
    origin,
    canonical: `${origin}/`,
    pageTitle: `${owner.name} | ${owner.title}`,
    description: summarise(owner.bio, `${owner.name} — ${owner.title}`),
    name: owner.name,
    jobTitle: owner.title,
    ogImageUrl: `${origin}/${OG_IMAGE_FILE}`,
    ogImageAlt: `${owner.name}, ${owner.title}`,
    profileImageUrl: profileImage ? `${origin}/${profileImage}` : null,
    email,
    sameAs,
    employer: owner.employer,
    institution: owner.institution,
    skills: owner.skills,
  };
}

/** Builds the schema.org graph describing the person, the page and the site. */
export function buildJsonLd(metadata: SiteMetadata, language: string): Record<string, unknown> {
  const person: Record<string, unknown> = {
    '@type': 'Person',
    '@id': `${metadata.origin}/#person`,
    name: metadata.name,
    url: metadata.canonical,
    jobTitle: metadata.jobTitle,
    description: metadata.description,
  };

  if (metadata.profileImageUrl) person.image = metadata.profileImageUrl;
  if (metadata.email) person.email = `mailto:${metadata.email}`;
  if (metadata.employer) {
    person.worksFor = { '@type': 'Organization', name: metadata.employer };
  }
  if (metadata.institution) {
    person.alumniOf = { '@type': 'CollegeOrUniversity', name: metadata.institution };
  }
  if (metadata.sameAs.length > 0) person.sameAs = metadata.sameAs;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      person,
      {
        '@type': 'ProfilePage',
        '@id': `${metadata.origin}/#profilepage`,
        url: metadata.canonical,
        name: metadata.pageTitle,
        description: metadata.description,
        inLanguage: language,
        isPartOf: { '@id': `${metadata.origin}/#website` },
        mainEntity: { '@id': `${metadata.origin}/#person` },
      },
      {
        '@type': 'WebSite',
        '@id': `${metadata.origin}/#website`,
        url: metadata.canonical,
        name: metadata.name,
        inLanguage: language,
      },
    ],
  };
}

/**
 * Builds the head tags for the document.
 *
 * Attribute values are escaped by Vite when it serialises the tags. The JSON-LD
 * body is inserted verbatim, so `<` is written as an escape to keep the payload
 * from closing the script element early.
 */
export function buildHeadTags(metadata: SiteMetadata, language: string): HtmlTagDescriptor[] {
  const meta = (attrs: Record<string, string>): HtmlTagDescriptor => ({
    tag: 'meta',
    attrs,
    injectTo: 'head',
  });

  return [
    { tag: 'link', attrs: { rel: 'canonical', href: metadata.canonical }, injectTo: 'head' },
    meta({ name: 'description', content: metadata.description }),

    meta({ property: 'og:type', content: 'profile' }),
    meta({ property: 'og:title', content: metadata.pageTitle }),
    meta({ property: 'og:description', content: metadata.description }),
    meta({ property: 'og:url', content: metadata.canonical }),
    meta({ property: 'og:image', content: metadata.ogImageUrl }),
    meta({ property: 'og:image:width', content: '1200' }),
    meta({ property: 'og:image:height', content: '630' }),
    meta({ property: 'og:image:alt', content: metadata.ogImageAlt }),

    meta({ name: 'twitter:card', content: 'summary_large_image' }),
    meta({ name: 'twitter:title', content: metadata.pageTitle }),
    meta({ name: 'twitter:description', content: metadata.description }),
    meta({ name: 'twitter:image', content: metadata.ogImageUrl }),
    meta({ name: 'twitter:image:alt', content: metadata.ogImageAlt }),

    {
      tag: 'script',
      attrs: { type: 'application/ld+json' },
      children: JSON.stringify(buildJsonLd(metadata, language), null, 2).replace(/</g, '\\u003c'),
      injectTo: 'head',
    },
  ];
}

export function renderRobotsTxt(metadata: SiteMetadata): string {
  const groups = ['*', ...NAMED_CRAWLERS]
    .map((agent) => `User-agent: ${agent}\nAllow: /\n`)
    .join('\n');

  return `${groups}\nSitemap: ${metadata.origin}/${SITEMAP_FILE}\n`;
}

export function renderSitemapXml(metadata: SiteMetadata, lastModified: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${metadata.canonical}</loc>
    <lastmod>${lastModified}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;
}
