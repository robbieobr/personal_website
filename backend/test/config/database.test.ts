import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetConnection = vi.fn();

vi.mock('mysql2/promise', () => ({
  default: {
    createPool: vi.fn(() => ({ getConnection: mockGetConnection })),
  },
}));

describe('database config', () => {
  beforeEach(() => {
    vi.resetModules();
    mockGetConnection.mockReset();
  });

  it('creates a pool with default values when env vars are not set', async () => {
    delete process.env.DB_HOST;
    delete process.env.DB_PORT;
    delete process.env.DB_USER;
    delete process.env.DB_PASSWORD;
    delete process.env.DB_NAME;

    const mysql = await import('mysql2/promise');
    await import('../../src/config/database');

    expect(mysql.default.createPool).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        database: 'personal_website',
        connectionLimit: 10,
      })
    );
  });

  it('creates a pool using environment variables when set', async () => {
    process.env.DB_HOST = 'db.example.com';
    process.env.DB_PORT = '3307';
    process.env.DB_USER = 'admin';
    process.env.DB_PASSWORD = 'secret';
    process.env.DB_NAME = 'mydb';

    const mysql = await import('mysql2/promise');
    await import('../../src/config/database');

    expect(mysql.default.createPool).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'db.example.com',
        port: 3307,
        user: 'admin',
        password: 'secret',
        database: 'mydb',
      })
    );

    delete process.env.DB_HOST;
    delete process.env.DB_PORT;
    delete process.env.DB_USER;
    delete process.env.DB_PASSWORD;
    delete process.env.DB_NAME;
  });
});
