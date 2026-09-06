import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import App from '../src/App';
import { renderWithProviders, testI18n } from './utils';

vi.mock('../src/pages/ProfilePage', () => ({
  default: () => <div data-testid="profile-page">Profile Page</div>,
}));

describe('App', () => {
  beforeEach(() => {
    // Language and <html lang> are global; earlier cases leave them switched.
    testI18n.changeLanguage('en');
    document.documentElement.lang = '';
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
    vi.spyOn(document.documentElement.style, 'setProperty').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the page title', () => {
    renderWithProviders(<App />);
    expect(screen.getByText('My Portfolio')).toBeInTheDocument();
  });

  it('renders the language selector', () => {
    renderWithProviders(<App />);
    const select = screen.getByRole('combobox', { name: /select language/i });
    expect(select).toBeInTheDocument();
  });

  it('renders English and Gaeilge language options', () => {
    renderWithProviders(<App />);
    expect(screen.getByRole('option', { name: 'English' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Gaeilge' })).toBeInTheDocument();
  });

  it('changes language when selector changes', () => {
    renderWithProviders(<App />);
    const select = screen.getByRole('combobox', { name: /select language/i });
    fireEvent.change(select, { target: { value: 'ga' } });
    expect((select as HTMLSelectElement).value).toBe('ga');
  });

  it('renders the ProfilePage component', () => {
    renderWithProviders(<App />);
    expect(screen.getByTestId('profile-page')).toBeInTheDocument();
  });

  it('title is a link to "/"', () => {
    renderWithProviders(<App />);
    const link = screen.getByRole('link', { name: 'My Portfolio' });
    expect(link).toHaveAttribute('href', '/');
  });

  describe('theme switcher', () => {
    it('renders the theme selector with correct aria-label', () => {
      renderWithProviders(<App />);
      const select = screen.getByRole('combobox', { name: /^theme$/i });
      expect(select).toBeInTheDocument();
    });

    it('renders all 5 theme options', () => {
      renderWithProviders(<App />);
      expect(screen.getByRole('option', { name: 'Light' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Dark' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'High contrast' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Colour-blind friendly' })).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: 'Colour-blind friendly, high contrast' })
      ).toBeInTheDocument();
    });

    it('defaults to the light theme', () => {
      renderWithProviders(<App />);
      const select = screen.getByRole('combobox', { name: /^theme$/i }) as HTMLSelectElement;
      expect(select.value).toBe('light');
    });

    it('updates the selected theme when changed', () => {
      renderWithProviders(<App />);
      const select = screen.getByRole('combobox', { name: /^theme$/i });
      fireEvent.change(select, { target: { value: 'dark' } });
      expect((select as HTMLSelectElement).value).toBe('dark');
    });
  });

  describe('in production mode', () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('shows the production URL as header text', () => {
      vi.stubEnv('PROD', true);
      vi.stubEnv('VITE_APP_URL', 'https://example.com');
      renderWithProviders(<App />);
      expect(screen.getByText('example.com')).toBeInTheDocument();
    });

    it('falls back to the app title when VITE_APP_URL is not set', () => {
      vi.stubEnv('PROD', true);
      renderWithProviders(<App />);
      expect(screen.getByText('My Portfolio')).toBeInTheDocument();
    });
  });

  describe('document language (A11Y-2)', () => {
    it('sets <html lang> from the active i18n language', () => {
      renderWithProviders(<App />);
      expect(document.documentElement.lang).toBe('en');
    });

    it('updates <html lang> when the language changes', () => {
      renderWithProviders(<App />);
      const select = screen.getByRole('combobox', { name: /select language/i });
      fireEvent.change(select, { target: { value: 'ga' } });
      expect(document.documentElement.lang).toBe('ga');
      fireEvent.change(select, { target: { value: 'en' } });
      expect(document.documentElement.lang).toBe('en');
    });
  });

  describe('landmarks (A11Y-1)', () => {
    it('wraps the page content in a main landmark', () => {
      renderWithProviders(<App />);
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('id', 'main-content');
      expect(main).toContainElement(screen.getByTestId('profile-page'));
    });

    it('makes the skip-link target programmatically focusable', () => {
      renderWithProviders(<App />);
      expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1');
    });
  });
});
