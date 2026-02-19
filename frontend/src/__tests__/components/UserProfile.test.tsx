import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import UserProfileComponent from '../../components/UserProfile';
import { User } from '../../types/index';

vi.mock('react-i18next', () => {
  const t = (key: string) => key;
  return {
    useTranslation: () => ({
      t,
      i18n: { language: 'en' },
    }),
  };
});

const mockUser: User = {
  id: 1,
  name: 'Jane Smith',
  title: 'Software Engineer',
  email: 'jane@example.com',
  phone: '+1 555 9876',
  profileImage: null,
  bio: 'Passionate developer.',
};

describe('UserProfileComponent', () => {
  it('shows skeleton when loading', () => {
    const { container } = render(<UserProfileComponent loading={true} />);
    expect(container.querySelector('.user-profile')).toBeInTheDocument();
  });

  it('renders user name', () => {
    render(<UserProfileComponent user={mockUser} />);
    expect(screen.getByRole('heading', { name: 'Jane Smith', level: 1 })).toBeInTheDocument();
  });

  it('renders user title', () => {
    render(<UserProfileComponent user={mockUser} />);
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
  });

  it('renders email as a mailto link', () => {
    render(<UserProfileComponent user={mockUser} />);
    const emailLink = screen.getByRole('link', { name: 'jane@example.com' });
    expect(emailLink).toHaveAttribute('href', 'mailto:jane@example.com');
  });

  it('renders phone as a tel link', () => {
    render(<UserProfileComponent user={mockUser} />);
    const phoneLink = screen.getByRole('link', { name: '+1 555 9876' });
    expect(phoneLink).toHaveAttribute('href', 'tel:+1 555 9876');
  });

  it('renders bio when provided', () => {
    render(<UserProfileComponent user={mockUser} />);
    expect(screen.getByText('Passionate developer.')).toBeInTheDocument();
    expect(screen.getByText('userProfile.about')).toBeInTheDocument();
  });

  it('does not render bio section when bio is absent', () => {
    const userWithoutBio: User = { ...mockUser, bio: null };
    render(<UserProfileComponent user={userWithoutBio} />);
    expect(screen.queryByText('userProfile.about')).not.toBeInTheDocument();
  });

  it('uses placeholder image when profileImage is null', () => {
    render(<UserProfileComponent user={mockUser} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/images/placeholder-profile.png');
  });

  it('uses provided profileImage URL', () => {
    const userWithImage: User = { ...mockUser, profileImage: '/images/custom.png' };
    render(<UserProfileComponent user={userWithImage} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/images/custom.png');
  });

  it('shows bio section when loading is true (no user)', () => {
    const { container } = render(<UserProfileComponent loading={true} />);
    expect(container.querySelector('.profile-bio')).toBeInTheDocument();
  });

  it('renders profile image with empty alt when no user', () => {
    const { container } = render(<UserProfileComponent loading={false} />);
    const img = container.querySelector('img.profile-image');
    expect(img).toHaveAttribute('alt', '');
  });
});
