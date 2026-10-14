// Utility to resolve backend static image URLs (e.g. /uploads/cars/...)
// to full URLs or appropriate proxied paths across dev and production environments.

const getBackendBase = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string') {
    return envUrl.replace(/\/api\/?$/, '');
  }
  // If running in development with Vite proxy on port 5173, relative path is proxied.
  // We can return the direct backend origin or relative path.
  // Returning direct origin ensures images always load even if frontend is loaded from another host/port.
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
