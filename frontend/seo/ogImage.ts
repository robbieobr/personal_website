/**
 * Draws the 1200x630 social card: circular photo on the left, name, role, a
 * skills line and the domain along the bottom.
 *
 * When no photo is available the text column takes the full width instead.
 */

import sharp, { type OverlayOptions } from 'sharp';
import type { SiteMetadata } from './metadata';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/** Distance every drawn element keeps from the edges. */
export const SAFE_MARGIN = 60;

export const OG_COLORS = {
  background: '#0d1f36',
  name: '#f5f7fa',
  role: '#c8d3e0',
  accent: '#2ec4c6',
  domain: '#8fa3bd',
};

const FONT_STACK = "'DejaVu Sans', 'Liberation Sans', 'Helvetica Neue', Arial, sans-serif";

const PHOTO_DIAMETER = 300;
const PHOTO_LEFT = 90;
const PHOTO_TOP = 165;
const PHOTO_RING_WIDTH = 6;

const TEXT_LEFT_WITH_PHOTO = 460;
const TEXT_LEFT_ALONE = SAFE_MARGIN;
const TEXT_RIGHT = OG_WIDTH - SAFE_MARGIN;

const NAME_MAX_SIZE = 84;
const NAME_MIN_SIZE = 44;
const ROLE_MAX_SIZE = 40;
const ROLE_MIN_SIZE = 26;
const SKILLS_SIZE = 28;
const DOMAIN_SIZE = 24;
const DOMAIN_LETTER_SPACING = 3;
const DOMAIN_BASELINE = 552;

/** Skills joined into the line under the role. */
const SKILLS_SHOWN = 3;
const SKILLS_SEPARATOR = ' · ';

/**
 * Per-character width as a fraction of the font size, approximating the metrics
 * of the sans-serif stack above. Used to shrink text that would otherwise run
 * past the safe margin.
 */
function characterWidth(char: string): number {
  if (char === ' ') return 0.32;
  if ('iljtI.,:;\'!|[]()/\\"`'.includes(char)) return 0.3;
  if ('fr'.includes(char)) return 0.38;
  if ('mw'.includes(char)) return 0.9;
  if ('MW'.includes(char)) return 0.95;
  if (char >= 'A' && char <= 'Z') return 0.68;
  if (char >= '0' && char <= '9') return 0.64;
  return 0.56;
}

export function estimateTextWidth(text: string, fontSize: number, letterSpacing = 0): number {
  const glyphs = [...text].reduce((total, char) => total + characterWidth(char), 0) * fontSize;
  return glyphs + Math.max(0, text.length - 1) * letterSpacing;
}

/** The largest size in the range at which `text` fits `maxWidth`. */
export function fitFontSize(
  text: string,
  maxWidth: number,
  maxSize: number,
  minSize: number
): number {
  for (let size = maxSize; size > minSize; size -= 1) {
    if (estimateTextWidth(text, size) <= maxWidth) return size;
  }
  return minSize;
}

/** Shortens `text` with a trailing ellipsis until it fits `maxWidth`. */
export function truncateToWidth(
  text: string,
  fontSize: number,
  maxWidth: number,
  letterSpacing = 0
): string {
  if (estimateTextWidth(text, fontSize, letterSpacing) <= maxWidth) return text;

  let clipped = text;
  while (
    clipped.length > 1 &&
    estimateTextWidth(`${clipped}\u2026`, fontSize, letterSpacing) > maxWidth
  ) {
    clipped = clipped.slice(0, -1);
  }

  return `${clipped.trimEnd()}\u2026`;
}

