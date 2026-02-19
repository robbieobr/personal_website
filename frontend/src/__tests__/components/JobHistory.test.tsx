import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import JobHistory from '../../components/JobHistory';
import { JobEntry } from '../../types/index';

vi.mock('react-i18next', () => {
  const t = (key: string) => key;
  return {
    useTranslation: () => ({
      t,
      i18n: { language: 'en' },
    }),
  };
});

const mockJobs: JobEntry[] = [
  {
    id: 1,
    userId: 1,
    company: 'Tech Corp',
    position: 'Senior Engineer',
    startDate: '2021-01-15',
    endDate: null,
    description: 'Led development of microservices.',
  },
  {
    id: 2,
    userId: 1,
    company: 'StartUp Inc',
    position: 'Full Stack Developer',
    startDate: '2019-06-01',
    endDate: '2021-01-14',
    description: null,
  },
];

describe('JobHistory', () => {
  it('shows skeleton when loading', () => {
    const { container } = render(<JobHistory loading={true} />);
    expect(container.querySelector('.job-history')).toBeInTheDocument();
    expect(screen.getByText('jobHistory.title')).toBeInTheDocument();
  });

  it('shows no history message when jobs array is empty', () => {
    render(<JobHistory jobs={[]} />);
    expect(screen.getByText('jobHistory.noHistory')).toBeInTheDocument();
  });

  it('shows no history message when jobs is undefined', () => {
    render(<JobHistory />);
    expect(screen.getByText('jobHistory.noHistory')).toBeInTheDocument();
  });

  it('renders job history title', () => {
    render(<JobHistory jobs={mockJobs} />);
    expect(screen.getByRole('heading', { name: 'jobHistory.title', level: 2 })).toBeInTheDocument();
  });

  it('renders all job positions', () => {
    render(<JobHistory jobs={mockJobs} />);
    expect(screen.getByRole('heading', { name: 'Senior Engineer', level: 3 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Full Stack Developer', level: 3 })).toBeInTheDocument();
  });

  it('renders company names', () => {
    render(<JobHistory jobs={mockJobs} />);
    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    expect(screen.getByText('StartUp Inc')).toBeInTheDocument();
  });

  it('shows "present" translation for jobs with no end date', () => {
    render(<JobHistory jobs={mockJobs} />);
    expect(screen.getByText(/jobHistory\.present/)).toBeInTheDocument();
  });

  it('renders job description when provided', () => {
    render(<JobHistory jobs={mockJobs} />);
    expect(screen.getByText('Led development of microservices.')).toBeInTheDocument();
  });

  it('does not render description paragraph when description is null', () => {
    render(<JobHistory jobs={mockJobs} />);
    const descriptions = screen.queryAllByText(/null/);
    expect(descriptions).toHaveLength(0);
  });

  it('formats start and end dates', () => {
    render(<JobHistory jobs={mockJobs} />);
    const dateElements = screen.getAllByText(/January 2021/);
    expect(dateElements.length).toBeGreaterThanOrEqual(1);
  });
});
