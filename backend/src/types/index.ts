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
