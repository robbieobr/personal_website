import pool from '../config/database';
import { User, JobEntry, Education } from '../types/index';

export class UserModel {
  static async findById(id: number): Promise<User | null> {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM users WHERE id = ?',
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
      const [rows] = await connection.execute('SELECT * FROM users');
      return rows as User[];
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
