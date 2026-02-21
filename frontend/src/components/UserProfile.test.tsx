import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import UserProfileComponent from './UserProfile';
import { renderWithProviders } from '../test/utils';
import { mockUser } from '../test/fixtures';

describe('UserProfile', () => {
  it('renders user name and title', () => {
    renderWithProviders(<UserProfileComponent user={mockUser} />);
    expect(screen.getByText(mockUser.name)).toBeInTheDocument();
    expect(screen.getByText(mockUser.title)).toBeInTheDocument();
  });

  it('renders email and phone as links', () => {
    renderWithProviders(<UserProfileComponent user={mockUser} />);
    const emailLink = screen.getByRole('link', { name: mockUser.email });
    expect(emailLink).toHaveAttribute('href', `mailto:${mockUser.email}`);
    const phoneLink = screen.getByRole('link', { name: mockUser.phone });
    expect(phoneLink).toHaveAttribute('href', `tel:${mockUser.phone}`);
  });

  it('renders bio when provided', () => {
    renderWithProviders(<UserProfileComponent user={mockUser} />);
    expect(screen.getByText(mockUser.bio!)).toBeInTheDocument();
  });

  it('renders placeholder image when profileImage is null', () => {
    renderWithProviders(<UserProfileComponent user={mockUser} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/images/placeholder-profile.png');
  });

  it('renders provided profile image', () => {
    const userWithImage = { ...mockUser, profileImage: '/images/custom.png' };
    renderWithProviders(<UserProfileComponent user={userWithImage} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/images/custom.png');
  });

  it('does not render bio section when bio is null and not loading', () => {
    const userNoBio = { ...mockUser, bio: null };
    renderWithProviders(<UserProfileComponent user={userNoBio} />);
    expect(screen.queryByText('About')).not.toBeInTheDocument();
  });

  it('renders skeleton when loading is true', () => {
    renderWithProviders(<UserProfileComponent loading={true} />);
    // The bio/about section should be visible during loading
    expect(screen.getByText('About')).toBeInTheDocument();
    // No real name text when loading
    expect(screen.queryByText(mockUser.name)).not.toBeInTheDocument();
  });
});
