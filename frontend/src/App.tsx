import React from 'react';
import { useTranslation } from 'react-i18next';
import ProfilePage from './pages/ProfilePage';
import { useTheme } from './hooks/useTheme';
import { themes, type ThemeId } from './themes';
import './App.css';

const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { themeId, setThemeId } = useTheme();

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
          <a href="/" className="App-header-link">{(import.meta.env.PROD && import.meta.env.VITE_APP_URL) || t('app.title')}</a>
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
              {themes.map(theme => (
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
      <div id="main-content">
        <ProfilePage />
      </div>
      <footer className="App-footer">
        <p>{new Date().getFullYear()} — My Portfolio</p>
      </footer>
    </div>
  );
};

export default App;
