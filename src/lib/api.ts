const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin + '/api/v1';
  }
  return '/api/v1';
};

const API_URL = getApiUrl();

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getAuthHeaders = (endpoint: string, method: string = 'GET', isFormData: boolean = false): Record<string, string> => {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  
  if (method !== 'GET' && method !== 'DELETE' && !isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  
  // Do not send Authorization header for public endpoints to avoid infrastructure/proxy 403 blocks
  // when a stale or invalid token is present in localStorage.
  const publicEndpoints = [
    '/auth/login', 
    '/auth/public-register', 
    '/public/config', 
    '/public/posts', 
    '/public/surveys', 
    '/public/polls',
    '/public/navigation',
    '/public/footer-links',
    '/public/social-links',
    '/public/pages'
  ];
  const isPublicEndpoint = publicEndpoints.some(p => endpoint.includes(p));

  // Only send token if it exists, is not a placeholder, and it's not a public endpoint
  if (!isPublicEndpoint && token && token !== 'null' && token !== 'undefined' && token.length > 10) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

const fetchWithRetry = async (url: string, options: RequestInit, retries = 5, backoff = 2000): Promise<Response> => {
  const isPublic = url.includes('/public') || url.includes('/auth/login') || url.includes('/auth/register');
  console.log(`[API] Fetching: ${options.method || 'GET'} ${url}`, {
    headers: options.headers ? Object.keys(options.headers) : [],
    isPublic
  });
  
  try {
    const response = await fetch(url, options);
    if (response.status === 429 && retries > 0) {
      console.warn(`Rate limit hit for ${url}. Retrying in ${backoff}ms...`);
      await sleep(backoff);
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      console.warn(`Fetch error for ${url}. Retrying in ${backoff}ms...`, error);
      await sleep(backoff);
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw error;
  }
};

const handleResponse = async (response: Response) => {
  const text = await response.text();
  
  if (!response.ok) {
    let errorMessage = 'API Error';
    let errorData = {};
    let shouldClearSession = false;
    
    try {
      errorData = text ? JSON.parse(text) : {};
      errorMessage = (errorData as any).message || (errorData as any).error || errorMessage;
      
      if ((errorData as any).details && Array.isArray((errorData as any).details)) {
        errorMessage += ': ' + (errorData as any).details.map((d: any) => `${d.path.join('.')}: ${d.message}`).join(', ');
      }
      
      // Handle Unauthorized error (Invalid token)
      if (response.status === 401) {
        shouldClearSession = true;
      }
    } catch (e) {
      // Handle non-JSON (HTML) responses from Proxy/Infrastructure
      if (text.includes('<html>')) {
        const urlPath = new URL(response.url).pathname;
        errorMessage = `Infrastructure Error (${response.status}): The request to ${urlPath} was blocked before reaching the server. This often happens if your session has expired or if you're trying to access a restricted resource. Please try logging out and logging back in.`;
        console.error(`[API ${response.status} HTML] Full response for ${urlPath}:`, text);
        
        // If we get a 403 HTML response, it's almost certainly an infrastructure block
        // due to a stale/invalid token being sent to a path the proxy protects.
        if (response.status === 403 || response.status === 401) {
          shouldClearSession = true;
        }
      } else {
        errorMessage = `API Error: ${response.status} ${response.statusText}`;
      }
      console.error(`API Error (non-JSON) [${response.status}]:`, text.substring(0, 200));
    }

    if (shouldClearSession) {
      const token = localStorage.getItem('token');
      if (token) {
        console.warn(`Auth/Infrastructure Error (${response.status}) for ${response.url}: Clearing session...`);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // If we're not on a public page or login page, redirect to home
        if (window.location.pathname !== '/login' && window.location.pathname !== '/' && !window.location.pathname.includes('/public')) {
          window.location.href = '/'; 
        } else if (window.location.pathname === '/') {
          // If we're at home, we still need to reload to clear the React 'user' state
          window.location.reload();
        }
      }
    }
    
    const error: any = new Error(errorMessage);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  try {
    return text ? JSON.parse(text) : {};
  } catch (e) {
    console.error('API Success (non-JSON):', text.substring(0, 100));
    throw new Error('Invalid JSON response from server');
  }
};

export const api = {
  get: async (endpoint: string) => {
    const response = await fetchWithRetry(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: getAuthHeaders(endpoint, 'GET'),
    });
    return handleResponse(response);
  },

  post: async (endpoint: string, data: any) => {
    const response = await fetchWithRetry(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: getAuthHeaders(endpoint, 'POST'),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  postFormData: async (endpoint: string, formData: FormData) => {
    const response = await fetchWithRetry(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: getAuthHeaders(endpoint, 'POST', true),
      body: formData,
    });
    return handleResponse(response);
  },

  put: async (endpoint: string, data: any) => {
    const response = await fetchWithRetry(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: getAuthHeaders(endpoint, 'PUT'),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  patch: async (endpoint: string, data: any) => {
    const response = await fetchWithRetry(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers: getAuthHeaders(endpoint, 'PATCH'),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (endpoint: string, data?: any) => {
    const response = await fetchWithRetry(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getAuthHeaders(endpoint, 'DELETE'),
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse(response);
  },
};
