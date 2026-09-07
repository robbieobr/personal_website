import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ProfilePage from './pages/ProfilePage';
import { useTheme } from './hooks/useTheme';
import { themes, type ThemeId } from './themes';
import './App.css';

const stripProtocol = (url: string) => url.replace(/^https?:\/\//, '');

const LANGUAGES = [
  { code: 'en', shortKey: 'language.enShort', nameKey: 'language.en' },
  { code: 'ga', shortKey: 'language.gaShort', nameKey: 'language.ga' },
] as const;

/** Half-filled disc: the conventional "appearance" glyph. */
const AppearanceIcon: React.FC = () => (
  <svg className="theme-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M12 3a9 9 0 010 18z" fill="currentColor" />
  </svg>
);

const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { themeId, setThemeId } = useTheme();
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const themeSwitcherRef = useRef<HTMLDivElement>(null);
  const themeTriggerRef = useRef<HTMLButtonElement>(null);

  const displayUrl =
    import.meta.env.PROD && import.meta.env.VITE_APP_URL
      ? stripProtocol(import.meta.env.VITE_APP_URL)
      : null;

  // Keep <html lang> in step with the UI language. Without this the whole
  // document stays lang="en" and a screen reader pronounces Irish through an
  // English synthesiser.
  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const closeThemeMenu = useCallback(() => {
    setThemeMenuOpen(false);
    themeTriggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!themeMenuOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeThemeMenu();
      }
    };
    const onPointerDown = (event: MouseEvent) => {
      if (!themeSwitcherRef.current?.contains(event.target as Node)) {
        setThemeMenuOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [themeMenuOpen, closeThemeMenu]);

  return (
    <div className="App">
      <a href="#main-content" className="skip-link">
        {t('app.skipToContent')}
      </a>
      <header className="App-header">
        <p className="site-title">
          <a href="/" className="App-header-link">
            {displayUrl || t('app.title')}
          </a>
        </p>
        <div className="header-actions">
          <button type="button" className="download-btn" onClick={() => window.print()}>
            {t('profilePage.downloadCV')}
          </button>

          {/* Two toggle buttons rather than a <select>: the native dropdown
              painted platform grey-gradient chrome onto the navy bar, and with
              exactly two options a segmented control is one click instead of
              two. Both halves stay in the tab order. */}
          <div className="lang-toggle" role="group" aria-label={t('language.label')}>
            {LANGUAGES.map((language) => (
              <button
                key={language.code}
                type="button"
                data-lang={language.code}
                className="lang-toggle-option"
                aria-pressed={i18n.language === language.code}
                // The visible "EN" is a prefix of the accessible name
                // "English", so this still satisfies Label in Name (2.5.3).
                aria-label={t(language.nameKey)}
                onClick={() => i18n.changeLanguage(language.code)}
              >
                {t(language.shortKey)}
              </button>
            ))}
          </div>

          <div className="theme-switcher" ref={themeSwitcherRef}>
            <button
              type="button"
              ref={themeTriggerRef}
              className="theme-trigger"
              aria-label={t('themes.label')}
              aria-haspopup="true"
              aria-expanded={themeMenuOpen}
              onClick={() => setThemeMenuOpen((open) => !open)}
            >
              <AppearanceIcon />
            </button>
            {themeMenuOpen && (
              // Native radios, so arrow keys move between palettes for free and
              // the group announces "n of 5". Choosing one applies it but does
              // not close the panel, which would otherwise make keyboard
              // browsing impossible.
              <div className="theme-menu" role="radiogroup" aria-label={t('themes.label')}>
                {themes.map((theme) => (
                  <label key={theme.id} className="theme-menu-option">
                    <input
                      type="radio"
                      name="theme"
                      value={theme.id}
                      checked={themeId === theme.id}
                      onChange={() => setThemeId(theme.id as ThemeId)}
                    />
                    <span>{t(`themes.${theme.i18nKey}`)}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>
      {/* tabIndex={-1} makes the skip link actually move focus here. Without it
          Safari and Firefox leave document.activeElement on <body>. */}
      <main id="main-content" tabIndex={-1}>
        <ProfilePage />
      </main>
      <footer className="App-footer">
        <p>
          {new Date().getFullYear()} — {displayUrl || t('app.title')}
        </p>
      </footer>
    </div>
  );
};

export default App;
