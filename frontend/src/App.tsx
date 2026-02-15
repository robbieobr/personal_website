import React from 'react';
import { useTranslation } from 'react-i18next';
import ProfilePage from './pages/ProfilePage';
import './App.css';

const App: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="App">
      <header className="App-header">
        <h1>
          <a href="/" className="App-header-link">{t('app.title')}</a>
        </h1>
      </header>
      <main>
        <ProfilePage />
      </main>
    </div>
  );
};

export default App;
