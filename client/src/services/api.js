// API client for FastAPI backend with automatic JWT header and fallback detection.
import { load, save, remove } from './storageService.js';

export function getApiBase() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    const trimmed = envUrl.trim().replace(/\/+$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  }
  // In production builds (deployed on Vercel), default directly to the deployed Render backend
  if (import.meta.env.PROD) {
    return 'https://drivo-car-rental.onrender.com/api';
  }
  // In local development, use Vite's proxy '/api'
  return '/api';
}

export const API_BASE = getApiBase();

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
  const targetHostDesc = API_BASE.startsWith('http') ? 'https://drivo-car-rental.onrender.com' : '127.0.0.1:8000';

  if (!requireOnline && path !== '/health') {
    const online = await isBackendOnline();
    if (!online) {
      const offlineErr = new Error(`Backend server is currently waking up or unreachable (${targetHostDesc}). Please allow a moment and try again.`);
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
    const netErr = new Error(`Cannot connect to backend server (${targetHostDesc}). If Render is waking from sleep, please wait 20-30 seconds.`);
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

export async function getPaymentConfig() {
  return apiRequest('/payments/config', { method: 'GET' });
}

export async function createPaymentOrder(bookingRef) {
  return apiRequest('/payments/create-order', {
    method: 'POST',
    body: { bookingRef },
  });
}

export async function verifyPaymentSignature(payload) {
  return apiRequest('/payments/verify', {
    method: 'POST',
    body: payload,
  });
}

export async function logPaymentFailure(payload) {
  return apiRequest('/payments/failure', {
    method: 'POST',
    body: payload,
  });
}

export async function getBookingPayments(bookingRef) {
  return apiRequest(`/payments/booking/${bookingRef}`, { method: 'GET' });
}

export async function getDecorationPackages() {
  return apiRequest('/decorations/packages', { method: 'GET' });
}

export async function calculateDecorationPrice(payload) {
  return apiRequest('/decorations/calculate-price', {
    method: 'POST',
    body: payload,
  });
}

export async function createDecorationBooking(payload) {
  return apiRequest('/decorations/bookings', {
    method: 'POST',
    body: payload,
  });
}

export async function getMyDecorationBookings() {
  return apiRequest('/decorations/bookings/my', { method: 'GET' });
}

