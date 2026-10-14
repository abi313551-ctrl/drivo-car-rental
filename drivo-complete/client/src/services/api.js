// API client for FastAPI backend with automatic JWT header and fallback detection.
import { load, save, remove } from './storageService.js';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const getToken = () => load('token', null, (v) => typeof v === 'string' && v.length > 0);
export const setToken = (token) => (token ? save('token', token) : remove('token'));

export async function apiRequest(path, { method = 'GET', body, token = getToken() } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    let message = data?.detail || data?.error || `Request failed (${res.status})`;
    if (Array.isArray(message)) {
      message = message.map((m) => m.msg?.replace(/^Value error,\s*/i, '') || JSON.stringify(m)).join(', ');
    }
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return data;
}
