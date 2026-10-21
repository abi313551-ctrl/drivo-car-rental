// Utility to resolve backend static image URLs (e.g. /uploads/cars/...)
// to full URLs or appropriate proxied paths across dev and production environments.

const getBackendBase = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/api\/?$/, '').replace(/\/+$/, '');
  }
  // In production builds (e.g. deployed on Vercel), point to Render backend origin
  if (import.meta.env.PROD) {
    return 'https://drivo-car-rental.onrender.com';
  }
  // In local development with Vite proxy on port 5173
  return 'http://127.0.0.1:8000';
};

const BACKEND_BASE = getBackendBase();

export function resolveImageUrl(src) {
  if (!src || typeof src !== 'string') return '';
  const trimmed = src.trim();
  if (trimmed === '') return '';
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;

  if (trimmed.startsWith('/uploads')) {
    return `${BACKEND_BASE}${trimmed}`;
  }

  return trimmed;
}
