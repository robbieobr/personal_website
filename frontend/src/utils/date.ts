/**
 * Month names for locales the runtime's ICU data does not cover.
 *
 * Chromium ships no `ga` data: `Intl.DateTimeFormat.supportedLocalesOf(['ga'])`
 * returns `[]` and `toLocaleDateString('ga', { month: 'long' })` silently falls
 * back to English. Node's full-ICU build does resolve `ga`, so the two runtimes
 * disagree. Formatting from this table whenever the locale is unsupported keeps
 * browser and test output identical.
 */
const MONTH_NAMES: Readonly<Record<string, readonly string[]>> = {
  ga: [
    'Eanáir',
    'Feabhra',
    'Márta',
    'Aibreán',
    'Bealtaine',
    'Meitheamh',
    'Iúil',
    'Lúnasa',
    'Meán Fómhair',
    'Deireadh Fómhair',
    'Samhain',
    'Nollaig',
  ],
};

/** The base language subtag, e.g. `ga-IE` -> `ga`. */
const baseLanguage = (locale: string): string => locale.split('-')[0].toLowerCase();

/**
 * True when the runtime has no date data for `locale` and would quietly format
 * it as English instead.
 */
const isUnsupportedLocale = (locale: string): boolean => {
  try {
    return Intl.DateTimeFormat.supportedLocalesOf([locale]).length === 0;
  } catch {
    // An invalid BCP 47 tag throws RangeError; treat it as unsupported.
    return true;
  }
};

export function formatDate(dateString: string, locale: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return dateString;
  }

  const fallback = MONTH_NAMES[baseLanguage(locale)];
  if (fallback && isUnsupportedLocale(locale)) {
    return `${fallback[date.getMonth()]} ${date.getFullYear()}`;
  }

  return date.toLocaleDateString(locale, { year: 'numeric', month: 'long' });
}
