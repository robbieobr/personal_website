import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { mockEducation } from '../fixtures';

vi.mock('../../src/models/index', () => ({
  EducationModel: {
    findByUserId: vi.fn(),
  },
}));

const buildApp = async () => {
  const educationRoutes = (await import('../../src/routes/educationRoutes')).default;
  const app = express();
  app.use(express.json());
  app.use('/api/education', educationRoutes);
  return app;
};

describe('educationRoutes', () => {
  let EducationModel: { findByUserId: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.resetModules();
    const models = await import('../../src/models/index');
    EducationModel = models.EducationModel as typeof EducationModel;
    vi.clearAllMocks();
  });

  describe('GET /api/education/user/:userId', () => {
    it('responds with 200 and a list of education records', async () => {
      EducationModel.findByUserId.mockResolvedValue([mockEducation]);
      const app = await buildApp();
      const res = await request(app).get('/api/education/user/1');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it('responds with 400 for a non-numeric userId', async () => {
      const app = await buildApp();
      const res = await request(app).get('/api/education/user/abc');
      expect(res.status).toBe(400);
    });
  });
});
