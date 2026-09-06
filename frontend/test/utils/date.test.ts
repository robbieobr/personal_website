import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatDate } from '../../src/utils/date';

describe('formatDate', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('formats a valid ISO date string using the given locale', () => {
    const result = formatDate('2022-06-01', 'en');
    expect(result).toContain('2022');
    expect(result).toMatch(/June|Jun/);
  });

  it('returns the original string when the date is invalid', () => {
    expect(formatDate('not-a-date', 'en')).toBe('not-a-date');
    expect(formatDate('', 'en')).toBe('');
  });

  it('formats Irish months from the bundled table', () => {
    expect(formatDate('2021-08-01', 'ga')).toBe('Lúnasa 2021');
    expect(formatDate('2009-09-15', 'ga-IE')).toBe('Meán Fómhair 2009');
  });

  // Browsers ship no `ga` ICU data, so toLocaleDateString('ga') silently
  // returns English. Node's full-ICU build does resolve `ga`, which is why the
  // browser-only bug never surfaced in this suite. Stub the capability check to
  // reproduce browser conditions and prove the table takes over.
  it('uses the month table when the runtime has no data for the locale', () => {
    vi.spyOn(Intl.DateTimeFormat, 'supportedLocalesOf').mockReturnValue([]);
    expect(formatDate('2021-08-01', 'ga')).toBe('Lúnasa 2021');
    expect(formatDate('2013-01-31', 'ga')).toBe('Eanáir 2013');
    expect(formatDate('2016-12-01', 'ga')).toBe('Nollaig 2016');
  });

  it('falls back to Intl for locales with no bundled month table', () => {
    vi.spyOn(Intl.DateTimeFormat, 'supportedLocalesOf').mockReturnValue([]);
    expect(formatDate('2022-06-01', 'fr')).toContain('2022');
  });

  it('treats a locale tag the runtime rejects as unsupported', () => {
    vi.spyOn(Intl.DateTimeFormat, 'supportedLocalesOf').mockImplementation(() => {
      throw new RangeError('bad tag');
    });
    expect(formatDate('2021-08-01', 'ga')).toBe('Lúnasa 2021');
  });
});
