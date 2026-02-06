/**
 * Authenticated fetch utility with automatic token refresh.
 *
 * On 401, attempts to refresh the access token using the stored refresh token.
 * If refresh succeeds, retries the original request with the new token.
 * If refresh fails, clears auth state and redirects to login.
 *
 * This permanently prevents the recurring "401 on admin pages" issue
 * caused by expired access tokens.
 */

const _rawApiUrl =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2026';
const API_BASE_URL = `${_rawApiUrl.replace(/\/api\/v1\/?$/, '')}/api/v1`;

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  USER: 'auth_user',
};

// Prevent multiple concurrent refresh attempts
let refreshPromise: Promise<string | null> | null = null;

/**
 * Try to refresh the access token using the stored refresh token.
 * Returns the new access token or null on failure.
 * Deduplicates concurrent refresh calls.
 */
async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return null;

      const data = await response.json();
      if (data.accessToken && data.refreshToken) {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
        return data.accessToken as string;
      }
      return null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Clear auth state and redirect to login.
 */
function clearAuthAndRedirect() {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
  // Use window.location for a hard redirect to clear React state
  if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
    window.location.href = '/login';
  }
}

/**
 * Fetch with automatic auth token injection and 401 refresh retry.
 *
 * @param url - Full URL or path (if path, API_BASE_URL is prepended)
 * @param options - Standard fetch options (token is added automatically)
 * @returns Response object
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

  const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

  // If there's no token at all, redirect to login immediately
  if (!accessToken) {
    clearAuthAndRedirect();
    throw new Error('Not authenticated');
  }

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Authorization', `Bearer ${accessToken}`);

  const response = await fetch(fullUrl, { ...options, headers });

  // If not 401, return as-is
  if (response.status !== 401) {
    return response;
  }

  // Got 401 — attempt token refresh
  const newToken = await refreshAccessToken();

  if (!newToken) {
    // Refresh failed — clear auth and redirect
    clearAuthAndRedirect();
    throw new Error('Session expired. Please log in again.');
  }

  // Retry the original request with the new token
  const retryHeaders = new Headers(options.headers);
  retryHeaders.set('Content-Type', 'application/json');
  retryHeaders.set('Authorization', `Bearer ${newToken}`);

  return fetch(fullUrl, { ...options, headers: retryHeaders });
}

export default fetchWithAuth;
