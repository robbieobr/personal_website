import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserProfile, getUser, updateUser } from '../../services/api';

const { mockGet, mockPut } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPut: vi.fn(),
}));

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: mockGet,
      put: mockPut,
    })),
  },
}));

describe('api service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('getUserProfile', () => {
    it('returns profile data on success', async () => {
      const mockData = { user: { id: 1 }, jobHistory: [], education: [] };
      mockGet.mockResolvedValueOnce({ data: mockData });

      const result = await getUserProfile(1);

      expect(result).toEqual(mockData);
      expect(mockGet).toHaveBeenCalledWith('/users/1/profile');
    });

    it('throws a safe error message on failure', async () => {
      mockGet.mockRejectedValueOnce(new Error('Network error'));

      await expect(getUserProfile(1)).rejects.toThrow('Failed to fetch user profile');
    });

    it('does not expose raw error details on failure', async () => {
      mockGet.mockRejectedValueOnce(new Error('Network error'));

      try {
        await getUserProfile(1);
      } catch (err) {
        expect((err as Error).message).toBe('Failed to fetch user profile');
      }
    });
  });

  describe('getUser', () => {
    it('returns user data on success', async () => {
      const mockUser = { id: 1, name: 'John', title: 'Dev', email: 'j@e.com', phone: '123', profileImage: null, bio: null };
      mockGet.mockResolvedValueOnce({ data: mockUser });

      const result = await getUser(1);

      expect(result).toEqual(mockUser);
      expect(mockGet).toHaveBeenCalledWith('/users/1');
    });

    it('throws a safe error message on failure', async () => {
      mockGet.mockRejectedValueOnce(new Error('Network error'));

      await expect(getUser(1)).rejects.toThrow('Failed to fetch user');
    });
  });

  describe('updateUser', () => {
    it('calls put with user data on success', async () => {
      mockPut.mockResolvedValueOnce({});
      const updateData = { name: 'Jane' };

      await updateUser(1, updateData);

      expect(mockPut).toHaveBeenCalledWith('/users/1', updateData);
    });

    it('throws a safe error message on failure', async () => {
      mockPut.mockRejectedValueOnce(new Error('Network error'));

      await expect(updateUser(1, { name: 'Jane' })).rejects.toThrow('Failed to update user');
    });
  });
});
