import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { mockJob } from '../fixtures';

vi.mock('../../src/models/index', () => ({
  JobModel: {
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

describe('jobController', () => {
  let JobModel: { findByUserId: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.resetModules();
    const models = await import('../../src/models/index');
    JobModel = models.JobModel as typeof JobModel;
    vi.clearAllMocks();
  });

  describe('getJobsByUser', () => {
    it('returns jobs for the given user', async () => {
      JobModel.findByUserId.mockResolvedValue([mockJob]);
      const { getJobsByUser } = await import('../../src/controllers/jobController');
      const req = makeReqMock({ params: { userId: '1' } });
      const res = makeResMock();
      await getJobsByUser(req, res);
      expect(res.json).toHaveBeenCalledWith([mockJob]);
    });

    it('returns 400 for a non-numeric userId', async () => {
      const { getJobsByUser } = await import('../../src/controllers/jobController');
      const req = makeReqMock({ params: { userId: 'abc' } });
      const res = makeResMock();
      await getJobsByUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid user ID' });
    });

    it('returns 500 on unexpected error', async () => {
      JobModel.findByUserId.mockRejectedValue(new Error('DB failure'));
      const { getJobsByUser } = await import('../../src/controllers/jobController');
      const req = makeReqMock({ params: { userId: '1' } });
      const res = makeResMock();
      await getJobsByUser(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch jobs' });
    });
  });

  describe('createJob', () => {
    const validBody = {
      userId: 1,
      company: 'Acme Corp',
      position: 'Engineer',
      startDate: '2020-01-01',
    };

    it('creates a job and returns 201 with the new id', async () => {
      JobModel.create.mockResolvedValue(10);
      const { createJob } = await import('../../src/controllers/jobController');
      const req = makeReqMock({ body: validBody });
      const res = makeResMock();
      await createJob(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: 10, message: 'Job created successfully' });
    });

    it('creates a job with an end date', async () => {
      JobModel.create.mockResolvedValue(11);
      const { createJob } = await import('../../src/controllers/jobController');
      const req = makeReqMock({ body: { ...validBody, endDate: '2022-12-31' } });
      const res = makeResMock();
      await createJob(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('returns 400 when required fields are missing', async () => {
      const { createJob } = await import('../../src/controllers/jobController');
      const req = makeReqMock({ body: { userId: 1 } });
      const res = makeResMock();
      await createJob(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing required fields' });
    });

    it('returns 400 for an invalid start date', async () => {
      const { createJob } = await import('../../src/controllers/jobController');
      const req = makeReqMock({ body: { ...validBody, startDate: 'not-a-date' } });
      const res = makeResMock();
      await createJob(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid start date' });
    });

    it('returns 400 for an invalid end date', async () => {
      const { createJob } = await import('../../src/controllers/jobController');
      const req = makeReqMock({ body: { ...validBody, endDate: 'not-a-date' } });
      const res = makeResMock();
      await createJob(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid end date' });
    });

    it('returns 500 on unexpected error', async () => {
      JobModel.create.mockRejectedValue(new Error('DB failure'));
      const { createJob } = await import('../../src/controllers/jobController');
      const req = makeReqMock({ body: validBody });
      const res = makeResMock();
      await createJob(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to create job' });
    });
  });

  describe('deleteJob', () => {
    it('deletes a job and returns a success message', async () => {
      JobModel.delete.mockResolvedValue(true);
      const { deleteJob } = await import('../../src/controllers/jobController');
      const req = makeReqMock({ params: { id: '1' } });
      const res = makeResMock();
      await deleteJob(req, res);
      expect(res.json).toHaveBeenCalledWith({ message: 'Job deleted successfully' });
    });

    it('returns 400 for a non-numeric id', async () => {
      const { deleteJob } = await import('../../src/controllers/jobController');
      const req = makeReqMock({ params: { id: 'abc' } });
      const res = makeResMock();
      await deleteJob(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid job ID' });
    });

    it('returns 500 on unexpected error', async () => {
      JobModel.delete.mockRejectedValue(new Error('DB failure'));
      const { deleteJob } = await import('../../src/controllers/jobController');
      const req = makeReqMock({ params: { id: '1' } });
      const res = makeResMock();
      await deleteJob(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to delete job' });
    });
  });
});
