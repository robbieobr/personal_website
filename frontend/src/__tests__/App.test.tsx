import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../App';

const { mockChangeLanguage } = vi.hoisted(() => ({
  mockChangeLanguage: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: mockChangeLanguage,
    },
  }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

vi.mock('../pages/ProfilePage', () => ({
  default: () => <div data-testid="profile-page">ProfilePage</div>,
}));

describe('App', () => {
  it('renders the app header', () => {
    render(<App />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('renders the title as a link', () => {
    render(<App />);
    const link = screen.getByRole('link', { name: 'app.title' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });

  it('renders the language selector', () => {
    render(<App />);
    const select = screen.getByRole('combobox', { name: /select language/i });
    expect(select).toBeInTheDocument();
  });

  it('language selector has English and Gaeilge options', () => {
    render(<App />);
    expect(screen.getByRole('option', { name: 'English' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Gaeilge' })).toBeInTheDocument();
  });

  it('calls changeLanguage when a language is selected', () => {
    render(<App />);
    const select = screen.getByRole('combobox', { name: /select language/i });
    fireEvent.change(select, { target: { value: 'ga' } });
    expect(mockChangeLanguage).toHaveBeenCalledWith('ga');
  });

  it('renders the ProfilePage', () => {
    render(<App />);
    expect(screen.getByTestId('profile-page')).toBeInTheDocument();
  });

  it('renders ProfilePage inside main element', () => {
    render(<App />);
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toContainElement(screen.getByTestId('profile-page'));
  });
});
