import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express, Request, Response, NextFunction } from 'express';
import type { errorHandler as ErrorHandlerType } from '../src/index';

// src/index.ts is the one file with zero test coverage: it composes helmet,
// cors, express.json(), the health route, and the global error handler. These
// tests exercise that composition directly, rather than mocking it away.

const mockGetConnection = vi.fn();

vi.mock('../src/config/database', () => ({
  default: { getConnection: mockGetConnection },
}));

describe('src/index (app)', () => {
  let app: Express;
  let errorHandler: typeof ErrorHandlerType;

  beforeEach(async () => {
    vi.resetModules();
    mockGetConnection.mockReset();
    const mod = await import('../src/index');
    app = mod.default;
    errorHandler = mod.errorHandler;
  });

  describe('CORS origin configuration', () => {
    it('parses ALLOWED_ORIGINS into a trimmed list when set', async () => {
      process.env.ALLOWED_ORIGINS = 'https://example.com, https://other.example.com';
      vi.resetModules();
      mockGetConnection.mockReset();
      const mod = await import('../src/index');

      const res = await request(mod.default)
        .get('/api/health')
        .set('Origin', 'https://other.example.com');

      expect(res.headers['access-control-allow-origin']).toBe('https://other.example.com');
      delete process.env.ALLOWED_ORIGINS;
    });
  });

  describe('GET /api/health', () => {
    it('returns 200 and releases the connection when the database is reachable', async () => {
      const connection = { execute: vi.fn().mockResolvedValue([[]]), release: vi.fn() };
      mockGetConnection.mockResolvedValue(connection);

      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
      expect(connection.execute).toHaveBeenCalledWith('SELECT 1');
      expect(connection.release).toHaveBeenCalledTimes(1);
    });

    it('returns 503 when the database is unreachable', async () => {
      mockGetConnection.mockRejectedValue(new Error('connection refused'));

      const res = await request(app).get('/api/health');

      expect(res.status).toBe(503);
      expect(res.body).toEqual({ status: 'error', message: 'Database unavailable' });
    });
  });

  describe('malformed JSON body', () => {
    it('responds 400, not 500, preserving the status express.json() throws with', async () => {
      const res = await request(app)
        .post('/api/health')
        .set('Content-Type', 'application/json')
        .send('{ not valid json');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).not.toBe('Internal server error');
    });
  });

  describe('errorHandler', () => {
    const makeRes = (headersSent: boolean): Response =>
      ({
        headersSent,
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      }) as unknown as Response;

    it('delegates to next(err) instead of touching res when headers were already sent', () => {
      const res = makeRes(true);
      const next = vi.fn() as unknown as NextFunction;
      const err = new Error('boom');

      errorHandler(err, {} as Request, res, next);

      expect(next).toHaveBeenCalledWith(err);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('uses err.status when present instead of hard-coding 500', () => {
      const res = makeRes(false);
      const next = vi.fn() as unknown as NextFunction;
      const err = Object.assign(new Error('Bad request'), { status: 400 });

      errorHandler(err, {} as Request, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Bad request' });
    });

    it('falls back to a generic message for a genuine 500', () => {
      const res = makeRes(false);
      const next = vi.fn() as unknown as NextFunction;
      const err = new Error('some internal detail');

      errorHandler(err, {} as Request, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });
});
