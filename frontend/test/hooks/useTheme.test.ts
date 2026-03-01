import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from '../../src/hooks/useTheme';
import { themes, DEFAULT_THEME_ID, THEME_STORAGE_KEY } from '../../src/themes';

describe('useTheme', () => {
  let getItemSpy: ReturnType<typeof vi.spyOn>;
  let setItemSpy: ReturnType<typeof vi.spyOn>;
  let setPropertySpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
    setPropertySpy = vi.spyOn(document.documentElement.style, 'setProperty').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the default theme id when localStorage is empty', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.themeId).toBe(DEFAULT_THEME_ID);
  });

  it('reads a valid saved theme from localStorage on mount', () => {
    getItemSpy.mockReturnValue('dark');
    const { result } = renderHook(() => useTheme());
    expect(result.current.themeId).toBe('dark');
  });

  it('falls back to default when an unknown theme id is saved', () => {
    getItemSpy.mockReturnValue('not-a-real-theme');
    const { result } = renderHook(() => useTheme());
    expect(result.current.themeId).toBe(DEFAULT_THEME_ID);
  });

  it('applies CSS variables to document.documentElement on mount', () => {
    renderHook(() => useTheme());
    const lightTheme = themes.find(t => t.id === DEFAULT_THEME_ID)!;
    const [firstKey, firstValue] = Object.entries(lightTheme.cssVars)[0];
    expect(setPropertySpy).toHaveBeenCalledWith(firstKey, firstValue);
  });

  it('applies CSS variables for all vars in the theme', () => {
    renderHook(() => useTheme());
    const lightTheme = themes.find(t => t.id === DEFAULT_THEME_ID)!;
    const varCount = Object.keys(lightTheme.cssVars).length;
    expect(setPropertySpy).toHaveBeenCalledTimes(varCount);
  });

  it('persists the theme to localStorage on mount', () => {
    renderHook(() => useTheme());
    expect(setItemSpy).toHaveBeenCalledWith(THEME_STORAGE_KEY, DEFAULT_THEME_ID);
  });

  it('updates themeId and applies new CSS vars when setThemeId is called', () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.setThemeId('dark');
    });
    expect(result.current.themeId).toBe('dark');
    const darkTheme = themes.find(t => t.id === 'dark')!;
    const [firstKey, firstValue] = Object.entries(darkTheme.cssVars)[0];
    expect(setPropertySpy).toHaveBeenCalledWith(firstKey, firstValue);
  });

  it('persists the new theme to localStorage when setThemeId is called', () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.setThemeId('high-contrast');
    });
    expect(setItemSpy).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'high-contrast');
  });
});
