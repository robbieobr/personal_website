import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('renders the ProfilePage component', () => {
    renderWithProviders(<App />);
    expect(screen.getByTestId('profile-page')).toBeInTheDocument();
  });

  it('title is a link to "/"', () => {
    renderWithProviders(<App />);
    const link = screen.getByRole('link', { name: 'My Portfolio' });
    expect(link).toHaveAttribute('href', '/');
  });

  it('renders a translated skip link pointing at the main landmark', () => {
    renderWithProviders(<App />);
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute(
      'href',
      '#main-content'
    );
  });

  describe('language toggle (UX-2)', () => {
    it('renders a labelled two-item group, not a native select', () => {
      renderWithProviders(<App />);
      expect(screen.getByRole('group', { name: 'Language' })).toBeInTheDocument();
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });

    it('shows the active language as pressed', () => {
      renderWithProviders(<App />);
      expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
      expect(screen.getByRole('button', { name: 'Gaeilge' })).toHaveAttribute(
        'aria-pressed',
        'false'
      );
    });

    it('keeps the visible label inside the accessible name (WCAG 2.5.3)', () => {
      renderWithProviders(<App />);
      const english = screen.getByRole('button', { name: 'English' });
      expect(english).toHaveTextContent('EN');
      expect(english.getAttribute('aria-label')?.toLowerCase()).toContain(
        english.textContent!.toLowerCase()
      );
    });

    it('switches language on click', async () => {
      renderWithProviders(<App />);
      await userEvent.click(screen.getByRole('button', { name: 'Gaeilge' }));
      expect(testI18n.language).toBe('ga');
      expect(screen.getByRole('button', { name: 'Gaeilge' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
    });
  });

  describe('theme switcher (UX-2)', () => {
    it('collapses the palettes behind one labelled icon button', () => {
      renderWithProviders(<App />);
      const trigger = screen.getByRole('button', { name: 'Theme' });
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    });

    it('exposes all 5 palettes as radios when opened', async () => {
      renderWithProviders(<App />);
      await userEvent.click(screen.getByRole('button', { name: 'Theme' }));
      const group = screen.getByRole('radiogroup', { name: 'Theme' });
      expect(within(group).getAllByRole('radio')).toHaveLength(5);
      for (const name of [
        'Light',
        'Dark',
        'High contrast',
        'Colour-blind friendly',
        'Colour-blind friendly, high contrast',
      ]) {
        expect(within(group).getByRole('radio', { name })).toBeInTheDocument();
      }
    });

    it('drops the "HC" jargon from the visible labels', async () => {
      renderWithProviders(<App />);
      await userEvent.click(screen.getByRole('button', { name: 'Theme' }));
      const group = screen.getByRole('radiogroup', { name: 'Theme' });
      expect(group.textContent).not.toMatch(/\bHC\b/);
    });

    it('defaults to the light palette', async () => {
      renderWithProviders(<App />);
      await userEvent.click(screen.getByRole('button', { name: 'Theme' }));
      expect(screen.getByRole('radio', { name: 'Light' })).toBeChecked();
    });

    it('applies a palette without closing the panel, so arrow keys still work', async () => {
      renderWithProviders(<App />);
      await userEvent.click(screen.getByRole('button', { name: 'Theme' }));
      await userEvent.click(screen.getByRole('radio', { name: 'Dark' }));
      expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    it('closes on Escape and returns focus to the trigger', async () => {
      renderWithProviders(<App />);
      const trigger = screen.getByRole('button', { name: 'Theme' });
      await userEvent.click(trigger);
      await userEvent.keyboard('{Escape}');
      expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });

    it('closes when a click lands outside the switcher', async () => {
      renderWithProviders(<App />);
      await userEvent.click(screen.getByRole('button', { name: 'Theme' }));
      await userEvent.click(screen.getByTestId('profile-page'));
      expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    });

    it('toggles shut when the trigger is clicked again', async () => {
      renderWithProviders(<App />);
      const trigger = screen.getByRole('button', { name: 'Theme' });
      await userEvent.click(trigger);
      await userEvent.click(trigger);
      expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    });
  });

  describe('document language (A11Y-2)', () => {
    it('sets <html lang> from the active i18n language', () => {
      renderWithProviders(<App />);
      expect(document.documentElement.lang).toBe('en');
    });

    it('updates <html lang> when the language changes', async () => {
      renderWithProviders(<App />);
      await userEvent.click(screen.getByRole('button', { name: 'Gaeilge' }));
      expect(document.documentElement.lang).toBe('ga');
      await userEvent.click(screen.getByRole('button', { name: 'Gaeilge' }));
      expect(document.documentElement.lang).toBe('ga');
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
});
