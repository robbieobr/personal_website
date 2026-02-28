import { UserProfile, User, JobEntry, Education, Project, Skill, Achievement, ContactInfo } from '../src/types/index';

export const mockUser: User = {
  id: 1,
  name: 'Jane Doe',
  title: 'Software Engineer',
  profileImage: null,
  bio: 'A passionate engineer.',
};

export const mockContactInfo: ContactInfo = {
  id: 1,
  userId: 1,
  type: 'email',
  value: 'jane@example.com',
  displayOrder: 1,
};

export const mockContactInfoPhone: ContactInfo = {
  id: 2,
  userId: 1,
  type: 'phone',
  value: '+44 7700 900001',
  displayOrder: 2,
};

export const mockContactInfoWebsite: ContactInfo = {
  id: 3,
  userId: 1,
  type: 'website',
  value: 'https://www.jane.example.com',
  displayOrder: 3,
};

export const mockContactInfoGithub: ContactInfo = {
  id: 4,
  userId: 1,
  type: 'github',
  value: 'https://github.com/janedoe',
  displayOrder: 4,
};

export const mockContactInfoLinkedin: ContactInfo = {
  id: 5,
  userId: 1,
  type: 'linkedin',
  value: 'https://www.linkedin.com/in/janedoe',
  displayOrder: 5,
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

export const mockProject: Project = {
  id: 1,
  userId: 1,
  title: 'Portfolio Site',
  role: 'Lead Developer',
  description: 'Built a personal portfolio with React and Node.js.',
};

export const mockProjectNoDescription: Project = {
  id: 2,
  userId: 1,
  title: 'CLI Tool',
  role: 'Sole Developer',
  description: null,
};

export const mockSkill: Skill = {
  id: 1,
  userId: 1,
  skill: 'TypeScript',
};

export const mockSkill2: Skill = {
  id: 2,
  userId: 1,
  skill: 'React',
};

export const mockAchievement: Achievement = {
  id: 1,
  userId: 1,
  title: 'Employee of the Year',
  date: '2022-12-01',
  description: 'Recognised for outstanding contributions.',
};

export const mockAchievementNoDescription: Achievement = {
  id: 2,
  userId: 1,
  title: 'Open Source Contributor',
  date: '2021-06-15',
  description: null,
};

export const mockUserProfile: UserProfile = {
  user: mockUser,
  contactInfo: [mockContactInfo, mockContactInfoPhone],
  jobHistory: [mockJob, mockPastJob],
  education: [mockEducation, mockCurrentEducation],
  projects: [mockProject, mockProjectNoDescription],
  skills: [mockSkill, mockSkill2],
  achievements: [mockAchievement, mockAchievementNoDescription],
};
