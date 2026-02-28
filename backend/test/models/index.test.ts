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
});
