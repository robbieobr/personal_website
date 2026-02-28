import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { mockJob } from '../fixtures';

vi.mock('../../src/models/index', () => ({
  JobModel: {
    findByUserId: vi.fn(),
  },
}));

const buildApp = async () => {
  const jobRoutes = (await import('../../src/routes/jobRoutes')).default;
  const app = express();
  app.use(express.json());
  app.use('/api/jobs', jobRoutes);
  return app;
};

describe('jobRoutes', () => {
  let JobModel: { findByUserId: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.resetModules();
    const models = await import('../../src/models/index');
    JobModel = models.JobModel as typeof JobModel;
    vi.clearAllMocks();
  });

  describe('GET /api/jobs/user/:userId', () => {
    it('responds with 200 and a list of jobs', async () => {
      JobModel.findByUserId.mockResolvedValue([mockJob]);
      const app = await buildApp();
      const res = await request(app).get('/api/jobs/user/1');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it('responds with 400 for a non-numeric userId', async () => {
      const app = await buildApp();
      const res = await request(app).get('/api/jobs/user/abc');
      expect(res.status).toBe(400);
    });
  });
});
