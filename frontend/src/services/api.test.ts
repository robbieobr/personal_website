import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockUserProfile, mockUser } from '../test/fixtures';

// Mock axios module before importing api
vi.mock('axios', async () => {
  const mockGet = vi.fn();
  const mockInstance = { get: mockGet };
  return {
    default: {
      create: vi.fn(() => mockInstance),
    },
    __mockGet: mockGet,
  };
});

describe('api service', () => {
  let mockGet: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    // Get a reference to the mock `get` function via the mocked axios module
    const axiosMod = await import('axios');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockGet = (axiosMod as any).__mockGet;
    mockGet.mockReset();
  });

  describe('getUserProfile', () => {
    it('returns user profile on success', async () => {
      mockGet.mockResolvedValue({ data: mockUserProfile });
      const { getUserProfile } = await import('./api');
      const result = await getUserProfile(1);
      expect(result).toEqual(mockUserProfile);
      expect(mockGet).toHaveBeenCalledWith('/users/1/profile');
    });

    it('throws on error', async () => {
      mockGet.mockRejectedValue(new Error('Network Error'));
      const { getUserProfile } = await import('./api');
      await expect(getUserProfile(1)).rejects.toThrow('Failed to fetch user profile');
    });
  });

  describe('getUser', () => {
    it('returns user on success', async () => {
      mockGet.mockResolvedValue({ data: mockUser });
      const { getUser } = await import('./api');
      const result = await getUser(1);
      expect(result).toEqual(mockUser);
      expect(mockGet).toHaveBeenCalledWith('/users/1');
    });

    it('throws on error', async () => {
      mockGet.mockRejectedValue(new Error('Network Error'));
      const { getUser } = await import('./api');
      await expect(getUser(1)).rejects.toThrow('Failed to fetch user');
    });
  });
});

