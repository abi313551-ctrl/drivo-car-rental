// Safe localStorage wrapper: never throws, validates what it reads.
const PREFIX = 'drivo:';

export function load(key, fallback, validate) {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw == null) return fallback;
    const value = JSON.parse(raw);
    return validate && !validate(value) ? fallback : value;
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function remove(key) {
  try { window.localStorage.removeItem(PREFIX + key); } catch { /* ignore */ }
}
