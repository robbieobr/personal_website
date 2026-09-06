import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockUserProfile, mockUser } from '../fixtures';
import { getUserProfile, getUser } from '../../src/services/api';

const jsonResponse = (data: unknown, status = 200): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  }) as Response;

describe('api service', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('getUserProfile', () => {
    it('returns user profile on success', async () => {
      mockFetch.mockResolvedValue(jsonResponse(mockUserProfile));
      const result = await getUserProfile(1);
      expect(result).toEqual(mockUserProfile);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/users/1/profile',
        expect.objectContaining({
          method: 'GET',
          credentials: 'omit',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          signal: expect.any(AbortSignal),
        })
      );
    });

    it('throws on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network Error'));
      await expect(getUserProfile(1)).rejects.toThrow('Failed to fetch user profile');
    });

    it('throws on a non-2xx response', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ error: 'nope' }, 500));
      await expect(getUserProfile(1)).rejects.toThrow('Failed to fetch user profile');
    });

    it('throws on a request timeout', async () => {
      mockFetch.mockRejectedValue(new DOMException('The operation timed out.', 'TimeoutError'));
      await expect(getUserProfile(1)).rejects.toThrow('Failed to fetch user profile');
    });

    it('preserves the underlying failure as the error cause', async () => {
      const underlying = new Error('Network Error');
      mockFetch.mockRejectedValue(underlying);
      await expect(getUserProfile(1)).rejects.toMatchObject({ cause: underlying });
    });
  });

  describe('getUser', () => {
    it('returns user on success', async () => {
      mockFetch.mockResolvedValue(jsonResponse(mockUser));
      const result = await getUser(1);
      expect(result).toEqual(mockUser);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/users/1',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('throws on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network Error'));
      await expect(getUser(1)).rejects.toThrow('Failed to fetch user');
    });

    it('throws on a non-2xx response', async () => {
      mockFetch.mockResolvedValue(jsonResponse(null, 404));
      await expect(getUser(1)).rejects.toThrow('Failed to fetch user');
    });

    it('throws when the response body is not valid JSON', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError('Unexpected token < in JSON');
        },
      } as unknown as Response);
      await expect(getUser(1)).rejects.toThrow('Failed to fetch user');
    });
  });
});
