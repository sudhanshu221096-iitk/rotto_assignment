import type { ApiResponse } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const TOKEN_KEY = 'rotto_token';

const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

const buildHeaders = (): Record<string, string> => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async <T>(res: Response): Promise<ApiResponse<T>> => {
  const data: ApiResponse<T> = await res.json();
  return data;
};

export const api = {
  get: <T = unknown>(endpoint: string): Promise<ApiResponse<T>> => {
    return fetch(`${API_BASE}${endpoint}`, {
      method: 'GET',
      headers: buildHeaders(),
    }).then((res) => handleResponse<T>(res));
  },

  post: <T = unknown>(endpoint: string, body: unknown): Promise<ApiResponse<T>> => {
    return fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(body),
    }).then((res) => handleResponse<T>(res));
  },

  put: <T = unknown>(endpoint: string, body: unknown): Promise<ApiResponse<T>> => {
    return fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: buildHeaders(),
      body: JSON.stringify(body),
    }).then((res) => handleResponse<T>(res));
  },

  delete: <T = unknown>(endpoint: string): Promise<ApiResponse<T>> => {
    return fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers: buildHeaders(),
    }).then((res) => handleResponse<T>(res));
  },
};
