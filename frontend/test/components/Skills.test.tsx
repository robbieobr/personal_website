import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import Skills from '../../src/components/Skills';
import { renderWithProviders } from '../utils';
import { mockSkill, mockSkill2 } from '../fixtures';

describe('Skills', () => {
  it('renders no skills message when skills is empty', () => {
    renderWithProviders(<Skills skills={[]} />);
    expect(screen.getByText('No skills available')).toBeInTheDocument();
  });

  it('renders no skills message when skills is undefined', () => {
    renderWithProviders(<Skills />);
    expect(screen.getByText('No skills available')).toBeInTheDocument();
  });

  it('renders a skill', () => {
    renderWithProviders(<Skills skills={[mockSkill]} />);
    expect(screen.getByText(mockSkill.skill)).toBeInTheDocument();
  });

  it('renders multiple skills', () => {
    renderWithProviders(<Skills skills={[mockSkill, mockSkill2]} />);
    expect(screen.getByText(mockSkill.skill)).toBeInTheDocument();
    expect(screen.getByText(mockSkill2.skill)).toBeInTheDocument();
  });

  it('renders skills as list items', () => {
    renderWithProviders(<Skills skills={[mockSkill, mockSkill2]} />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
  });

  it('renders skeleton when loading', () => {
    renderWithProviders(<Skills loading={true} />);
    expect(screen.getByText('Skills')).toBeInTheDocument();
  });
});
