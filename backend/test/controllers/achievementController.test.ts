import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { mockAchievement } from '../fixtures';

vi.mock('../../src/models/index', () => ({
  AchievementModel: {
    findByUserId: vi.fn(),
  },
}));

const makeResMock = () => {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  };
  res.status.mockReturnValue(res);
  return res as unknown as Response;
};

const makeReqMock = (overrides: Partial<Request> = {}): Request =>
  ({ params: {}, body: {}, ...overrides } as unknown as Request);

describe('achievementController', () => {
  let AchievementModel: { findByUserId: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.resetModules();
    const models = await import('../../src/models/index');
    AchievementModel = models.AchievementModel as typeof AchievementModel;
    vi.clearAllMocks();
  });

  describe('getAchievementsByUser', () => {
    it('returns achievements for the given user', async () => {
      AchievementModel.findByUserId.mockResolvedValue([mockAchievement]);
      const { getAchievementsByUser } = await import('../../src/controllers/achievementController');
      const req = makeReqMock({ params: { userId: '1' } });
      const res = makeResMock();
      await getAchievementsByUser(req, res);
      expect(res.json).toHaveBeenCalledWith([mockAchievement]);
    });

    it('returns empty array when user has no achievements', async () => {
      AchievementModel.findByUserId.mockResolvedValue([]);
      const { getAchievementsByUser } = await import('../../src/controllers/achievementController');
      const req = makeReqMock({ params: { userId: '1' } });
      const res = makeResMock();
      await getAchievementsByUser(req, res);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('returns 400 for a non-numeric userId', async () => {
      const { getAchievementsByUser } = await import('../../src/controllers/achievementController');
      const req = makeReqMock({ params: { userId: 'abc' } });
      const res = makeResMock();
      await getAchievementsByUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid user ID' });
    });

    it('returns 500 on unexpected error', async () => {
      AchievementModel.findByUserId.mockRejectedValue(new Error('DB failure'));
      const { getAchievementsByUser } = await import('../../src/controllers/achievementController');
      const req = makeReqMock({ params: { userId: '1' } });
      const res = makeResMock();
      await getAchievementsByUser(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch achievements' });
    });
  });
});
