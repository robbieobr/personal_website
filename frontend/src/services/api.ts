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
 * `fetch` resolves for 4xx/5xx responses, so a non-2xx response is turned
 * into a throw here. `fetch` also has no built-in timeout, so
 * `AbortSignal.timeout` aborts the request after `REQUEST_TIMEOUT_MS`; it
 * rejects with a `TimeoutError` DOMException, which callers wrap in the
 * same user-facing Error as any other failure.
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
