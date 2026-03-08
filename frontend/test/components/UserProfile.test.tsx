import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import UserProfileComponent from '../../src/components/UserProfile/UserProfile';
import { renderWithProviders } from '../utils';
import { mockUser, mockContactInfo, mockContactInfoPhone } from '../fixtures';

describe('UserProfile', () => {
  it('renders user name and title', () => {
    renderWithProviders(<UserProfileComponent user={mockUser} />);
    expect(screen.getByText(mockUser.name)).toBeInTheDocument();
    expect(screen.getByText(mockUser.title)).toBeInTheDocument();
  });

  it('renders contact info links when contactInfo is provided', () => {
    renderWithProviders(
      <UserProfileComponent user={mockUser} contactInfo={[mockContactInfo, mockContactInfoPhone]} />
    );
    const emailLink = screen.getByRole('link', { name: /jane@example.com/i });
    expect(emailLink).toHaveAttribute('href', `mailto:${mockContactInfo.value}`);
    const phoneLink = screen.getByRole('link', { name: /\+44 7700 900001/i });
    expect(phoneLink).toHaveAttribute('href', `tel:${mockContactInfoPhone.value}`);
  });

  it('renders nothing for contact info when contactInfo is empty', () => {
    renderWithProviders(<UserProfileComponent user={mockUser} contactInfo={[]} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders nothing for contact info when contactInfo is undefined', () => {
    renderWithProviders(<UserProfileComponent user={mockUser} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
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
