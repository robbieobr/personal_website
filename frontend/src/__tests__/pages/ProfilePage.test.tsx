import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProfilePage from '../../pages/ProfilePage';
import { getUserProfile } from '../../services/api';
import { UserProfile } from '../../types/index';

vi.mock('react-i18next', () => {
  const t = (key: string) => key;
  return {
    useTranslation: () => ({
      t,
      i18n: { language: 'en' },
    }),
  };
});

vi.mock('../../services/api', () => ({
  getUserProfile: vi.fn(),
}));

const mockGetUserProfile = getUserProfile as ReturnType<typeof vi.fn>;

const mockProfile: UserProfile = {
  user: {
    id: 1,
    name: 'John Doe',
    title: 'Full Stack Developer',
    email: 'john@example.com',
    phone: '+1 555 1234',
    profileImage: null,
    bio: 'Passionate developer.',
  },
  jobHistory: [
    {
      id: 1,
      userId: 1,
      company: 'Tech Corp',
      position: 'Senior Engineer',
      startDate: '2021-01-01',
      endDate: null,
      description: 'Led development.',
    },
  ],
  education: [
    {
      id: 1,
      userId: 1,
      institution: 'State University',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      startDate: '2014-09-01',
      endDate: '2018-05-31',
      description: null,
    },
  ],
};

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders the loading skeleton initially', () => {
    mockGetUserProfile.mockReturnValue(new Promise(() => {}));
    const { container } = render(<ProfilePage />);
    expect(container.querySelector('.profile-page')).toBeInTheDocument();
  });

  it('shows error state when fetch fails', async () => {
    mockGetUserProfile.mockRejectedValue(new Error('Network error'));
    render(<ProfilePage />);
    await waitFor(() => {
      expect(screen.getByText('profilePage.error')).toBeInTheDocument();
    });
  });

  it('shows no data state when profile resolves to null', async () => {
    mockGetUserProfile.mockResolvedValue(null as unknown as UserProfile);
    render(<ProfilePage />);
    await waitFor(() => {
      expect(screen.getByText('profilePage.noData')).toBeInTheDocument();
    });
  });

  it('renders profile data on successful fetch', async () => {
    mockGetUserProfile.mockResolvedValue(mockProfile);
    render(<ProfilePage />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'John Doe', level: 1 })).toBeInTheDocument();
    });
  });

  it('renders job history on successful fetch', async () => {
    mockGetUserProfile.mockResolvedValue(mockProfile);
    render(<ProfilePage />);
    await waitFor(() => {
      expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    });
    expect(screen.getByText('Senior Engineer')).toBeInTheDocument();
  });

  it('renders education history on successful fetch', async () => {
    mockGetUserProfile.mockResolvedValue(mockProfile);
    render(<ProfilePage />);
    await waitFor(() => {
      expect(screen.getByText('State University')).toBeInTheDocument();
    });
    expect(screen.getByText('Bachelor of Science')).toBeInTheDocument();
  });

  it('calls getUserProfile with user ID 1', async () => {
    mockGetUserProfile.mockResolvedValue(mockProfile);
    render(<ProfilePage />);
    await waitFor(() => {
      expect(mockGetUserProfile).toHaveBeenCalledWith(1);
    });
  });
});
