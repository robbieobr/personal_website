import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { mockSkill } from '../fixtures';

vi.mock('../../src/models/index', () => ({
  SkillModel: {
    findByUserId: vi.fn(),
  },
}));

const buildApp = async () => {
  const skillRoutes = (await import('../../src/routes/skillRoutes')).default;
  const app = express();
  app.use(express.json());
  app.use('/api/skills', skillRoutes);
  return app;
};

describe('skillRoutes', () => {
  let SkillModel: { findByUserId: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.resetModules();
    const models = await import('../../src/models/index');
    SkillModel = models.SkillModel as typeof SkillModel;
    vi.clearAllMocks();
  });

  describe('GET /api/skills/user/:userId', () => {
    it('responds with 200 and a list of skills', async () => {
      SkillModel.findByUserId.mockResolvedValue([mockSkill]);
      const app = await buildApp();
      const res = await request(app).get('/api/skills/user/1');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it('responds with 400 for a non-numeric userId', async () => {
      const app = await buildApp();
      const res = await request(app).get('/api/skills/user/abc');
      expect(res.status).toBe(400);
    });
  });
});
