// API client for FastAPI backend with automatic JWT header and fallback detection.
import { load, save, remove } from './storageService.js';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const getToken = () => load('token', null, (v) => typeof v === 'string' && v.length > 0);
export const setToken = (token) => (token ? save('token', token) : remove('token'));

let backendCheckPromise = null;
let backendOnline = null;
let lastCheckedAt = 0;

export async function isBackendOnline(force = false) {
  const now = Date.now();
  if (!force && backendOnline !== null && now - lastCheckedAt < 10000) {
    return backendOnline;
  }
  if (!backendCheckPromise) {
    backendCheckPromise = fetch(`${API_BASE}/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
      .then((res) => {
        backendOnline = res.ok;
        lastCheckedAt = Date.now();
        return backendOnline;
      })
      .catch(() => {
        backendOnline = false;
        lastCheckedAt = Date.now();
        return false;
      })
      .finally(() => {
        backendCheckPromise = null;
      });
  }
  return backendCheckPromise;
}

export async function apiRequest(path, { method = 'GET', body, token = getToken(), requireOnline = false } = {}) {
  if (!requireOnline && path !== '/health') {
    const online = await isBackendOnline();
    if (!online) {
      const offlineErr = new Error('Backend server is unreachable at 127.0.0.1:8000. Make sure FastAPI is running.');
      offlineErr.isOffline = true;
      throw offlineErr;
    }
  }

  const headers = { Accept: 'application/json' };
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body !== undefined && !isFormData) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? (isFormData ? body : JSON.stringify(body)) : undefined,
    });
    backendOnline = true;
    lastCheckedAt = Date.now();
  } catch {
    backendOnline = false;
    lastCheckedAt = Date.now();
    const netErr = new Error('Cannot connect to backend server (127.0.0.1:8000). Start the FastAPI server first.');
    netErr.isOffline = true;
    throw netErr;
  }

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

export async function uploadCarImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest('/admin/cars/upload-image', {
    method: 'POST',
    body: formData,
  });
}

export async function downloadInvoicePdf(bookingRef) {
  const token = getToken();
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/bookings/${bookingRef}/invoice.pdf`, {
    method: 'GET',
    headers,
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    const message = errorJson?.detail || `Failed to download PDF invoice (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Drivo-Invoice-${bookingRef}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
