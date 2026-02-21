import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { mockEducation } from '../fixtures';

vi.mock('../../src/models/index', () => ({
  EducationModel: {
    findByUserId: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
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
  let EducationModel: { findByUserId: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };

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

  describe('createEducation', () => {
    const validBody = {
      userId: 1,
      institution: 'State University',
      degree: 'BSc',
      field: 'Computer Science',
      startDate: '2016-09-01',
    };

    it('creates an education record and returns 201 with the new id', async () => {
      EducationModel.create.mockResolvedValue(7);
      const { createEducation } = await import('../../src/controllers/educationController');
      const req = makeReqMock({ body: validBody });
      const res = makeResMock();
      await createEducation(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: 7, message: 'Education created successfully' });
    });

    it('creates an education record with an end date', async () => {
      EducationModel.create.mockResolvedValue(8);
      const { createEducation } = await import('../../src/controllers/educationController');
      const req = makeReqMock({ body: { ...validBody, endDate: '2020-05-01' } });
      const res = makeResMock();
      await createEducation(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('returns 400 when required fields are missing', async () => {
      const { createEducation } = await import('../../src/controllers/educationController');
      const req = makeReqMock({ body: { userId: 1 } });
      const res = makeResMock();
      await createEducation(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing required fields' });
    });

    it('returns 400 for an invalid start date', async () => {
      const { createEducation } = await import('../../src/controllers/educationController');
      const req = makeReqMock({ body: { ...validBody, startDate: 'not-a-date' } });
      const res = makeResMock();
      await createEducation(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid start date' });
    });

    it('returns 400 for an invalid end date', async () => {
      const { createEducation } = await import('../../src/controllers/educationController');
      const req = makeReqMock({ body: { ...validBody, endDate: 'not-a-date' } });
      const res = makeResMock();
      await createEducation(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid end date' });
    });

    it('returns 500 on unexpected error', async () => {
      EducationModel.create.mockRejectedValue(new Error('DB failure'));
      const { createEducation } = await import('../../src/controllers/educationController');
      const req = makeReqMock({ body: validBody });
      const res = makeResMock();
      await createEducation(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to create education' });
    });
  });

  describe('deleteEducation', () => {
    it('deletes an education record and returns a success message', async () => {
      EducationModel.delete.mockResolvedValue(true);
      const { deleteEducation } = await import('../../src/controllers/educationController');
      const req = makeReqMock({ params: { id: '1' } });
      const res = makeResMock();
      await deleteEducation(req, res);
      expect(res.json).toHaveBeenCalledWith({ message: 'Education deleted successfully' });
    });

    it('returns 400 for a non-numeric id', async () => {
      const { deleteEducation } = await import('../../src/controllers/educationController');
      const req = makeReqMock({ params: { id: 'abc' } });
      const res = makeResMock();
      await deleteEducation(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid education ID' });
    });

    it('returns 500 on unexpected error', async () => {
      EducationModel.delete.mockRejectedValue(new Error('DB failure'));
      const { deleteEducation } = await import('../../src/controllers/educationController');
      const req = makeReqMock({ params: { id: '1' } });
      const res = makeResMock();
      await deleteEducation(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to delete education' });
    });
  });
});
