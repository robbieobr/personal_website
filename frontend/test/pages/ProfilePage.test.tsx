import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfilePage from '../../src/pages/ProfilePage';
import { renderWithProviders } from '../utils';
import { mockUserProfile } from '../fixtures';

vi.mock('../../src/services/api', () => ({
  getUserProfile: vi.fn(),
}));

describe('ProfilePage', () => {
  let getUserProfile: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const apiModule = await import('../../src/services/api');
    getUserProfile = apiModule.getUserProfile as ReturnType<typeof vi.fn>;
    getUserProfile.mockReset();
  });

  it('shows skeleton while loading', () => {
    getUserProfile.mockReturnValue(new Promise(() => {})); // never resolves
    renderWithProviders(<ProfilePage />);
    // During loading a skeleton is rendered; no profile text yet
    expect(screen.queryByText(mockUserProfile.user.name)).not.toBeInTheDocument();
  });

  it('renders profile data after successful fetch', async () => {
    getUserProfile.mockResolvedValue(mockUserProfile);
    renderWithProviders(<ProfilePage />);
    await waitFor(() => {
      expect(screen.getByText(mockUserProfile.user.name)).toBeInTheDocument();
    });
    expect(screen.getByText(mockUserProfile.jobHistory[0].position)).toBeInTheDocument();
    expect(screen.getByText(mockUserProfile.education[0].degree)).toBeInTheDocument();
    expect(screen.getByText(mockUserProfile.projects[0].title)).toBeInTheDocument();
    expect(screen.getByText(mockUserProfile.skills[0].skill)).toBeInTheDocument();
    expect(screen.getByText(mockUserProfile.achievements[0].title)).toBeInTheDocument();
  });

  it('sets a descriptive document title once the profile loads', async () => {
    getUserProfile.mockResolvedValue(mockUserProfile);
    const { unmount } = renderWithProviders(<ProfilePage />);
    await waitFor(() => {
      expect(document.title).toBe(`${mockUserProfile.user.name} | ${mockUserProfile.user.title}`);
    });
    unmount();
    // Cleanup restores the pre-existing (static) title, never a weaker one.
    expect(document.title).not.toBe(mockUserProfile.user.name);
  });

  it('shows error message when fetch fails', async () => {
    getUserProfile.mockRejectedValue(new Error('Network error'));
    renderWithProviders(<ProfilePage />);
    await waitFor(() => {
      expect(
        screen.getByText("This profile didn't load. Check your connection and try again.")
      ).toBeInTheDocument();
    });
  });

  it('shows no data message when profile is null', async () => {
    getUserProfile.mockResolvedValue(null as unknown as ReturnType<typeof getUserProfile>);
    renderWithProviders(<ProfilePage />);
    await waitFor(() => {
      expect(screen.getByText('No profile data available')).toBeInTheDocument();
    });
  });

  describe('status announcements (A11Y-3)', () => {
    it('announces loading in a live region', () => {
      getUserProfile.mockReturnValue(new Promise(() => {}));
      renderWithProviders(<ProfilePage />);
      const status = screen.getByRole('status');
      expect(status).toHaveTextContent('Loading profile');
      expect(status).toHaveAttribute('aria-live', 'polite');
    });

    it('keeps the same live region mounted and announces completion', async () => {
      getUserProfile.mockResolvedValue(mockUserProfile);
      renderWithProviders(<ProfilePage />);
      const status = screen.getByRole('status');
      await waitFor(() => {
        expect(status).toHaveTextContent('Profile loaded.');
      });
      // The region must survive the state change, or nothing is announced.
      expect(screen.getByRole('status')).toBe(status);
    });

    it('drops the aria-busy / aria-label pair from the page wrapper', () => {
      getUserProfile.mockReturnValue(new Promise(() => {}));
      const { container } = renderWithProviders(<ProfilePage />);
      const wrapper = container.querySelector('.profile-page')!;
      // aria-label is not exposed on a role="generic" element, and aria-busy
      // here suppressed the skeleton library's own live regions.
      expect(wrapper).not.toHaveAttribute('aria-busy');
      expect(wrapper).not.toHaveAttribute('aria-label');
    });
  });

  describe('error recovery (UX-5)', () => {
    it('offers a retry action that refetches the profile', async () => {
      getUserProfile.mockRejectedValueOnce(new Error('Network error'));
      getUserProfile.mockResolvedValueOnce(mockUserProfile);
      renderWithProviders(<ProfilePage />);

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent("This profile didn't load.");

      await userEvent.click(within(alert).getByRole('button', { name: 'Try again' }));

      await waitFor(() => {
        expect(screen.getByText(mockUserProfile.user.name)).toBeInTheDocument();
      });
      expect(getUserProfile).toHaveBeenCalledTimes(2);
    });

    it('mentions no server-side infrastructure in the error copy', async () => {
      getUserProfile.mockRejectedValue(new Error('Network error'));
      renderWithProviders(<ProfilePage />);
      const alert = await screen.findByRole('alert');
      expect(alert.textContent).not.toMatch(/backend|server|api/i);
    });
  });
});
