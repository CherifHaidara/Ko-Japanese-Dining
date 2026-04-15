import { getToken } from '../context/AuthContext';

/**
 * Wrapper around fetch that automatically attaches the auth token
 * and logs the user out if the server returns 401 (expired/invalid token).
 */
export async function authFetch(url, options = {}) {
  const token = getToken();

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (res.status === 401) {
    localStorage.removeItem('ko_token');
    localStorage.removeItem('ko_user');
    window.location.href = '/login';
    return res;
  }

  return res;
}
