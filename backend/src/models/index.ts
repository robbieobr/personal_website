import pool from '../config/database';
import { User, JobEntry, Education, Project, Skill, Achievement, ContactInfo } from '../types/index';

export class UserModel {
  static async findById(id: number): Promise<User | null> {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT id, name, title, profileImage, bio, createdAt, updatedAt FROM users WHERE id = ?',
        [id]
      );
      const result = rows as User[];
      return result[0] || null;
    } finally {
      connection.release();
    }
  }

  static async findAll(): Promise<User[]> {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT id, name, title, profileImage, bio, createdAt, updatedAt FROM users'
      );
      return rows as User[];
    } finally {
      connection.release();
    }
  }

}

export class ContactInfoModel {
  static async getByUserId(userId: number): Promise<ContactInfo[]> {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT id, user_id AS userId, type, value, display_order AS displayOrder, createdAt, updatedAt FROM contact_info WHERE user_id = ? ORDER BY display_order ASC',
        [userId]
      );
      return rows as ContactInfo[];
    } finally {
      connection.release();
    }
  }

}

export class JobModel {
  static async findByUserId(userId: number): Promise<JobEntry[]> {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM job_history WHERE userId = ? ORDER BY startDate DESC',
        [userId]
      );
      return rows as JobEntry[];
    } finally {
      connection.release();
    }
  }

}

export class EducationModel {
  static async findByUserId(userId: number): Promise<Education[]> {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM education WHERE userId = ? ORDER BY startDate DESC',
        [userId]
      );
      return rows as Education[];
    } finally {
      connection.release();
    }
  }

}

export class ProjectModel {
  static async findByUserId(userId: number): Promise<Project[]> {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM projects WHERE userId = ?',
        [userId]
      );
      return rows as Project[];
    } finally {
      connection.release();
    }
  }

}

export class SkillModel {
  static async findByUserId(userId: number): Promise<Skill[]> {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM skills WHERE userId = ?',
        [userId]
      );
      return rows as Skill[];
    } finally {
      connection.release();
    }
  }

}

export class AchievementModel {
  static async findByUserId(userId: number): Promise<Achievement[]> {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM achievements WHERE userId = ? ORDER BY date DESC',
        [userId]
      );
      return rows as Achievement[];
    } finally {
      connection.release();
    }
  }

}
