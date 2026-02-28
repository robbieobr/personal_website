export interface ContactInfo {
  id: number;
  userId: number;
  type: 'email' | 'phone' | 'website' | 'github' | 'linkedin';
  value: string;
  displayOrder: number;
}

export interface User {
  id: number;
  name: string;
  title: string;
  profileImage: string | null;
  bio: string | null;
}

export interface JobEntry {
  id: number;
  userId: number;
  company: string;
  position: string;
  startDate: string;
  endDate: string | null;
  description: string | null;
}

export interface Education {
  id: number;
  userId: number;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string | null;
  description: string | null;
}

export interface Project {
  id: number;
  userId: number;
  title: string;
  role: string;
  description: string | null;
}

export interface Skill {
  id: number;
  userId: number;
  skill: string;
}

export interface Achievement {
  id: number;
  userId: number;
  title: string;
  date: string;
  description: string | null;
}

export interface UserProfile {
  user: User;
  contactInfo?: ContactInfo[];
  jobHistory: JobEntry[];
  education: Education[];
  projects: Project[];
  skills: Skill[];
  achievements: Achievement[];
}
