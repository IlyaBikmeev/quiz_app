const _apiUrl = import.meta.env.VITE_API_URL;
const API_URL = _apiUrl === '' ? '' : (_apiUrl || 'http://localhost:8080');

let onUnauthorized = () => {};

export function setOnUnauthorized(callback) {
  onUnauthorized = callback;
}

function getToken() {
  return localStorage.getItem('authToken');
}

export function getAuthHeaders() {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function apiFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_URL}${path}`;
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    if (!(options.headers && options.headers['Content-Type'])) {
      headers['Content-Type'] = 'application/json';
    }
  }
  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
  if (res.status === 401) {
    onUnauthorized();
    throw new Error('Необходима авторизация');
  }
  return res;
}

export async function apiJson(path, options = {}) {
  const res = await apiFetch(path, options);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (!text) return null;
  return JSON.parse(text);
}

export function getApiUrl() {
  return API_URL;
}
