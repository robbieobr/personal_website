import type { Page } from '@playwright/test';
import type { AxeResults, Result } from 'axe-core';

/** Every palette the theme switcher offers. */
export const THEMES = [
  'light',
  'dark',
  'high-contrast',
  'colour-blind',
  'colour-blind-hc',
] as const;

/** Every locale the language toggle offers. */
export const LOCALES = ['en', 'ga'] as const;

/** Accessible name of each language button, keyed by locale code. */
const LANGUAGE_NAMES: Record<(typeof LOCALES)[number], string> = {
  en: 'English',
  ga: 'Gaeilge',
};

/** Accessible name of each palette radio, keyed by theme id (English UI). */
const THEME_NAMES: Record<(typeof THEMES)[number], string> = {
  light: 'Light',
  dark: 'Dark',
  'high-contrast': 'High contrast',
  'colour-blind': 'Colour-blind friendly',
  'colour-blind-hc': 'Colour-blind friendly, high contrast',
};

/** Accessible name of each palette radio in Irish. */
const THEME_NAMES_GA: Record<(typeof THEMES)[number], string> = {
  light: 'Éadrom',
  dark: 'Dorcha',
  'high-contrast': 'Ard-chodarsnacht',
  'colour-blind': 'Oiriúnach do dhathdhaille',
  'colour-blind-hc': 'Dathdhaille, ard-chodarsnacht',
};

/** Switch language via the EN | GA segmented toggle. */
export async function setLanguage(page: Page, locale: (typeof LOCALES)[number]): Promise<void> {
  await page.getByRole('button', { name: LANGUAGE_NAMES[locale], exact: true }).click();
}

/**
 * Switch palette via the appearance button and its radio panel, then close the
 * panel again so it does not overlay the page under test.
 */
export async function setTheme(
  page: Page,
  theme: (typeof THEMES)[number],
  locale: (typeof LOCALES)[number] = 'en'
): Promise<void> {
  const names = locale === 'ga' ? THEME_NAMES_GA : THEME_NAMES;
  const label = locale === 'ga' ? 'Téama' : 'Theme';
  await page.getByRole('button', { name: label, exact: true }).click();
  await page.getByRole('radio', { name: names[theme], exact: true }).check();
  await page.keyboard.press('Escape');
}

/** One readable line per violation, so a failure names the offending nodes. */
export function summariseViolations(results: AxeResults): string[] {
  return results.violations.map(
    (violation: Result) =>
      `${violation.id} x${violation.nodes.length}: ` +
      violation.nodes
        .slice(0, 5)
        .map((node) => node.target.join(' '))
        .join(' | ')
  );
}
