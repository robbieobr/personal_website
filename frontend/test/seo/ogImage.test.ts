import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { buildMetadata } from '../../seo/metadata';
import {
  buildOverlaySvg,
  estimateTextWidth,
  fitFontSize,
  fitSkillsLine,
  fitText,
  OG_COLORS,
  OG_HEIGHT,
  OG_WIDTH,
  renderOgImage,
  SAFE_MARGIN,
  truncateToWidth,
} from '../../seo/ogImage';
import { metadata, owner } from './fixtures';

/** WCAG relative luminance of a #rrggbb colour. */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((offset) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground: string, background: string): number {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
};

/** The x, y, font-size and drawn text of every `<text>` element in the overlay. */
function textElements(svg: string) {
  return [
    ...svg.matchAll(/<text x="(\d+)" y="(\d+)"[^>]*font-size="(\d+)"[^>]*>([^<]*)<\/text>/g),
  ].map((match) => ({
    x: Number(match[1]),
    y: Number(match[2]),
    fontSize: Number(match[3]),
    text: match[4].replace(/&(amp|lt|gt|quot|apos);/g, (entity) => ENTITIES[entity]),
  }));
}

/** Bounding box of every pixel that differs from the card background. */
async function drawnBounds(png: Buffer) {
  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
  const ground = [13, 31, 54];

  let left = info.width;
  let right = -1;
  let top = info.height;
  let bottom = -1;

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const pixel = (y * info.width + x) * info.channels;
      const drawn = ground.some((value, channel) => Math.abs(data[pixel + channel] - value) > 12);
      if (!drawn) continue;

      left = Math.min(left, x);
      right = Math.max(right, x + 1);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y + 1);
    }
  }

  return right === -1 ? null : { left, right, top, bottom };
}

async function solidPhoto(): Promise<Buffer> {
  return sharp({
    create: { width: 600, height: 400, channels: 3, background: '#ff0000' },
  })
    .jpeg()
    .toBuffer();
}

