import { describe, it, expect } from 'vitest';
import { formatDate } from '../../src/utils/date';

describe('formatDate', () => {
  it('formats a valid ISO date string using the given locale', () => {
    const result = formatDate('2022-06-01', 'en');
    expect(result).toContain('2022');
    expect(result).toMatch(/June|Jun/);
  });

  it('returns the original string when the date is invalid', () => {
    expect(formatDate('not-a-date', 'en')).toBe('not-a-date');
    expect(formatDate('', 'en')).toBe('');
  });

  it('formats with a different locale', () => {
    const result = formatDate('2020-01-15', 'ga');
    expect(result).toContain('2020');
  });
});
