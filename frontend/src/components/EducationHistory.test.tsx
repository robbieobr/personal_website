import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import EducationHistory from './EducationHistory';
import { renderWithProviders } from '../test/utils';
import { mockEducation, mockCurrentEducation } from '../test/fixtures';

describe('EducationHistory', () => {
  it('renders no history message when education is empty', () => {
    renderWithProviders(<EducationHistory education={[]} />);
    expect(screen.getByText('No education history available')).toBeInTheDocument();
  });

  it('renders no history message when education is undefined', () => {
    renderWithProviders(<EducationHistory />);
    expect(screen.getByText('No education history available')).toBeInTheDocument();
  });

  it('renders degree and institution', () => {
    renderWithProviders(<EducationHistory education={[mockEducation]} />);
    expect(screen.getByText(mockEducation.degree)).toBeInTheDocument();
    expect(screen.getByText(mockEducation.institution)).toBeInTheDocument();
  });

  it('renders field of study', () => {
    renderWithProviders(<EducationHistory education={[mockEducation]} />);
    expect(screen.getByText(mockEducation.field)).toBeInTheDocument();
  });

  it('renders "Present" for current education with no end date', () => {
    renderWithProviders(<EducationHistory education={[mockCurrentEducation]} />);
    expect(screen.getByText(/Present/)).toBeInTheDocument();
  });

  it('renders end date for past education', () => {
    renderWithProviders(<EducationHistory education={[mockEducation]} />);
    expect(screen.getByText(/2018/)).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    renderWithProviders(<EducationHistory education={[mockEducation]} />);
    expect(screen.getByText(mockEducation.description!)).toBeInTheDocument();
  });

  it('does not render description when null', () => {
    renderWithProviders(<EducationHistory education={[mockCurrentEducation]} />);
    expect(screen.queryByText('Graduated with honours.')).not.toBeInTheDocument();
  });

  it('renders multiple education entries', () => {
    renderWithProviders(<EducationHistory education={[mockEducation, mockCurrentEducation]} />);
    expect(screen.getByText(mockEducation.degree)).toBeInTheDocument();
    expect(screen.getByText(mockCurrentEducation.degree)).toBeInTheDocument();
  });

  it('renders skeleton when loading', () => {
    renderWithProviders(<EducationHistory loading={true} />);
    expect(screen.getByText('Education')).toBeInTheDocument();
  });
});
