import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { mockUser, mockJob, mockEducation, mockProject, mockSkill, mockAchievement } from '../fixtures';

vi.mock('../../src/models/index', () => ({
  UserModel: {
    findById: vi.fn(),
    findAll: vi.fn(),
  },
  JobModel: {
    findByUserId: vi.fn(),
  },
  EducationModel: {
    findByUserId: vi.fn(),
  },
  ProjectModel: {
    findByUserId: vi.fn(),
  },
  SkillModel: {
    findByUserId: vi.fn(),
  },
  AchievementModel: {
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
  let UserModel: { findById: ReturnType<typeof vi.fn>; findAll: ReturnType<typeof vi.fn> };
  let JobModel: { findByUserId: ReturnType<typeof vi.fn> };
  let EducationModel: { findByUserId: ReturnType<typeof vi.fn> };
  let ProjectModel: { findByUserId: ReturnType<typeof vi.fn> };
  let SkillModel: { findByUserId: ReturnType<typeof vi.fn> };
  let AchievementModel: { findByUserId: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.resetModules();
    const models = await import('../../src/models/index');
    UserModel = models.UserModel as typeof UserModel;
    JobModel = models.JobModel as typeof JobModel;
    EducationModel = models.EducationModel as typeof EducationModel;
    ProjectModel = models.ProjectModel as typeof ProjectModel;
    SkillModel = models.SkillModel as typeof SkillModel;
    AchievementModel = models.AchievementModel as typeof AchievementModel;
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
      ProjectModel.findByUserId.mockResolvedValue([mockProject]);
      SkillModel.findByUserId.mockResolvedValue([mockSkill]);
      AchievementModel.findByUserId.mockResolvedValue([mockAchievement]);
      const app = await buildApp();
      const res = await request(app).get('/api/users/1/profile');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('jobHistory');
      expect(res.body).toHaveProperty('education');
      expect(res.body).toHaveProperty('projects');
      expect(res.body).toHaveProperty('skills');
      expect(res.body).toHaveProperty('achievements');
    });
  });
});
