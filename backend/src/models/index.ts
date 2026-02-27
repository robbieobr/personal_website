import { ResultSetHeader, FieldPacket } from 'mysql2';
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
      const [result] = await connection.execute(
        'INSERT INTO users (name, title, email, phone, profileImage, bio) VALUES (?, ?, ?, ?, ?, ?)',
        [userData.name, userData.title, userData.email, userData.phone, userData.profileImage, userData.bio]
      ) as [ResultSetHeader, FieldPacket[]];
      return result.insertId;
    } finally {
      connection.release();
    }
  }

  static async update(id: number, userData: Partial<User>): Promise<boolean> {
    const connection = await pool.getConnection();
    try {
      const allowedFields: (keyof User)[] = ['name', 'title', 'email', 'phone', 'profileImage', 'bio'];
      const fields = Object.keys(userData)
        .filter((k) => allowedFields.includes(k as keyof User));

      if (fields.length === 0) {
        return false;
      }

      const values = fields.map((f) => userData[f as keyof User] ?? null);
      values.push(id);

      const setClause = fields.map((f) => `${f} = ?`).join(', ');
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
      const [result] = await connection.execute(
        'INSERT INTO job_history (userId, company, position, startDate, endDate, description) VALUES (?, ?, ?, ?, ?, ?)',
        [jobData.userId, jobData.company, jobData.position, jobData.startDate, jobData.endDate, jobData.description]
      ) as [ResultSetHeader, FieldPacket[]];
      return result.insertId;
    } finally {
      connection.release();
    }
  }

  static async update(id: number, jobData: Partial<Pick<JobEntry, 'company' | 'position' | 'startDate' | 'endDate' | 'description'>>): Promise<boolean> {
    const connection = await pool.getConnection();
    try {
      const allowedFields: (keyof JobEntry)[] = ['company', 'position', 'startDate', 'endDate', 'description'];
      const fields = Object.keys(jobData).filter((k) => allowedFields.includes(k as keyof JobEntry));

      if (fields.length === 0) {
        return false;
      }

      const values: (string | number | Date | null)[] = fields.map((f) => jobData[f as keyof typeof jobData] ?? null) as (string | number | Date | null)[];
      values.push(id);

      const setClause = fields.map((f) => `${f} = ?`).join(', ');
      await connection.execute(`UPDATE job_history SET ${setClause} WHERE id = ?`, values);
      return true;
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
      const [result] = await connection.execute(
        'INSERT INTO education (userId, institution, degree, field, startDate, endDate, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [educationData.userId, educationData.institution, educationData.degree, educationData.field, educationData.startDate, educationData.endDate, educationData.description]
      ) as [ResultSetHeader, FieldPacket[]];
      return result.insertId;
    } finally {
      connection.release();
    }
  }

  static async update(id: number, educationData: Partial<Pick<Education, 'institution' | 'degree' | 'field' | 'startDate' | 'endDate' | 'description'>>): Promise<boolean> {
    const connection = await pool.getConnection();
    try {
      const allowedFields: (keyof Education)[] = ['institution', 'degree', 'field', 'startDate', 'endDate', 'description'];
      const fields = Object.keys(educationData).filter((k) => allowedFields.includes(k as keyof Education));

      if (fields.length === 0) {
        return false;
      }

      const values: (string | number | Date | null)[] = fields.map((f) => educationData[f as keyof typeof educationData] ?? null) as (string | number | Date | null)[];
      values.push(id);

      const setClause = fields.map((f) => `${f} = ?`).join(', ');
      await connection.execute(`UPDATE education SET ${setClause} WHERE id = ?`, values);
      return true;
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
