import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import ContactInfoComponent from '../../src/components/ContactInfo/ContactInfo';
import { renderWithProviders } from '../utils';
import {
  mockContactInfo,
  mockContactInfoPhone,
  mockContactInfoWebsite,
  mockContactInfoGithub,
  mockContactInfoLinkedin,
} from '../fixtures';

describe('ContactInfo', () => {
  it('renders nothing when contactInfo is undefined', () => {
    const { container } = renderWithProviders(<ContactInfoComponent />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when contactInfo is empty', () => {
    const { container } = renderWithProviders(<ContactInfoComponent contactInfo={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders email as a mailto link', () => {
    renderWithProviders(<ContactInfoComponent contactInfo={[mockContactInfo]} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', `mailto:${mockContactInfo.value}`);
    expect(link).toHaveTextContent(mockContactInfo.value);
  });

  it('renders phone as a tel link', () => {
    renderWithProviders(<ContactInfoComponent contactInfo={[mockContactInfoPhone]} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', `tel:${mockContactInfoPhone.value}`);
    expect(link).toHaveTextContent(mockContactInfoPhone.value);
  });

  it('renders website as an external link with rel noopener', () => {
    renderWithProviders(<ContactInfoComponent contactInfo={[mockContactInfoWebsite]} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', mockContactInfoWebsite.value);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders github as an external link with rel noopener', () => {
    renderWithProviders(<ContactInfoComponent contactInfo={[mockContactInfoGithub]} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', mockContactInfoGithub.value);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders linkedin as an external link with rel noopener', () => {
    renderWithProviders(<ContactInfoComponent contactInfo={[mockContactInfoLinkedin]} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', mockContactInfoLinkedin.value);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders all contact info entries', () => {
    renderWithProviders(
      <ContactInfoComponent
        contactInfo={[
          mockContactInfo,
          mockContactInfoPhone,
          mockContactInfoWebsite,
          mockContactInfoGithub,
          mockContactInfoLinkedin,
        ]}
      />
    );
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(5);
  });
});
