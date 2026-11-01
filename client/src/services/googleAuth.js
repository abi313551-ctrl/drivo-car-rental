import { apiRequest } from './api.js';

let cachedClientId = null;

export async function getGoogleClientId() {
  if (cachedClientId) return cachedClientId;

  // 1. Check Vite environment variable
  const envId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (envId && typeof envId === 'string' && envId.trim() && !envId.includes('YOUR_')) {
    cachedClientId = envId.trim();
    return cachedClientId;
  }

  // 2. Fetch from backend config endpoint
  try {
    const res = await apiRequest('/auth/google/config');
    if (res?.clientId && typeof res.clientId === 'string' && res.clientId.trim()) {
      cachedClientId = res.clientId.trim();
      return cachedClientId;
    }
  } catch {
    // Backend unreachable or offline
  }

  return '642440068845-a8pmsaqqnloutgicm9kkeohqgdtjbrec.apps.googleusercontent.com';
}

/**
 * Waits for window.google.accounts.id to become available if the external script is still loading.
 */
export async function waitForGoogleSDK(timeoutMs = 3000) {
  const start = Date.now();
  while (!window.google?.accounts?.id && Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 80));
  }
  return !!window.google?.accounts?.id;
}

/**
 * Initializes Google Identity Services (GSI) for a callback handler.
 */
export async function initGoogleIdentityServices(onCredential) {
  const sdkReady = await waitForGoogleSDK();
  if (!sdkReady) return false;

  const clientId = await getGoogleClientId();
  if (!clientId || !window.google?.accounts?.id) {
    return false;
  }

  try {
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response?.credential) {
          onCredential(response.credential);
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    return true;
  } catch (err) {
    console.warn('Google Identity initialization notice:', err);
    return false;
  }
}

/**
 * Renders the official Google Sign-In button into a container element.
 * Guarantees that any prior rendered buttons are cleared to prevent duplicates.
 */
export async function setupGoogleSignIn(containerElement, onCredential, onRendered) {
  if (!containerElement) return false;

  const initialized = await initGoogleIdentityServices(onCredential);
  if (!initialized || !window.google?.accounts?.id?.renderButton) {
    return false;
  }

  try {
    // Clear any previous button iframe to prevent duplicates during React StrictMode / re-mounts
    containerElement.innerHTML = '';

    const parentWidth = containerElement.parentElement?.offsetWidth || containerElement.offsetWidth || 360;
    const buttonWidth = Math.min(Math.max(parentWidth, 240), 400);

    window.google.accounts.id.renderButton(containerElement, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width: buttonWidth,
    });

    if (typeof onRendered === 'function') {
      onRendered(true);
    }
    return true;
  } catch (e) {
    console.warn('Google renderButton notice:', e);
    return false;
  }
}

/**
 * Explicitly triggers the Google Sign-In prompt.
 */
export async function triggerGooglePrompt(onCredential, fallbackAction) {
  const initialized = await initGoogleIdentityServices(onCredential);
  if (!initialized || !window.google?.accounts?.id) {
    if (fallbackAction) fallbackAction();
    return;
  }

  window.google.accounts.id.prompt((notification) => {
    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
      // If One Tap is skipped/dismissed or cooldown active, fallback to click action
      if (fallbackAction) fallbackAction();
    }
  });
}
