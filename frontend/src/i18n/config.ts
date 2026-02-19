import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import gaTranslations from './locales/ga.json';

const resources = {
  en: {
    translation: enTranslations,
  },
  ga: {
    translation: gaTranslations,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: true,
    },
  });

export default i18n;
