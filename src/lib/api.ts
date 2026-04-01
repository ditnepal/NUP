const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin + '/api/v1';
  }
  return '/api/v1';
};

const API_URL = getApiUrl();

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getAuthHeaders = (endpoint: string): Record<string, string> => {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};
  
  // Only send token if it exists and is not a placeholder string
  // AND if the endpoint is not explicitly public
  const isPublic = endpoint.startsWith('/public') || endpoint.startsWith('/auth/login') || endpoint.startsWith('/auth/register');
  
  if (token && token !== 'null' && token !== 'undefined' && token.length > 10 && !isPublic) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

const fetchWithRetry = async (url: string, options: RequestInit, retries = 5, backoff = 2000): Promise<Response> => {
  console.log(`[API] Fetching: ${options.method || 'GET'} ${url}`, {
    headers: options.headers ? Object.keys(options.headers) : []
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
    
    try {
      errorData = text ? JSON.parse(text) : {};
      errorMessage = (errorData as any).message || (errorData as any).error || errorMessage;
      
      if ((errorData as any).details && Array.isArray((errorData as any).details)) {
        errorMessage += ': ' + (errorData as any).details.map((d: any) => `${d.path.join('.')}: ${d.message}`).join(', ');
      }
      
      // Handle Unauthorized error (Invalid token)
      if (response.status === 401 && (errorMessage.includes('Invalid token') || errorMessage.includes('Missing or invalid token'))) {
        console.warn('Unauthorized: Invalid token. Clearing session...');
        localStorage.removeItem('token');
        // Only redirect if not already on login page
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          window.location.href = '/'; 
        }
      }
    } catch (e) {
      // Handle non-JSON (HTML) responses from Proxy/Infrastructure
      if (text.includes('<html>')) {
        errorMessage = `Infrastructure Error (${response.status}): The request was blocked before reaching the server. Check if the URL is correct and if you have the necessary permissions.`;
        console.error(`[API 403 HTML] Full response:`, text);
      } else {
        errorMessage = `API Error: ${response.status} ${response.statusText}`;
      }
      console.error(`API Error (non-JSON) [${response.status}]:`, text.substring(0, 200));
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
      headers: getAuthHeaders(endpoint),
    });
    return handleResponse(response);
  },

  post: async (endpoint: string, data: any) => {
    const response = await fetchWithRetry(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(endpoint),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  postFormData: async (endpoint: string, formData: FormData) => {
    const response = await fetchWithRetry(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: getAuthHeaders(endpoint),
      body: formData,
    });
    return handleResponse(response);
  },

  put: async (endpoint: string, data: any) => {
    const response = await fetchWithRetry(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(endpoint),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  patch: async (endpoint: string, data: any) => {
    const response = await fetchWithRetry(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(endpoint),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (endpoint: string, data?: any) => {
    const response = await fetchWithRetry(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(endpoint),
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse(response);
  },
};
