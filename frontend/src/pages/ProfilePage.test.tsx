import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import ProfilePage from './ProfilePage';
import { renderWithProviders } from '../test/utils';
import { mockUserProfile } from '../test/fixtures';

vi.mock('../services/api', () => ({
  getUserProfile: vi.fn(),
}));

describe('ProfilePage', () => {
  let getUserProfile: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const apiModule = await import('../services/api');
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
    getUserProfile.mockResolvedValue(null as unknown as ReturnType<typeof getUserProfile>);
    renderWithProviders(<ProfilePage />);
    await waitFor(() => {
      expect(screen.getByText('No profile data available')).toBeInTheDocument();
    });
  });
});
