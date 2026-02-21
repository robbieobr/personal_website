import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import JobHistory from './JobHistory';
import { renderWithProviders } from '../test/utils';
import { mockJob, mockPastJob } from '../test/fixtures';

describe('JobHistory', () => {
  it('renders no history message when jobs is empty', () => {
    renderWithProviders(<JobHistory jobs={[]} />);
    expect(screen.getByText('No job history available')).toBeInTheDocument();
  });

  it('renders no history message when jobs is undefined', () => {
    renderWithProviders(<JobHistory />);
    expect(screen.getByText('No job history available')).toBeInTheDocument();
  });

  it('renders job title and company', () => {
    renderWithProviders(<JobHistory jobs={[mockJob]} />);
    expect(screen.getByText(mockJob.position)).toBeInTheDocument();
    expect(screen.getByText(mockJob.company)).toBeInTheDocument();
  });

  it('renders "Present" for current job with no end date', () => {
    renderWithProviders(<JobHistory jobs={[mockJob]} />);
    expect(screen.getByText(/Present/)).toBeInTheDocument();
  });

  it('renders end date for past jobs', () => {
    renderWithProviders(<JobHistory jobs={[mockPastJob]} />);
    // Date formatting: December 2019 (or similar locale-dependent)
    expect(screen.getByText(/2019/)).toBeInTheDocument();
  });

  it('renders job description when provided', () => {
    renderWithProviders(<JobHistory jobs={[mockJob]} />);
    expect(screen.getByText(mockJob.description!)).toBeInTheDocument();
  });

  it('does not render description when null', () => {
    renderWithProviders(<JobHistory jobs={[mockPastJob]} />);
    expect(screen.queryByText('Led major projects.')).not.toBeInTheDocument();
  });

  it('renders multiple jobs', () => {
    renderWithProviders(<JobHistory jobs={[mockJob, mockPastJob]} />);
    expect(screen.getByText(mockJob.position)).toBeInTheDocument();
    expect(screen.getByText(mockPastJob.position)).toBeInTheDocument();
  });

  it('renders skeleton when loading', () => {
    renderWithProviders(<JobHistory loading={true} />);
    expect(screen.getByText('Job History')).toBeInTheDocument();
  });
});
