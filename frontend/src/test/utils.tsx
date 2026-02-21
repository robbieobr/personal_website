import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from '../i18n/locales/en.json';

// Create a test-specific i18n instance
const testI18n = i18n.createInstance();
testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: { en: { translation: enTranslations } },
  interpolation: { escapeValue: false },
});

const AllProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <I18nextProvider i18n={testI18n}>{children}</I18nextProvider>
);

const renderWithProviders = (ui: ReactElement, options?: RenderOptions) =>
  render(ui, { wrapper: AllProviders, ...options });

export { renderWithProviders, testI18n };
export * from '@testing-library/react';
