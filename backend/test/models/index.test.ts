import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockUser, mockJob, mockEducation } from '../fixtures';

const mockExecute = vi.fn();
const mockRelease = vi.fn();
const mockGetConnection = vi.fn(() =>
  Promise.resolve({ execute: mockExecute, release: mockRelease })
);

vi.mock('../../src/config/database', () => ({
  default: { getConnection: mockGetConnection },
}));

describe('UserModel', () => {
  beforeEach(() => {
    mockExecute.mockReset();
    mockRelease.mockReset();
    mockGetConnection.mockClear();
  });

  describe('findById', () => {
    it('returns the user when found', async () => {
      mockExecute.mockResolvedValue([[mockUser]]);
      const { UserModel } = await import('../../src/models/index');
      const result = await UserModel.findById(1);
      expect(result).toEqual(mockUser);
      expect(mockExecute).toHaveBeenCalledWith('SELECT * FROM users WHERE id = ?', [1]);
      expect(mockRelease).toHaveBeenCalled();
    });

    it('returns null when user is not found', async () => {
      mockExecute.mockResolvedValue([[]]);
      const { UserModel } = await import('../../src/models/index');
      const result = await UserModel.findById(99);
      expect(result).toBeNull();
    });

    it('releases the connection even when an error is thrown', async () => {
      mockExecute.mockRejectedValue(new Error('DB error'));
      const { UserModel } = await import('../../src/models/index');
      await expect(UserModel.findById(1)).rejects.toThrow('DB error');
      expect(mockRelease).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('returns all users', async () => {
      mockExecute.mockResolvedValue([[mockUser]]);
      const { UserModel } = await import('../../src/models/index');
      const result = await UserModel.findAll();
      expect(result).toEqual([mockUser]);
      expect(mockExecute).toHaveBeenCalledWith('SELECT * FROM users');
    });
  });

  describe('create', () => {
    it('inserts a user and returns the new id', async () => {
      mockExecute.mockResolvedValue([{ insertId: 42 }]);
      const { UserModel } = await import('../../src/models/index');
      const id = await UserModel.create({
        name: 'Jane Doe',
        title: 'Engineer',
        email: 'jane@example.com',
        phone: '+1-555-000-0000',
        profileImage: null,
        bio: null,
      });
      expect(id).toBe(42);
    });
  });

  describe('update', () => {
    it('updates allowed fields and returns true', async () => {
      mockExecute.mockResolvedValue([{}]);
      const { UserModel } = await import('../../src/models/index');
      const result = await UserModel.update(1, { name: 'Updated Name' });
      expect(result).toBe(true);
      expect(mockExecute).toHaveBeenCalledWith(
        'UPDATE users SET name = ? WHERE id = ?',
        ['Updated Name', 1]
      );
    });

    it('returns false when no valid fields are provided', async () => {
      const { UserModel } = await import('../../src/models/index');
      const result = await UserModel.update(1, {});
      expect(result).toBe(false);
      expect(mockExecute).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('deletes a user and returns true', async () => {
      mockExecute.mockResolvedValue([{}]);
      const { UserModel } = await import('../../src/models/index');
      const result = await UserModel.delete(1);
      expect(result).toBe(true);
      expect(mockExecute).toHaveBeenCalledWith('DELETE FROM users WHERE id = ?', [1]);
    });
  });
});

describe('JobModel', () => {
  beforeEach(() => {
    mockExecute.mockReset();
    mockRelease.mockReset();
    mockGetConnection.mockClear();
  });

  describe('findByUserId', () => {
    it('returns jobs for the given user', async () => {
      mockExecute.mockResolvedValue([[mockJob]]);
      const { JobModel } = await import('../../src/models/index');
      const result = await JobModel.findByUserId(1);
      expect(result).toEqual([mockJob]);
      expect(mockExecute).toHaveBeenCalledWith(
        'SELECT * FROM job_history WHERE userId = ? ORDER BY startDate DESC',
        [1]
      );
    });

    it('releases the connection even when an error is thrown', async () => {
      mockExecute.mockRejectedValue(new Error('DB error'));
      const { JobModel } = await import('../../src/models/index');
      await expect(JobModel.findByUserId(1)).rejects.toThrow('DB error');
      expect(mockRelease).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('inserts a job and returns the new id', async () => {
      mockExecute.mockResolvedValue([{ insertId: 5 }]);
      const { JobModel } = await import('../../src/models/index');
      const id = await JobModel.create({
        userId: 1,
        company: 'Acme',
        position: 'Dev',
        startDate: new Date('2020-01-01'),
        endDate: null,
        description: null,
      });
      expect(id).toBe(5);
    });
  });

  describe('delete', () => {
    it('deletes a job and returns true', async () => {
      mockExecute.mockResolvedValue([{}]);
      const { JobModel } = await import('../../src/models/index');
      const result = await JobModel.delete(1);
      expect(result).toBe(true);
      expect(mockExecute).toHaveBeenCalledWith('DELETE FROM job_history WHERE id = ?', [1]);
    });
  });
});

describe('EducationModel', () => {
  beforeEach(() => {
    mockExecute.mockReset();
    mockRelease.mockReset();
    mockGetConnection.mockClear();
  });

  describe('findByUserId', () => {
    it('returns education records for the given user', async () => {
      mockExecute.mockResolvedValue([[mockEducation]]);
      const { EducationModel } = await import('../../src/models/index');
      const result = await EducationModel.findByUserId(1);
      expect(result).toEqual([mockEducation]);
      expect(mockExecute).toHaveBeenCalledWith(
        'SELECT * FROM education WHERE userId = ? ORDER BY startDate DESC',
        [1]
      );
    });

    it('releases the connection even when an error is thrown', async () => {
      mockExecute.mockRejectedValue(new Error('DB error'));
      const { EducationModel } = await import('../../src/models/index');
      await expect(EducationModel.findByUserId(1)).rejects.toThrow('DB error');
      expect(mockRelease).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('inserts an education record and returns the new id', async () => {
      mockExecute.mockResolvedValue([{ insertId: 7 }]);
      const { EducationModel } = await import('../../src/models/index');
      const id = await EducationModel.create({
        userId: 1,
        institution: 'State University',
        degree: 'BSc',
        field: 'Computer Science',
        startDate: new Date('2016-09-01'),
        endDate: new Date('2020-05-01'),
        description: null,
      });
      expect(id).toBe(7);
    });
  });

  describe('delete', () => {
    it('deletes an education record and returns true', async () => {
      mockExecute.mockResolvedValue([{}]);
      const { EducationModel } = await import('../../src/models/index');
      const result = await EducationModel.delete(1);
      expect(result).toBe(true);
      expect(mockExecute).toHaveBeenCalledWith('DELETE FROM education WHERE id = ?', [1]);
    });
  });
});
