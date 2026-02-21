import type { User, JobEntry, Education } from '../src/types/index';

export const mockUser: User = {
  id: 1,
  name: 'Jane Doe',
  title: 'Software Engineer',
  email: 'jane@example.com',
  phone: '+1-555-123-4567',
  profileImage: 'https://example.com/image.jpg',
  bio: 'Experienced software engineer.',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

export const mockJob: JobEntry = {
  id: 1,
  userId: 1,
  company: 'Acme Corp',
  position: 'Senior Engineer',
  startDate: new Date('2020-01-01T00:00:00.000Z'),
  endDate: null,
  description: 'Built cool things.',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

export const mockEducation: Education = {
  id: 1,
  userId: 1,
  institution: 'State University',
  degree: 'BSc',
  field: 'Computer Science',
  startDate: new Date('2016-09-01T00:00:00.000Z'),
  endDate: new Date('2020-05-01T00:00:00.000Z'),
  description: 'Graduated with honours.',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};