describe('colour contrast', () => {
  it('clears 4.5:1 against the card background for every text colour', () => {
    for (const role of ['name', 'role', 'accent', 'domain'] as const) {
      expect(contrastRatio(OG_COLORS[role], OG_COLORS.background)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('estimateTextWidth', () => {
  it('grows with the font size', () => {
    expect(estimateTextWidth('Sample', 40)).toBeCloseTo(estimateTextWidth('Sample', 20) * 2, 5);
  });

  it('gives wide glyphs more room than narrow ones', () => {
    expect(estimateTextWidth('mmmm', 40)).toBeGreaterThan(estimateTextWidth('llll', 40));
    expect(estimateTextWidth('WWWW', 40)).toBeGreaterThan(estimateTextWidth('IIII', 40));
    expect(estimateTextWidth('ffff', 40)).toBeGreaterThan(estimateTextWidth('iiii', 40));
    expect(estimateTextWidth('AAAA', 40)).toBeGreaterThan(estimateTextWidth('1111', 40));
    expect(estimateTextWidth('    ', 40)).toBeLessThan(estimateTextWidth('aaaa', 40));
  });

  it('adds letter spacing between glyphs only', () => {
    expect(estimateTextWidth('ab', 40, 10)).toBeCloseTo(estimateTextWidth('ab', 40) + 10, 5);
    expect(estimateTextWidth('', 40, 10)).toBe(0);
  });
});

describe('fitFontSize', () => {
  it('keeps the maximum size when the text already fits', () => {
    expect(fitFontSize('Sam', 1000, 84, 44)).toBe(84);
  });

  it('shrinks the size until the text fits', () => {
    const size = fitFontSize('A very long name indeed', 400, 84, 20);
    expect(size).toBeLessThan(84);
    expect(estimateTextWidth('A very long name indeed', size)).toBeLessThanOrEqual(400);
  });

  it('stops at the minimum size', () => {
    expect(fitFontSize('A'.repeat(200), 100, 84, 44)).toBe(44);
  });
});

describe('fitSkillsLine', () => {
  it('joins the first three skills', () => {
    expect(fitSkillsLine(['Go', 'Rust', 'Zig', 'Elm'], 680)).toBe('Go · Rust · Zig');
  });

  it('joins fewer skills when there are fewer', () => {
    expect(fitSkillsLine(['Go'], 680)).toBe('Go');
  });

  it('drops skills that would not fit', () => {
    expect(fitSkillsLine(['A'.repeat(10), 'B'.repeat(10), 'C'.repeat(10)], 400)).toBe(
      'A'.repeat(10)
    );
  });

  it('returns nothing when no skill fits', () => {
    expect(fitSkillsLine(['A'.repeat(200)], 300)).toBe('');
  });

  it('returns nothing when there are no skills', () => {
    expect(fitSkillsLine([], 680)).toBe('');
  });
});

describe('buildOverlaySvg', () => {
  it('draws the name, role, skills and domain', () => {
    const texts = textElements(buildOverlaySvg(metadata, true)).map((element) => element.text);

    expect(texts).toEqual([
      "Sam O'Toole",
      'Staff Platform Engineer',
      'Kubernetes · Go · Terraform',
      'SAMPLE-PERSON.TEST',
    ]);
  });

  it('draws the photo ring only when there is a photo', () => {
    expect(buildOverlaySvg(metadata, true)).toContain('<circle');
    expect(buildOverlaySvg(metadata, false)).not.toContain('<circle');
  });

  it('moves the text column left when there is no photo', () => {
    const withPhoto = textElements(buildOverlaySvg(metadata, true))[0].x;
    const alone = textElements(buildOverlaySvg(metadata, false))[0].x;

    expect(alone).toBe(SAFE_MARGIN);
    expect(alone).toBeLessThan(withPhoto);
  });

  it('keeps every element inside the safe margin', () => {
    for (const hasPhoto of [true, false]) {
      for (const element of textElements(buildOverlaySvg(metadata, hasPhoto))) {
        expect(element.x).toBeGreaterThanOrEqual(SAFE_MARGIN);
        expect(element.y).toBeGreaterThanOrEqual(SAFE_MARGIN);
        expect(element.y).toBeLessThanOrEqual(OG_HEIGHT - SAFE_MARGIN);
        expect(element.x + estimateTextWidth(element.text, element.fontSize)).toBeLessThanOrEqual(
          OG_WIDTH - SAFE_MARGIN
        );
      }
    }
  });

  it('keeps a very long name inside the safe margin', () => {
    const long = buildMetadata({ ...owner, name: 'Wilhelmina Marchbanks-Wolstenholme' }, 'a.test');

    for (const element of textElements(buildOverlaySvg(long, true))) {
      expect(element.x + estimateTextWidth(element.text, element.fontSize)).toBeLessThanOrEqual(
        OG_WIDTH - SAFE_MARGIN
      );
    }
  });

  it('omits the skills line when there are no skills', () => {
    const noSkills = buildMetadata({ ...owner, skills: [] }, 'sample-person.test');
    expect(textElements(buildOverlaySvg(noSkills, true))).toHaveLength(3);
  });

  it('shortens a name that will not fit at the smallest size', () => {
    const long = buildMetadata({ ...owner, name: 'W'.repeat(60) }, 'sample-person.test');
    const [name] = textElements(buildOverlaySvg(long, true));

    expect(name.text.endsWith('\u2026')).toBe(true);
    expect(name.x + estimateTextWidth(name.text, name.fontSize)).toBeLessThanOrEqual(
      OG_WIDTH - SAFE_MARGIN
    );
  });

  it('shortens a host that will not fit', () => {
    const long = buildMetadata(owner, `${'sub.'.repeat(20)}site.test`);
    const domain = textElements(buildOverlaySvg(long, true)).at(-1);

    expect(domain?.text.endsWith('\u2026')).toBe(true);
  });

  it('escapes markup in the name', () => {
    const injected = buildMetadata({ ...owner, name: '<script>&"x"' }, 'sample-person.test');
    const svg = buildOverlaySvg(injected, true);

    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;script&gt;&amp;&quot;x&quot;');
  });
});

describe('truncateToWidth', () => {
  it('leaves text that already fits', () => {
    expect(truncateToWidth('Sam', 40, 1000)).toBe('Sam');
  });

  it('adds an ellipsis to text that does not fit', () => {
    const clipped = truncateToWidth('A very long line of text', 40, 200);

    expect(clipped.endsWith('\u2026')).toBe(true);
    expect(estimateTextWidth(clipped, 40)).toBeLessThanOrEqual(200);
  });

  it('trims trailing space before the ellipsis', () => {
    expect(truncateToWidth('aaaa bbbb', 40, 130)).not.toContain(' \u2026');
  });

  it('keeps at least one character', () => {
    expect(truncateToWidth('abcdef', 40, 1)).toBe('a\u2026');
  });

  it('accounts for letter spacing', () => {
    expect(truncateToWidth('abcdefgh', 24, 160, 20).length).toBeLessThan(
      truncateToWidth('abcdefgh', 24, 160).length
    );
  });
});

describe('fitText', () => {
  it('returns the text and the size it is drawn at', () => {
    expect(fitText('Sam', 1000, 84, 44)).toEqual({ text: 'Sam', fontSize: 84 });
  });

  it('shortens text that still does not fit at the smallest size', () => {
    const fitted = fitText('W'.repeat(80), 400, 84, 44);

    expect(fitted.fontSize).toBe(44);
    expect(estimateTextWidth(fitted.text, 44)).toBeLessThanOrEqual(400);
  });
});

describe('renderOgImage', () => {
  it('renders a 1200x630 PNG', async () => {
    const png = await sharp(await renderOgImage(metadata, null)).metadata();

    expect(png.format).toBe('png');
    expect(png.width).toBe(OG_WIDTH);
    expect(png.height).toBe(OG_HEIGHT);
  });

  it('draws text onto the background', async () => {
    const { data } = await sharp(await renderOgImage(metadata, null))
      .raw()
      .toBuffer({ resolveWithObject: true });

    const lightPixels = data.filter((_value, index) => index % 3 === 0 && data[index] > 120).length;
    expect(lightPixels).toBeGreaterThan(1000);
  });

  it('composites the photo when one is supplied', async () => {
    const withPhoto = await renderOgImage(metadata, await solidPhoto());
    const withoutPhoto = await renderOgImage(metadata, null);

    expect(withPhoto.equals(withoutPhoto)).toBe(false);

    const { data, info } = await sharp(withPhoto).raw().toBuffer({ resolveWithObject: true });
    const centre = (315 * info.width + 240) * info.channels;
    expect(data[centre]).toBeGreaterThan(200);
  });

  it('falls back to the text-only card when the photo cannot be decoded', async () => {
    const broken = await renderOgImage(metadata, Buffer.from('not an image'));
    expect(broken.equals(await renderOgImage(metadata, null))).toBe(true);
  });

  it.each([
    ['with a photo', true],
    ['without a photo', false],
  ])('keeps every drawn pixel inside the safe margin %s', async (_label, withPhoto) => {
    const png = await renderOgImage(metadata, withPhoto ? await solidPhoto() : null);
    const box = await drawnBounds(png);

    expect(box).not.toBeNull();
    expect(box?.left).toBeGreaterThanOrEqual(SAFE_MARGIN);
    expect(box?.top).toBeGreaterThanOrEqual(SAFE_MARGIN);
    expect(box?.right).toBeLessThanOrEqual(OG_WIDTH - SAFE_MARGIN);
    expect(box?.bottom).toBeLessThanOrEqual(OG_HEIGHT - SAFE_MARGIN);
  });
});
