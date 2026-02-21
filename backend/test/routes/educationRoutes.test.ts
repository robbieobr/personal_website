import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { mockEducation } from '../fixtures';

vi.mock('../../src/models/index', () => ({
  EducationModel: {
    findByUserId: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
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
  let EducationModel: { findByUserId: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };

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

  describe('POST /api/education', () => {
    it('responds with 201 and the new education id', async () => {
      EducationModel.create.mockResolvedValue(7);
      const app = await buildApp();
      const res = await request(app).post('/api/education').send({
        userId: 1,
        institution: 'State University',
        degree: 'BSc',
        field: 'Computer Science',
        startDate: '2016-09-01',
      });
      expect(res.status).toBe(201);
      expect(res.body.id).toBe(7);
    });

    it('responds with 400 when required fields are missing', async () => {
      const app = await buildApp();
      const res = await request(app).post('/api/education').send({ userId: 1 });
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/education/:id', () => {
    it('responds with 200 when education record is deleted', async () => {
      EducationModel.delete.mockResolvedValue(true);
      const app = await buildApp();
      const res = await request(app).delete('/api/education/1');
      expect(res.status).toBe(200);
    });

    it('responds with 400 for a non-numeric id', async () => {
      const app = await buildApp();
      const res = await request(app).delete('/api/education/abc');
      expect(res.status).toBe(400);
    });
  });
});
