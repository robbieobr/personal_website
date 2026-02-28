import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { mockContactInfo, mockContactInfoPhone } from '../fixtures';

vi.mock('../../src/models/index', () => ({
  ContactInfoModel: {
    getByUserId: vi.fn(),
  },
}));

const buildApp = async () => {
  const contactInfoRoutes = (await import('../../src/routes/contactInfoRoutes')).default;
  const app = express();
  app.use(express.json());
  app.use('/api/contact-info', contactInfoRoutes);
  return app;
};

describe('contactInfoRoutes', () => {
  let ContactInfoModel: { getByUserId: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.resetModules();
    const models = await import('../../src/models/index');
    ContactInfoModel = models.ContactInfoModel as typeof ContactInfoModel;
    vi.clearAllMocks();
  });

  describe('GET /api/contact-info/:userId', () => {
    it('responds with 200 and contact info array', async () => {
      ContactInfoModel.getByUserId.mockResolvedValue([mockContactInfo, mockContactInfoPhone]);
      const app = await buildApp();
      const res = await request(app).get('/api/contact-info/1');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].type).toBe('email');
      expect(res.body[1].type).toBe('phone');
    });

    it('responds with 200 and empty array when no contact info', async () => {
      ContactInfoModel.getByUserId.mockResolvedValue([]);
      const app = await buildApp();
      const res = await request(app).get('/api/contact-info/1');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('responds with 400 for non-numeric userId', async () => {
      const app = await buildApp();
      const res = await request(app).get('/api/contact-info/abc');
      expect(res.status).toBe(400);
    });

    it('responds with 500 on model error', async () => {
      ContactInfoModel.getByUserId.mockRejectedValue(new Error('DB failure'));
      const app = await buildApp();
      const res = await request(app).get('/api/contact-info/1');
      expect(res.status).toBe(500);
    });
  });
});
