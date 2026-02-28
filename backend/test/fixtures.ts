import type { User, JobEntry, Education, Project, Skill, Achievement, ContactInfo } from '../src/types/index';

export const mockUser: User = {
  id: 1,
  name: 'Jane Doe',
  title: 'Software Engineer',
  profileImage: 'https://example.com/image.jpg',
  bio: 'Experienced software engineer.',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

export const mockContactInfo: ContactInfo = {
  id: 1,
  userId: 1,
  type: 'email',
  value: 'jane@example.com',
  displayOrder: 1,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

export const mockContactInfoPhone: ContactInfo = {
  id: 2,
  userId: 1,
  type: 'phone',
  value: '+44 7700 900001',
  displayOrder: 2,
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

export const mockProject: Project = {
  id: 1,
  userId: 1,
  title: 'Portfolio Site',
  role: 'Lead Developer',
  description: 'Built a personal portfolio.',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

export const mockSkill: Skill = {
  id: 1,
  userId: 1,
  skill: 'TypeScript',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

export const mockAchievement: Achievement = {
  id: 1,
  userId: 1,
  title: 'Employee of the Year',
  date: new Date('2022-12-01T00:00:00.000Z'),
  description: 'Recognised for outstanding contributions.',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};
