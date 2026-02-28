import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { mockProject } from '../fixtures';

vi.mock('../../src/models/index', () => ({
  ProjectModel: {
    findByUserId: vi.fn(),
  },
}));

const buildApp = async () => {
  const projectRoutes = (await import('../../src/routes/projectRoutes')).default;
  const app = express();
  app.use(express.json());
  app.use('/api/projects', projectRoutes);
  return app;
};

describe('projectRoutes', () => {
  let ProjectModel: { findByUserId: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.resetModules();
    const models = await import('../../src/models/index');
    ProjectModel = models.ProjectModel as typeof ProjectModel;
    vi.clearAllMocks();
  });

  describe('GET /api/projects/user/:userId', () => {
    it('responds with 200 and a list of projects', async () => {
      ProjectModel.findByUserId.mockResolvedValue([mockProject]);
      const app = await buildApp();
      const res = await request(app).get('/api/projects/user/1');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it('responds with 400 for a non-numeric userId', async () => {
      const app = await buildApp();
      const res = await request(app).get('/api/projects/user/abc');
      expect(res.status).toBe(400);
    });
  });
});
