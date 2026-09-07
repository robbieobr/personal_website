export type ThemeId = 'light' | 'dark' | 'high-contrast' | 'colour-blind' | 'colour-blind-hc';

export interface Theme {
  id: ThemeId;
  label: string;
  i18nKey: string;
  /**
   * Drives the CSS `color-scheme` property, which is what tells the browser to
   * render native controls (the theme picker's radios, scrollbars, form
   * widgets) in the matching appearance. Without it a dark palette still gets
   * bright white radio buttons.
   */
  colorScheme: 'light' | 'dark';
  cssVars: Record<string, string>;
}

export const themes: Theme[] = [
  {
    id: 'light',
    label: 'Light',
    i18nKey: 'light',
    colorScheme: 'light',
    cssVars: {
      '--color-navy': '#0d1f36',
      '--color-teal': '#0a9ba4',
      '--color-teal-bright': '#12bdc8',
      '--color-teal-light': '#e3f6f8',
      '--color-background': '#f0ece7',
      '--color-surface': '#ffffff',
      '--color-text-primary': '#0d1f36',
      '--color-text-secondary': '#445566',
      '--color-text-muted': '#5a6470',
      '--color-border': '#dcd6ce',
      '--color-bio-text': '#c8dde8',
      '--color-error': '#d32f2f',
      '--color-teal-accessible': '#065f65',
      '--color-profile-bg-start': '#0d1f36',
      '--color-profile-bg-end': '#0a2740',
      '--color-focus-ring': '#12bdc8',
    },
  },
  {
    id: 'dark',
    label: 'Dark',
    i18nKey: 'dark',
    colorScheme: 'dark',
    cssVars: {
      // Elevation ladder, darkest ground first. The previous palette had none:
      // the hero (#0d1827) and the page (#0f172a) were an identical 1.00:1 —
      // the card was literally invisible — while the sticky header was lighter
      // than both, inverting the light-mode relationship. Now
      // background < surface < hero/header, and every text pair on these
      // grounds clears AA (lowest is 7.1:1, the job title on the hero).
      '--color-navy': '#213152', // chrome + hero, top of the ladder (L* 20.6)
      '--color-teal': '#22d3ee',
      '--color-teal-bright': '#22d3ee',
      '--color-teal-light': '#0b3c50', // project role chip, 6.5:1 with the teal on it
      '--color-background': '#0a1120', // page ground, darkest (L* 5.2)
      '--color-surface': '#182335', // cards, one step up (L* 13.6)
      '--color-text-primary': '#f1f5f9',
      '--color-text-secondary': '#cbd5e1',
      '--color-text-muted': '#9fb0c4', // 8.5:1 on the page ground (footer)
      '--color-border': '#33445f',
      '--color-bio-text': '#94a3b8',
      '--color-error': '#f87171',
      '--color-teal-accessible': '#22d3ee',
      '--color-profile-bg-start': '#213152',
      '--color-profile-bg-end': '#18243d',
      '--color-focus-ring': '#67e8f9',
    },
  },
  {
    id: 'high-contrast',
    label: 'High Contrast',
    i18nKey: 'highContrast',
    colorScheme: 'light',
    cssVars: {
      '--color-navy': '#000000',
      '--color-teal': '#000000',
      '--color-teal-bright': '#ffff00',
      '--color-teal-light': '#ffff00',
      '--color-background': '#ffffff',
      '--color-surface': '#ffffff',
      '--color-text-primary': '#000000',
      '--color-text-secondary': '#000000',
      '--color-text-muted': '#000000',
      '--color-border': '#000000',
      '--color-bio-text': '#ffffff',
      '--color-error': '#cc0000',
      '--color-teal-accessible': '#000000',
      '--color-profile-bg-start': '#000000',
      '--color-profile-bg-end': '#000000',
      '--color-focus-ring': '#ffff00',
    },
  },
  {
    id: 'colour-blind',
    label: 'Colour Blind',
    i18nKey: 'colourBlind',
    colorScheme: 'light',
    cssVars: {
      '--color-navy': '#1b3a7a',
      '--color-teal': '#0060a8',
      '--color-teal-bright': '#aad4ff',
      '--color-teal-light': '#ddeeff',
      '--color-background': '#f5f5f0',
      '--color-surface': '#ffffff',
      '--color-text-primary': '#0a1f5c',
      '--color-text-secondary': '#2d4a7a',
      '--color-text-muted': '#3d5280',
      '--color-border': '#b0c4de',
      '--color-bio-text': '#c8dde8',
      '--color-error': '#b34d00',
      '--color-teal-accessible': '#004d8a',
      '--color-profile-bg-start': '#1b3a7a',
      '--color-profile-bg-end': '#0d2660',
      '--color-focus-ring': '#ff9900',
    },
  },
  {
    id: 'colour-blind-hc',
    label: 'Colour Blind HC',
    i18nKey: 'colourBlindHC',
    colorScheme: 'light',
    cssVars: {
      '--color-navy': '#000033',
      '--color-teal': '#000033',
      '--color-teal-bright': '#5aa0ff',
      '--color-teal-light': '#e8f0ff',
      '--color-background': '#ffffff',
      '--color-surface': '#ffffff',
      '--color-text-primary': '#000000',
      '--color-text-secondary': '#000000',
      '--color-text-muted': '#000000',
      '--color-border': '#000033',
      '--color-bio-text': '#ffffff',
      '--color-error': '#8b3300',
      '--color-teal-accessible': '#000033',
      '--color-profile-bg-start': '#000033',
      '--color-profile-bg-end': '#000033',
      '--color-focus-ring': '#ff8c00',
    },
  },
];

export const DEFAULT_THEME_ID: ThemeId = 'light';
export const THEME_STORAGE_KEY = 'portfolio-theme';