/** The text and size to draw so a line fills the available width without passing it. */
export function fitText(
  text: string,
  maxWidth: number,
  maxSize: number,
  minSize: number,
  letterSpacing = 0
): { text: string; fontSize: number } {
  const fontSize = fitFontSize(text, maxWidth, maxSize, minSize);
  return { text: truncateToWidth(text, fontSize, maxWidth, letterSpacing), fontSize };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Joins as many leading skills as fit the available width, or an empty string if none do. */
export function fitSkillsLine(skills: string[], maxWidth: number): string {
  for (let count = Math.min(SKILLS_SHOWN, skills.length); count > 0; count -= 1) {
    const line = skills.slice(0, count).join(SKILLS_SEPARATOR);
    if (estimateTextWidth(line, SKILLS_SIZE) <= maxWidth) return line;
  }
  return '';
}

function textElement(
  content: string,
  x: number,
  y: number,
  fontSize: number,
  fill: string,
  extra = ''
): string {
  return (
    `<text x="${x}" y="${y}" font-family="${FONT_STACK}" font-size="${fontSize}" ` +
    `fill="${fill}"${extra}>${escapeXml(content)}</text>`
  );
}

/** Builds the SVG layer drawn over the background and the photo. */
export function buildOverlaySvg(metadata: SiteMetadata, hasPhoto: boolean): string {
  const left = hasPhoto ? TEXT_LEFT_WITH_PHOTO : TEXT_LEFT_ALONE;
  const width = TEXT_RIGHT - left;

  const name = fitText(metadata.name, width, NAME_MAX_SIZE, NAME_MIN_SIZE);
  const role = fitText(metadata.jobTitle, width, ROLE_MAX_SIZE, ROLE_MIN_SIZE);
  const skillsLine = fitSkillsLine(metadata.skills, width);

  const nameBaseline = hasPhoto ? 258 : 268;
  const roleBaseline = nameBaseline + 60;
  const skillsBaseline = roleBaseline + 48;

  const parts = [
    textElement(name.text, left, nameBaseline, name.fontSize, OG_COLORS.name),
    textElement(role.text, left, roleBaseline, role.fontSize, OG_COLORS.role),
  ];

  if (skillsLine) {
    parts.push(textElement(skillsLine, left, skillsBaseline, SKILLS_SIZE, OG_COLORS.accent));
  }

  parts.push(
    textElement(
      truncateToWidth(metadata.host.toUpperCase(), DOMAIN_SIZE, width, DOMAIN_LETTER_SPACING),
      left,
      DOMAIN_BASELINE,
      DOMAIN_SIZE,
      OG_COLORS.domain,
      ` letter-spacing="${DOMAIN_LETTER_SPACING}"`
    )
  );

  if (hasPhoto) {
    const radius = PHOTO_DIAMETER / 2;
    parts.unshift(
      `<circle cx="${PHOTO_LEFT + radius}" cy="${PHOTO_TOP + radius}" ` +
        `r="${radius - PHOTO_RING_WIDTH / 2}" fill="none" ` +
        `stroke="${OG_COLORS.accent}" stroke-width="${PHOTO_RING_WIDTH}" />`
    );
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}">` +
    `${parts.join('')}</svg>`
  );
}

/** Crops the photo to a circle of the card's photo diameter. */
async function circularPhoto(photo: Buffer): Promise<Buffer> {
  const radius = PHOTO_DIAMETER / 2;
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${PHOTO_DIAMETER}" height="${PHOTO_DIAMETER}">` +
      `<circle cx="${radius}" cy="${radius}" r="${radius}" fill="#ffffff" /></svg>`
  );

  return sharp(photo)
    .resize(PHOTO_DIAMETER, PHOTO_DIAMETER, { fit: 'cover', position: 'centre' })
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

/**
 * Renders the card as a PNG.
 *
 * A photo that cannot be decoded is dropped and the text-only layout is used.
 */
export async function renderOgImage(metadata: SiteMetadata, photo: Buffer | null): Promise<Buffer> {
  let circle: Buffer | null = null;

  if (photo) {
    try {
      circle = await circularPhoto(photo);
    } catch {
      circle = null;
    }
  }

  const layers: OverlayOptions[] = [];
  if (circle) layers.push({ input: circle, left: PHOTO_LEFT, top: PHOTO_TOP });
  layers.push({ input: Buffer.from(buildOverlaySvg(metadata, circle !== null)), left: 0, top: 0 });

  return sharp({
    create: {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      channels: 4,
      background: OG_COLORS.background,
    },
  })
    .composite(layers)
    .png({ compressionLevel: 9 })
    .toBuffer();
}
