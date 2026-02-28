import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { mockAchievement } from '../fixtures';

vi.mock('../../src/models/index', () => ({
  AchievementModel: {
    findByUserId: vi.fn(),
  },
}));

const buildApp = async () => {
  const achievementRoutes = (await import('../../src/routes/achievementRoutes')).default;
  const app = express();
  app.use(express.json());
  app.use('/api/achievements', achievementRoutes);
  return app;
};

describe('achievementRoutes', () => {
  let AchievementModel: { findByUserId: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.resetModules();
    const models = await import('../../src/models/index');
    AchievementModel = models.AchievementModel as typeof AchievementModel;
    vi.clearAllMocks();
  });

  describe('GET /api/achievements/user/:userId', () => {
    it('responds with 200 and a list of achievements', async () => {
      AchievementModel.findByUserId.mockResolvedValue([mockAchievement]);
      const app = await buildApp();
      const res = await request(app).get('/api/achievements/user/1');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it('responds with 400 for a non-numeric userId', async () => {
      const app = await buildApp();
      const res = await request(app).get('/api/achievements/user/abc');
      expect(res.status).toBe(400);
    });
  });
});
