import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { mockUser, mockJob, mockEducation } from '../fixtures';

vi.mock('../../src/models/index', () => ({
  UserModel: {
    findById: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  JobModel: {
    findByUserId: vi.fn(),
  },
  EducationModel: {
    findByUserId: vi.fn(),
  },
}));

const buildApp = async () => {
  const userRoutes = (await import('../../src/routes/userRoutes')).default;
  const app = express();
  app.use(express.json());
  app.use('/api/users', userRoutes);
  return app;
};

describe('userRoutes', () => {
  let UserModel: { findById: ReturnType<typeof vi.fn>; findAll: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };
  let JobModel: { findByUserId: ReturnType<typeof vi.fn> };
  let EducationModel: { findByUserId: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.resetModules();
    const models = await import('../../src/models/index');
    UserModel = models.UserModel as typeof UserModel;
    JobModel = models.JobModel as typeof JobModel;
    EducationModel = models.EducationModel as typeof EducationModel;
    vi.clearAllMocks();
  });

  describe('GET /api/users', () => {
    it('responds with 200 and a list of users', async () => {
      UserModel.findAll.mockResolvedValue([mockUser]);
      const app = await buildApp();
      const res = await request(app).get('/api/users');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });
  });

  describe('GET /api/users/:id', () => {
    it('responds with 200 and the user', async () => {
      UserModel.findById.mockResolvedValue(mockUser);
      const app = await buildApp();
      const res = await request(app).get('/api/users/1');
      expect(res.status).toBe(200);
      expect(res.body.name).toBe(mockUser.name);
    });

    it('responds with 404 when user is not found', async () => {
      UserModel.findById.mockResolvedValue(null);
      const app = await buildApp();
      const res = await request(app).get('/api/users/99');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/users/:id/profile', () => {
    it('responds with 200 and the full profile', async () => {
      UserModel.findById.mockResolvedValue(mockUser);
      JobModel.findByUserId.mockResolvedValue([mockJob]);
      EducationModel.findByUserId.mockResolvedValue([mockEducation]);
      const app = await buildApp();
      const res = await request(app).get('/api/users/1/profile');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('jobHistory');
      expect(res.body).toHaveProperty('education');
    });
  });

  describe('POST /api/users', () => {
    it('responds with 201 and the new user id', async () => {
      UserModel.create.mockResolvedValue(42);
      const app = await buildApp();
      const res = await request(app).post('/api/users').send({
        name: 'Jane Doe',
        title: 'Engineer',
        email: 'jane@example.com',
        phone: '+1-555-123-4567',
      });
      expect(res.status).toBe(201);
      expect(res.body.id).toBe(42);
    });

    it('responds with 400 when required fields are missing', async () => {
      const app = await buildApp();
      const res = await request(app).post('/api/users').send({ name: 'Jane' });
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('responds with 200 when user is updated', async () => {
      UserModel.findById.mockResolvedValue(mockUser);
      UserModel.update.mockResolvedValue(true);
      const app = await buildApp();
      const res = await request(app).put('/api/users/1').send({ name: 'Updated' });
      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('responds with 200 when user is deleted', async () => {
      UserModel.findById.mockResolvedValue(mockUser);
      UserModel.delete.mockResolvedValue(true);
      const app = await buildApp();
      const res = await request(app).delete('/api/users/1');
      expect(res.status).toBe(200);
    });
  });
});
