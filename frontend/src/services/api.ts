import { UserProfile, User } from '../types/index.js';

// Use the Vite proxy to avoid CORS issues
// The proxy in vite.config.ts handles routing to the appropriate backend
const API_BASE_URL = '/api';

const REQUEST_TIMEOUT_MS = 10000;

const DEFAULT_HEADERS: Readonly<Record<string, string>> = {
  'Content-Type': 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
};

/**
 * Minimal GET helper backed by the platform `fetch`.
 *
 * Replaces the previous axios instance. Two behavioural gaps have to be closed
 * explicitly, because `fetch` is more permissive than axios was:
 *  - `fetch` resolves for 4xx/5xx, so a non-2xx response is turned into a throw
 *    here to reproduce the old `validateStatus: 200 <= s < 300` contract.
 *  - `fetch` has no timeout, so `AbortSignal.timeout` aborts the request after
 *    the same 10s budget. It rejects with a `TimeoutError` DOMException, which
 *    the callers below wrap in the same user-facing Error as any other failure.
 */
const getJson = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers: DEFAULT_HEADERS,
    credentials: 'omit',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status code ${response.status}`);
  }

  return (await response.json()) as T;
};

export const getUserProfile = async (userId: number): Promise<UserProfile> => {
  try {
    return await getJson<UserProfile>(`/users/${userId}/profile`);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw new Error('Failed to fetch user profile', { cause: error });
  }
};

export const getUser = async (userId: number): Promise<User> => {
  try {
    return await getJson<User>(`/users/${userId}`);
  } catch (error) {
    console.error('Error fetching user:', error);
    throw new Error('Failed to fetch user', { cause: error });
  }
};
