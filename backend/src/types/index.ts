export interface User {
  id: number;
  name: string;
  title: string;
  email: string;
  phone: string;
  profileImage: string | null;
  bio: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobEntry {
  id: number;
  userId: number;
  company: string;
  position: string;
  startDate: Date;
  endDate: Date | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Education {
  id: number;
  userId: number;
  institution: string;
  degree: string;
  field: string;
  startDate: Date;
  endDate: Date | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: number;
  userId: number;
  title: string;
  role: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Skill {
  id: number;
  userId: number;
  skill: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Achievement {
  id: number;
  userId: number;
  title: string;
  date: Date;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}
