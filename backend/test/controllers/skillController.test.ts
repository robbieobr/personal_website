import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { mockSkill } from '../fixtures';

vi.mock('../../src/models/index', () => ({
  SkillModel: {
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

describe('skillController', () => {
  let SkillModel: { findByUserId: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.resetModules();
    const models = await import('../../src/models/index');
    SkillModel = models.SkillModel as typeof SkillModel;
    vi.clearAllMocks();
  });

  describe('getSkillsByUser', () => {
    it('returns skills for the given user', async () => {
      SkillModel.findByUserId.mockResolvedValue([mockSkill]);
      const { getSkillsByUser } = await import('../../src/controllers/skillController');
      const req = makeReqMock({ params: { userId: '1' } });
      const res = makeResMock();
      await getSkillsByUser(req, res);
      expect(res.json).toHaveBeenCalledWith([mockSkill]);
    });

    it('returns empty array when user has no skills', async () => {
      SkillModel.findByUserId.mockResolvedValue([]);
      const { getSkillsByUser } = await import('../../src/controllers/skillController');
      const req = makeReqMock({ params: { userId: '1' } });
      const res = makeResMock();
      await getSkillsByUser(req, res);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('returns 400 for a non-numeric userId', async () => {
      const { getSkillsByUser } = await import('../../src/controllers/skillController');
      const req = makeReqMock({ params: { userId: 'abc' } });
      const res = makeResMock();
      await getSkillsByUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid user ID' });
    });

    it('returns 500 on unexpected error', async () => {
      SkillModel.findByUserId.mockRejectedValue(new Error('DB failure'));
      const { getSkillsByUser } = await import('../../src/controllers/skillController');
      const req = makeReqMock({ params: { userId: '1' } });
      const res = makeResMock();
      await getSkillsByUser(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch skills' });
    });
  });
});
