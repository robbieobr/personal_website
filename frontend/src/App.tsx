import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ProfilePage from './pages/ProfilePage';
import { useTheme } from './hooks/useTheme';
import { themes, type ThemeId } from './themes';
import './App.css';

const stripProtocol = (url: string) => url.replace(/^https?:\/\//, '');

const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { themeId, setThemeId } = useTheme();
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

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(event.target.value);
  };

  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setThemeId(event.target.value as ThemeId);
  };

  return (
    <div className="App">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <header className="App-header">
        <p className="site-title">
          <a href="/" className="App-header-link">
            {displayUrl || t('app.title')}
          </a>
        </p>
        <div className="header-actions">
          <button className="download-btn" onClick={() => window.print()}>
            {t('profilePage.downloadCV')}
          </button>
          <div className="theme-switcher">
            <select
              value={themeId}
              onChange={handleThemeChange}
              aria-label={t('themes.label')}
              className="theme-select"
            >
              {themes.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {t(`themes.${theme.i18nKey}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="language-switcher">
            <select
              value={i18n.language}
              onChange={handleLanguageChange}
              aria-label="Select language"
              className="language-select"
            >
              <option value="en">English</option>
              <option value="ga">Gaeilge</option>
            </select>
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
