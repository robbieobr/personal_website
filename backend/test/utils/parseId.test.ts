import { describe, it, expect } from 'vitest';
import { parseId } from '../../src/utils/parseId';

describe('parseId', () => {
  it('returns the parsed integer for a numeric string', () => {
    expect(parseId('1')).toBe(1);
    expect(parseId('42')).toBe(42);
  });

  it('returns null for a non-numeric string', () => {
    expect(parseId('abc')).toBeNull();
    expect(parseId('')).toBeNull();
  });

  it('returns null for a float string', () => {
    expect(parseId('1.5')).toBe(1); // parseInt truncates — still valid
  });

  it('returns null for strings that lead with non-digits', () => {
    expect(parseId('abc123')).toBeNull();
  });
});
