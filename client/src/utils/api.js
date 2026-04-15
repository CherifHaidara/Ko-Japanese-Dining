export async function readResponsePayload(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text);
    } catch {
      return { message: 'The server returned invalid JSON.' };
    }
  }

  return { message: text };
}

export function normalizeApiError(errorMessage, options = {}) {
  const {
    fallback = 'Something went wrong. Please try again.',
    unavailable = 'The app could not reach the backend API. Make sure the server is running and try again.',
    invalidJson = unavailable,
    unauthorized = 'Your session expired. Please sign in again.',
  } = options;

  if (!errorMessage) {
    return fallback;
  }

  if (/invalid or expired token/i.test(errorMessage) || /no token provided/i.test(errorMessage)) {
    return unauthorized;
  }

  if (/proxy error/i.test(errorMessage) || /failed to fetch/i.test(errorMessage) || /networkerror/i.test(errorMessage) || /load failed/i.test(errorMessage)) {
    return unavailable;
  }

  if (
    /unexpected token/i.test(errorMessage) ||
    /unexpected end of json input/i.test(errorMessage) ||
    /not valid json/i.test(errorMessage) ||
    /invalid json/i.test(errorMessage) ||
    /json\.parse/i.test(errorMessage)
  ) {
    return invalidJson;
  }

  return errorMessage;
}

export async function parseApiResponse(response, options = {}) {
  const data = await readResponsePayload(response);

  if (!response.ok) {
    const error = new Error(normalizeApiError(data.message || response.statusText, options));
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
