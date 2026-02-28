import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { mockContactInfo, mockContactInfoPhone } from '../fixtures';

vi.mock('../../src/models/index', () => ({
  ContactInfoModel: {
    getByUserId: vi.fn(),
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

describe('contactInfoController', () => {
  let ContactInfoModel: { getByUserId: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.resetModules();
    const models = await import('../../src/models/index');
    ContactInfoModel = models.ContactInfoModel as typeof ContactInfoModel;
    vi.clearAllMocks();
  });

  describe('getContactInfo', () => {
    it('returns contact info for the given user', async () => {
      ContactInfoModel.getByUserId.mockResolvedValue([mockContactInfo, mockContactInfoPhone]);
      const { getContactInfo } = await import('../../src/controllers/contactInfoController');
      const req = makeReqMock({ params: { userId: '1' } });
      const res = makeResMock();
      await getContactInfo(req, res);
      expect(res.json).toHaveBeenCalledWith([mockContactInfo, mockContactInfoPhone]);
    });

    it('returns empty array when user has no contact info', async () => {
      ContactInfoModel.getByUserId.mockResolvedValue([]);
      const { getContactInfo } = await import('../../src/controllers/contactInfoController');
      const req = makeReqMock({ params: { userId: '1' } });
      const res = makeResMock();
      await getContactInfo(req, res);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('returns 400 for a non-numeric userId', async () => {
      const { getContactInfo } = await import('../../src/controllers/contactInfoController');
      const req = makeReqMock({ params: { userId: 'abc' } });
      const res = makeResMock();
      await getContactInfo(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid user ID' });
    });

    it('returns 500 on unexpected error', async () => {
      ContactInfoModel.getByUserId.mockRejectedValue(new Error('DB failure'));
      const { getContactInfo } = await import('../../src/controllers/contactInfoController');
      const req = makeReqMock({ params: { userId: '1' } });
      const res = makeResMock();
      await getContactInfo(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch contact info' });
    });
  });
});
