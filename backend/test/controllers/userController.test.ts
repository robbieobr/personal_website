import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { mockUser, mockJob, mockEducation } from '../fixtures';

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

describe('userController', () => {
  let UserModel: { findById: ReturnType<typeof vi.fn>; findAll: ReturnType<typeof vi.fn> };
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

  describe('getUser', () => {
    it('returns the user when found', async () => {
      UserModel.findById.mockResolvedValue(mockUser);
      const { getUser } = await import('../../src/controllers/userController');
      const req = makeReqMock({ params: { id: '1' } });
      const res = makeResMock();
      await getUser(req, res);
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    it('returns 404 when user is not found', async () => {
      UserModel.findById.mockResolvedValue(null);
      const { getUser } = await import('../../src/controllers/userController');
      const req = makeReqMock({ params: { id: '99' } });
      const res = makeResMock();
      await getUser(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('returns 400 for a non-numeric id', async () => {
      const { getUser } = await import('../../src/controllers/userController');
      const req = makeReqMock({ params: { id: 'abc' } });
      const res = makeResMock();
      await getUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid user ID' });
    });

    it('returns 500 on unexpected error', async () => {
      UserModel.findById.mockRejectedValue(new Error('DB failure'));
      const { getUser } = await import('../../src/controllers/userController');
      const req = makeReqMock({ params: { id: '1' } });
      const res = makeResMock();
      await getUser(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch user' });
    });
  });

  describe('getAllUsers', () => {
    it('returns all users', async () => {
      UserModel.findAll.mockResolvedValue([mockUser]);
      const { getAllUsers } = await import('../../src/controllers/userController');
      const req = makeReqMock();
      const res = makeResMock();
      await getAllUsers(req, res);
      expect(res.json).toHaveBeenCalledWith([mockUser]);
    });

    it('returns 500 on unexpected error', async () => {
      UserModel.findAll.mockRejectedValue(new Error('DB failure'));
      const { getAllUsers } = await import('../../src/controllers/userController');
      const req = makeReqMock();
      const res = makeResMock();
      await getAllUsers(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch users' });
    });
  });

  describe('getUserProfile', () => {
    it('returns the full profile when user exists', async () => {
      UserModel.findById.mockResolvedValue(mockUser);
      JobModel.findByUserId.mockResolvedValue([mockJob]);
      EducationModel.findByUserId.mockResolvedValue([mockEducation]);
      const { getUserProfile } = await import('../../src/controllers/userController');
      const req = makeReqMock({ params: { id: '1' } });
      const res = makeResMock();
      await getUserProfile(req, res);
      expect(res.json).toHaveBeenCalledWith({
        user: mockUser,
        jobHistory: [mockJob],
        education: [mockEducation],
      });
    });

    it('returns 404 when user is not found', async () => {
      UserModel.findById.mockResolvedValue(null);
      const { getUserProfile } = await import('../../src/controllers/userController');
      const req = makeReqMock({ params: { id: '99' } });
      const res = makeResMock();
      await getUserProfile(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 400 for a non-numeric id', async () => {
      const { getUserProfile } = await import('../../src/controllers/userController');
      const req = makeReqMock({ params: { id: 'bad' } });
      const res = makeResMock();
      await getUserProfile(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 500 on unexpected error', async () => {
      UserModel.findById.mockRejectedValue(new Error('DB failure'));
      const { getUserProfile } = await import('../../src/controllers/userController');
      const req = makeReqMock({ params: { id: '1' } });
      const res = makeResMock();
      await getUserProfile(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
