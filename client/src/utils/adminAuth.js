function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return atob(padded);
}

function parseTokenPayload(token) {
  try {
    const parts = String(token || '').split('.');
    if (parts.length < 2) return null;
    return JSON.parse(decodeBase64Url(parts[1]));
  } catch {
    return null;
  }
}

export function clearAdminToken() {
  localStorage.removeItem('token');
}

export function getAdminTokenState(token) {
  if (!token) {
    return {
      isValid: false,
      message: 'Please sign in to access the admin dashboard.',
    };
  }

  const payload = parseTokenPayload(token);

  if (!payload) {
    return {
      isValid: false,
      message: 'Your admin session could not be verified. Please sign in again.',
    };
  }

  if (payload.role !== 'admin') {
    return {
      isValid: false,
      message: 'Admin access required.',
    };
  }

  if (typeof payload.exp === 'number' && Date.now() >= payload.exp * 1000) {
    return {
      isValid: false,
      message: 'Your admin session expired. Please sign in again.',
    };
  }

  return {
    isValid: true,
    payload,
  };
}
