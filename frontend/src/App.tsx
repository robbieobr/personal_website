import React from 'react';
import { useTranslation } from 'react-i18next';
import ProfilePage from './pages/ProfilePage';
import './App.css';

const App: React.FC = () => {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(event.target.value);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>
          <a href="/" className="App-header-link">{t('app.title')}</a>
        </h1>
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
      </header>
      <main>
        <ProfilePage />
      </main>
    </div>
  );
};

export default App;
