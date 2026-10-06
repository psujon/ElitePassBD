const getApiBaseUrl = () => {
  if (typeof window === 'undefined') return 'http://127.0.0.1:5000/api';
  const { hostname, port, protocol } = window.location;
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.endsWith('.local') ||
    port === '5173' ||
    port === '5174' ||
    port === '5175'
  ) {
    return `${protocol}//${hostname}:5000/api`;
  }
  return 'https://api.elitepassbd.com/api';
};

export const API_BASE_URL = getApiBaseUrl();

const apiRequest = async (endpoint, options = {}, retries = 1) => {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type') || '';
    let data;

    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch (_) {
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`API endpoint '${endpoint}' was not found (404). Please ensure the latest backend files are uploaded to the server and PM2 is restarted.`);
          }
          throw new Error(`Server returned HTTP ${response.status} (${response.statusText || 'Error'}). Please check backend server status.`);
        }
        data = { message: text };
      }
    }

    if (!response.ok) {
      throw new Error(data?.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    // Automatic retry once for GET requests during dev server restart/startup
    if (retries > 0 && (!options.method || options.method === 'GET')) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return apiRequest(endpoint, options, retries - 1);
    }
    throw error;
  }
};

export const api = {
  get: (endpoint, options = {}) => {
    let url = endpoint;
    if (options && options.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, val);
        }
      });
      const qs = searchParams.toString();
      if (qs) {
        url += (url.includes('?') ? '&' : '?') + qs;
      }
    }
    return apiRequest(url, { ...options, method: 'GET' });
  },
  post: (endpoint, body, options = {}) => apiRequest(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body, options = {}) => apiRequest(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'DELETE' }),
};
