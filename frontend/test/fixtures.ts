import { UserProfile, User, JobEntry, Education } from '../src/types/index';

export const mockUser: User = {
  id: 1,
  name: 'Jane Doe',
  title: 'Software Engineer',
  email: 'jane@example.com',
  phone: '+1-555-0100',
  profileImage: null,
  bio: 'A passionate engineer.',
};

export const mockJob: JobEntry = {
  id: 1,
  userId: 1,
  company: 'Acme Corp',
  position: 'Senior Engineer',
  startDate: '2020-01-01',
  endDate: null,
  description: 'Led major projects.',
};

export const mockPastJob: JobEntry = {
  id: 2,
  userId: 1,
  company: 'Old Corp',
  position: 'Junior Engineer',
  startDate: '2018-06-01',
  endDate: '2019-12-31',
  description: null,
};

export const mockEducation: Education = {
  id: 1,
  userId: 1,
  institution: 'State University',
  degree: 'BSc Computer Science',
  field: 'Computer Science',
  startDate: '2014-09-01',
  endDate: '2018-05-31',
  description: 'Graduated with honours.',
};

export const mockCurrentEducation: Education = {
  id: 2,
  userId: 1,
  institution: 'Online Academy',
  degree: 'MSc AI',
  field: 'Artificial Intelligence',
  startDate: '2023-01-01',
  endDate: null,
  description: null,
};

export const mockUserProfile: UserProfile = {
  user: mockUser,
  jobHistory: [mockJob, mockPastJob],
  education: [mockEducation, mockCurrentEducation],
};
