import { useState, useEffect } from 'react';
import { themes, DEFAULT_THEME_ID, THEME_STORAGE_KEY, type ThemeId } from '../themes';

function applyTheme(themeId: ThemeId): void {
  const theme = themes.find(t => t.id === themeId) ?? themes[0];
  const root = document.documentElement;
  Object.entries(theme.cssVars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

export function useTheme() {
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId | null;
    return themes.some(t => t.id === saved) ? saved! : DEFAULT_THEME_ID;
  });

  useEffect(() => {
    applyTheme(themeId);
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
  }, [themeId]);

  return { themeId, setThemeId };
}
