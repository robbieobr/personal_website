import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EducationHistory from '../../components/EducationHistory';
import { Education } from '../../types/index';

vi.mock('react-i18next', () => {
  const t = (key: string) => key;
  return {
    useTranslation: () => ({
      t,
      i18n: { language: 'en' },
    }),
  };
});

const mockEducation: Education[] = [
  {
    id: 1,
    userId: 1,
    institution: 'State University',
    degree: 'Bachelor of Science',
    field: 'Computer Science',
    startDate: '2014-09-01',
    endDate: '2018-05-31',
    description: 'Graduated with honors.',
  },
  {
    id: 2,
    userId: 1,
    institution: 'Tech Institute',
    degree: 'Master of Science',
    field: 'Software Engineering',
    startDate: '2018-09-01',
    endDate: null,
    description: null,
  },
];

describe('EducationHistory', () => {
  it('shows skeleton when loading', () => {
    const { container } = render(<EducationHistory loading={true} />);
    expect(container.querySelector('.education-history')).toBeInTheDocument();
    expect(screen.getByText('educationHistory.title')).toBeInTheDocument();
  });

  it('shows no history message when education array is empty', () => {
    render(<EducationHistory education={[]} />);
    expect(screen.getByText('educationHistory.noHistory')).toBeInTheDocument();
  });

  it('shows no history message when education is undefined', () => {
    render(<EducationHistory />);
    expect(screen.getByText('educationHistory.noHistory')).toBeInTheDocument();
  });

  it('renders education history title', () => {
    render(<EducationHistory education={mockEducation} />);
    expect(screen.getByRole('heading', { name: 'educationHistory.title', level: 2 })).toBeInTheDocument();
  });

  it('renders all degrees', () => {
    render(<EducationHistory education={mockEducation} />);
    expect(screen.getByRole('heading', { name: 'Bachelor of Science', level: 3 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Master of Science', level: 3 })).toBeInTheDocument();
  });

  it('renders institution names', () => {
    render(<EducationHistory education={mockEducation} />);
    expect(screen.getByText('State University')).toBeInTheDocument();
    expect(screen.getByText('Tech Institute')).toBeInTheDocument();
  });

  it('renders field of study', () => {
    render(<EducationHistory education={mockEducation} />);
    expect(screen.getByText('Computer Science')).toBeInTheDocument();
    expect(screen.getByText('Software Engineering')).toBeInTheDocument();
  });

  it('shows "present" translation for education with no end date', () => {
    render(<EducationHistory education={mockEducation} />);
    expect(screen.getByText(/educationHistory\.present/)).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<EducationHistory education={mockEducation} />);
    expect(screen.getByText('Graduated with honors.')).toBeInTheDocument();
  });

  it('does not render description paragraph when description is null', () => {
    render(<EducationHistory education={mockEducation} />);
    const nullTexts = screen.queryAllByText(/null/);
    expect(nullTexts).toHaveLength(0);
  });

  it('formats start and end dates', () => {
    render(<EducationHistory education={mockEducation} />);
    expect(screen.getByText(/September 2014/)).toBeInTheDocument();
    expect(screen.getByText(/May 2018/)).toBeInTheDocument();
  });
});
