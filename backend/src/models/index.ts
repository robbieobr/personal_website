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

  static async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const connection = await pool.getConnection();
    try {
      const [result]: any = await connection.execute(
        'INSERT INTO users (name, title, email, phone, profileImage, bio) VALUES (?, ?, ?, ?, ?, ?)',
        [userData.name, userData.title, userData.email, userData.phone, userData.profileImage, userData.bio]
      );
      return result.insertId;
    } finally {
      connection.release();
    }
  }

  static async update(id: number, userData: Partial<User>): Promise<boolean> {
    const connection = await pool.getConnection();
    try {
      const fields = Object.keys(userData).filter(k => k !== 'id' && k !== 'createdAt' && k !== 'updatedAt');
      const values = fields.map(f => userData[f as keyof User]);
      values.push(id);

      const setClause = fields.map(f => `${f} = ?`).join(', ');
      
      await connection.execute(
        `UPDATE users SET ${setClause} WHERE id = ?`,
        values
      );
      return true;
    } finally {
      connection.release();
    }
  }

  static async delete(id: number): Promise<boolean> {
    const connection = await pool.getConnection();
    try {
      await connection.execute('DELETE FROM users WHERE id = ?', [id]);
      return true;
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

  static async create(jobData: Omit<JobEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const connection = await pool.getConnection();
    try {
      const [result]: any = await connection.execute(
        'INSERT INTO job_history (userId, company, position, startDate, endDate, description) VALUES (?, ?, ?, ?, ?, ?)',
        [jobData.userId, jobData.company, jobData.position, jobData.startDate, jobData.endDate, jobData.description]
      );
      return result.insertId;
    } finally {
      connection.release();
    }
  }

  static async delete(id: number): Promise<boolean> {
    const connection = await pool.getConnection();
    try {
      await connection.execute('DELETE FROM job_history WHERE id = ?', [id]);
      return true;
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

  static async create(educationData: Omit<Education, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const connection = await pool.getConnection();
    try {
      const [result]: any = await connection.execute(
        'INSERT INTO education (userId, institution, degree, field, startDate, endDate, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [educationData.userId, educationData.institution, educationData.degree, educationData.field, educationData.startDate, educationData.endDate, educationData.description]
      );
      return result.insertId;
    } finally {
      connection.release();
    }
  }

  static async delete(id: number): Promise<boolean> {
    const connection = await pool.getConnection();
    try {
      await connection.execute('DELETE FROM education WHERE id = ?', [id]);
      return true;
    } finally {
      connection.release();
    }
  }
}
