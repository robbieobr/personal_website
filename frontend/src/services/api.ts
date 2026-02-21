
import axios from 'axios';
import { UserProfile, User } from '../types/index.js';

// Use the Vite proxy to avoid CORS issues
// The proxy in vite.config.ts handles routing to the appropriate backend
const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  validateStatus: (status) => status >= 200 && status < 300,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: false,
});

export const getUserProfile = async (userId: number): Promise<UserProfile> => {
  try {
    const response = await api.get(`/users/${userId}/profile`);
    return response.data;
  } catch (error) {
    // Never expose detailed error information to the UI
    console.error('Error fetching user profile');
    throw new Error('Failed to fetch user profile');
  }
};

export const getUser = async (userId: number): Promise<User> => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user');
    throw new Error('Failed to fetch user');
  }
};
