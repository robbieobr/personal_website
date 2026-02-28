import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { mockEducation } from '../fixtures';

vi.mock('../../src/models/index', () => ({
  EducationModel: {
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

describe('educationController', () => {
  let EducationModel: { findByUserId: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.resetModules();
    const models = await import('../../src/models/index');
    EducationModel = models.EducationModel as typeof EducationModel;
    vi.clearAllMocks();
  });

  describe('getEducationByUser', () => {
    it('returns education records for the given user', async () => {
      EducationModel.findByUserId.mockResolvedValue([mockEducation]);
      const { getEducationByUser } = await import('../../src/controllers/educationController');
      const req = makeReqMock({ params: { userId: '1' } });
      const res = makeResMock();
      await getEducationByUser(req, res);
      expect(res.json).toHaveBeenCalledWith([mockEducation]);
    });

    it('returns 400 for a non-numeric userId', async () => {
      const { getEducationByUser } = await import('../../src/controllers/educationController');
      const req = makeReqMock({ params: { userId: 'abc' } });
      const res = makeResMock();
      await getEducationByUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid user ID' });
    });

    it('returns 500 on unexpected error', async () => {
      EducationModel.findByUserId.mockRejectedValue(new Error('DB failure'));
      const { getEducationByUser } = await import('../../src/controllers/educationController');
      const req = makeReqMock({ params: { userId: '1' } });
      const res = makeResMock();
      await getEducationByUser(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch education' });
    });
  });
});
