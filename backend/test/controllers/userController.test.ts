import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
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

  describe('createUser', () => {
    const validBody = {
      name: 'Jane Doe',
      title: 'Engineer',
      email: 'jane@example.com',
      phone: '+1-555-123-4567',
    };

    it('creates a user and returns 201 with the new id', async () => {
      UserModel.create.mockResolvedValue(42);
      const { createUser } = await import('../../src/controllers/userController');
      const req = makeReqMock({ body: validBody });
      const res = makeResMock();
      await createUser(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: 42, message: 'User created successfully' });
    });

    it('returns 400 when required fields are missing', async () => {
      const { createUser } = await import('../../src/controllers/userController');
      const req = makeReqMock({ body: { name: 'Jane' } });
      const res = makeResMock();
      await createUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing required fields' });
    });

    it('returns 400 for an invalid email format', async () => {
      const { createUser } = await import('../../src/controllers/userController');
      const req = makeReqMock({ body: { ...validBody, email: 'not-an-email' } });
      const res = makeResMock();
      await createUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid email format' });
    });

    it('returns 400 for an invalid phone format', async () => {
      const { createUser } = await import('../../src/controllers/userController');
      const req = makeReqMock({ body: { ...validBody, phone: '!!' } });
      const res = makeResMock();
      await createUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid phone format' });
    });

    it('returns 500 on unexpected error', async () => {
      UserModel.create.mockRejectedValue(new Error('DB failure'));
      const { createUser } = await import('../../src/controllers/userController');
      const req = makeReqMock({ body: validBody });
      const res = makeResMock();
      await createUser(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateUser', () => {
    it('updates the user and returns a success message', async () => {
      UserModel.findById.mockResolvedValue(mockUser);
      UserModel.update.mockResolvedValue(true);
      const { updateUser } = await import('../../src/controllers/userController');
      const req = makeReqMock({ params: { id: '1' }, body: { name: 'Updated' } });
      const res = makeResMock();
      await updateUser(req, res);
      expect(res.json).toHaveBeenCalledWith({ message: 'User updated successfully' });
    });

    it('returns 404 when user is not found', async () => {
      UserModel.findById.mockResolvedValue(null);
      const { updateUser } = await import('../../src/controllers/userController');
      const req = makeReqMock({ params: { id: '99' }, body: {} });
      const res = makeResMock();
      await updateUser(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 400 for a non-numeric id', async () => {
      const { updateUser } = await import('../../src/controllers/userController');
      const req = makeReqMock({ params: { id: 'abc' }, body: {} });
      const res = makeResMock();
      await updateUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 500 on unexpected error', async () => {
      UserModel.findById.mockRejectedValue(new Error('DB failure'));
      const { updateUser } = await import('../../src/controllers/userController');
      const req = makeReqMock({ params: { id: '1' }, body: {} });
      const res = makeResMock();
      await updateUser(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteUser', () => {
    it('deletes the user and returns a success message', async () => {
      UserModel.findById.mockResolvedValue(mockUser);
      UserModel.delete.mockResolvedValue(true);
      const { deleteUser } = await import('../../src/controllers/userController');
      const req = makeReqMock({ params: { id: '1' } });
      const res = makeResMock();
      await deleteUser(req, res);
      expect(res.json).toHaveBeenCalledWith({ message: 'User deleted successfully' });
    });

    it('returns 404 when user is not found', async () => {
      UserModel.findById.mockResolvedValue(null);
      const { deleteUser } = await import('../../src/controllers/userController');
      const req = makeReqMock({ params: { id: '99' } });
      const res = makeResMock();
      await deleteUser(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 400 for a non-numeric id', async () => {
      const { deleteUser } = await import('../../src/controllers/userController');
      const req = makeReqMock({ params: { id: 'abc' } });
      const res = makeResMock();
      await deleteUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 500 on unexpected error', async () => {
      UserModel.findById.mockRejectedValue(new Error('DB failure'));
      const { deleteUser } = await import('../../src/controllers/userController');
      const req = makeReqMock({ params: { id: '1' } });
      const res = makeResMock();
      await deleteUser(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
