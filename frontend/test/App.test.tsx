import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import App from '../src/App';
import { renderWithProviders } from './utils';

vi.mock('../src/pages/ProfilePage', () => ({
  default: () => <div data-testid="profile-page">Profile Page</div>,
}));

describe('App', () => {
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

  describe('in production mode', () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('shows the production URL as header text', () => {
      vi.stubEnv('PROD', true);
      vi.stubEnv('VITE_APP_URL', 'https://example.com');
      renderWithProviders(<App />);
      expect(screen.getByText('https://example.com')).toBeInTheDocument();
    });

    it('falls back to the app title when VITE_APP_URL is not set', () => {
      vi.stubEnv('PROD', true);
      renderWithProviders(<App />);
      expect(screen.getByText('My Portfolio')).toBeInTheDocument();
    });
  });
});
