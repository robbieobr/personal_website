import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import Projects from '../../src/components/Projects/Projects';
import { renderWithProviders } from '../utils';
import { mockProject, mockProjectNoDescription } from '../fixtures';

describe('Projects', () => {
  it('renders no projects message when projects is empty', () => {
    renderWithProviders(<Projects projects={[]} />);
    expect(screen.getByText('No projects available')).toBeInTheDocument();
  });

  it('renders no projects message when projects is undefined', () => {
    renderWithProviders(<Projects />);
    expect(screen.getByText('No projects available')).toBeInTheDocument();
  });

  it('renders project title and role', () => {
    renderWithProviders(<Projects projects={[mockProject]} />);
    expect(screen.getByText(mockProject.title)).toBeInTheDocument();
    expect(screen.getByText(mockProject.role)).toBeInTheDocument();
  });

  it('renders project description when provided', () => {
    renderWithProviders(<Projects projects={[mockProject]} />);
    expect(screen.getByText(mockProject.description!)).toBeInTheDocument();
  });

  it('does not render description when null', () => {
    renderWithProviders(<Projects projects={[mockProjectNoDescription]} />);
    expect(screen.queryByText('Built a personal portfolio with React and Node.js.')).not.toBeInTheDocument();
  });

  it('renders multiple projects', () => {
    renderWithProviders(<Projects projects={[mockProject, mockProjectNoDescription]} />);
    expect(screen.getByText(mockProject.title)).toBeInTheDocument();
    expect(screen.getByText(mockProjectNoDescription.title)).toBeInTheDocument();
  });

  it('renders skeleton when loading', () => {
    renderWithProviders(<Projects loading={true} />);
    expect(screen.getByText('Projects')).toBeInTheDocument();
  });
});
