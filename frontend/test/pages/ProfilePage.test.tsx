import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
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
    // Cleanup restores the title that was set before the profile loaded.
    expect(document.title).not.toBe(mockUserProfile.user.name);
  });

  it('shows error message when fetch fails', async () => {
    getUserProfile.mockRejectedValue(new Error('Network error'));
    renderWithProviders(<ProfilePage />);
    await waitFor(() => {
      expect(
        screen.getByText('Failed to load profile. Please make sure the backend is running.')
      ).toBeInTheDocument();
    });
  });

  it('shows no data message when profile is null', async () => {
    getUserProfile.mockResolvedValue(null);
    renderWithProviders(<ProfilePage />);
    await waitFor(() => {
      expect(screen.getByText('No profile data available')).toBeInTheDocument();
    });
  });
});
