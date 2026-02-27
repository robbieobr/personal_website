import { describe, it, expect } from 'vitest';
import { parseDate } from '../../src/utils/parseDate';

describe('parseDate', () => {
  it('returns a Date for a valid ISO date string', () => {
    const result = parseDate('2022-01-15');
    expect(result).toBeInstanceOf(Date);
    expect(result?.getFullYear()).toBe(2022);
  });

  it('returns null for an invalid date string', () => {
    expect(parseDate('not-a-date')).toBeNull();
    expect(parseDate('2022-13-01')).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(parseDate('')).toBeNull();
  });
});
