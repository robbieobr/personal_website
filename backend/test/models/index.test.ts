import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockUser, mockJob, mockEducation, mockContactInfo, mockProject, mockSkill, mockAchievement } from '../fixtures';

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
      expect(mockExecute).toHaveBeenCalledWith(
        'SELECT id, name, title, profileImage, bio, createdAt, updatedAt FROM users WHERE id = ?',
        [1]
      );
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
      expect(mockExecute).toHaveBeenCalledWith(
        'SELECT id, name, title, profileImage, bio, createdAt, updatedAt FROM users'
      );
    });
  });
});

describe('ContactInfoModel', () => {
  beforeEach(() => {
    mockExecute.mockReset();
    mockRelease.mockReset();
    mockGetConnection.mockClear();
  });

  describe('getByUserId', () => {
    it('returns contact info for the given user ordered by display_order', async () => {
      mockExecute.mockResolvedValue([[mockContactInfo]]);
      const { ContactInfoModel } = await import('../../src/models/index');
      const result = await ContactInfoModel.getByUserId(1);
      expect(result).toEqual([mockContactInfo]);
      expect(mockExecute).toHaveBeenCalledWith(
        'SELECT id, user_id AS userId, type, value, display_order AS displayOrder, createdAt, updatedAt FROM contact_info WHERE user_id = ? ORDER BY display_order ASC',
        [1]
      );
    });

    it('returns empty array when no contact info exists', async () => {
      mockExecute.mockResolvedValue([[]]);
      const { ContactInfoModel } = await import('../../src/models/index');
      const result = await ContactInfoModel.getByUserId(99);
      expect(result).toEqual([]);
    });

    it('releases the connection even when an error is thrown', async () => {
      mockExecute.mockRejectedValue(new Error('DB error'));
      const { ContactInfoModel } = await import('../../src/models/index');
      await expect(ContactInfoModel.getByUserId(1)).rejects.toThrow('DB error');
      expect(mockRelease).toHaveBeenCalled();
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

describe('ProjectModel', () => {
  beforeEach(() => {
    mockExecute.mockReset();
    mockRelease.mockReset();
    mockGetConnection.mockClear();
  });

  describe('findByUserId', () => {
    it('returns projects for the given user', async () => {
      mockExecute.mockResolvedValue([[mockProject]]);
      const { ProjectModel } = await import('../../src/models/index');
      const result = await ProjectModel.findByUserId(1);
      expect(result).toEqual([mockProject]);
      expect(mockExecute).toHaveBeenCalledWith(
        'SELECT * FROM projects WHERE userId = ?',
        [1]
      );
    });

    it('releases the connection even when an error is thrown', async () => {
      mockExecute.mockRejectedValue(new Error('DB error'));
      const { ProjectModel } = await import('../../src/models/index');
      await expect(ProjectModel.findByUserId(1)).rejects.toThrow('DB error');
      expect(mockRelease).toHaveBeenCalled();
    });
  });
});

describe('SkillModel', () => {
  beforeEach(() => {
    mockExecute.mockReset();
    mockRelease.mockReset();
    mockGetConnection.mockClear();
  });

  describe('findByUserId', () => {
    it('returns skills for the given user', async () => {
      mockExecute.mockResolvedValue([[mockSkill]]);
      const { SkillModel } = await import('../../src/models/index');
      const result = await SkillModel.findByUserId(1);
      expect(result).toEqual([mockSkill]);
      expect(mockExecute).toHaveBeenCalledWith(
        'SELECT * FROM skills WHERE userId = ?',
        [1]
      );
    });

    it('releases the connection even when an error is thrown', async () => {
      mockExecute.mockRejectedValue(new Error('DB error'));
      const { SkillModel } = await import('../../src/models/index');
      await expect(SkillModel.findByUserId(1)).rejects.toThrow('DB error');
      expect(mockRelease).toHaveBeenCalled();
    });
  });
});

describe('AchievementModel', () => {
  beforeEach(() => {
    mockExecute.mockReset();
    mockRelease.mockReset();
    mockGetConnection.mockClear();
  });

  describe('findByUserId', () => {
    it('returns achievements for the given user', async () => {
      mockExecute.mockResolvedValue([[mockAchievement]]);
      const { AchievementModel } = await import('../../src/models/index');
      const result = await AchievementModel.findByUserId(1);
      expect(result).toEqual([mockAchievement]);
      expect(mockExecute).toHaveBeenCalledWith(
        'SELECT * FROM achievements WHERE userId = ? ORDER BY date DESC',
        [1]
      );
    });

    it('releases the connection even when an error is thrown', async () => {
      mockExecute.mockRejectedValue(new Error('DB error'));
      const { AchievementModel } = await import('../../src/models/index');
      await expect(AchievementModel.findByUserId(1)).rejects.toThrow('DB error');
      expect(mockRelease).toHaveBeenCalled();
    });
  });
});
