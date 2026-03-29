const API_URL = '/api/v1';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (url: string, options: RequestInit, retries = 5, backoff = 2000): Promise<Response> => {
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
  if (!response.ok) {
    let errorMessage = 'API Error';
    const text = await response.text();
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
        window.location.href = '/'; 
      }
    } catch (e) {
      // Handle non-JSON (HTML) responses from Proxy/Infrastructure
      if (text.includes('<html>')) {
        errorMessage = `Infrastructure Error (${response.status}): The request was blocked before reaching the server.`;
      } else {
        errorMessage = `API Error: ${response.status} ${response.statusText}`;
      }
      console.error(`API Error (non-JSON) [${response.status}]:`, text.substring(0, 100));
    }
    
    const error: any = new Error(errorMessage);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch (e) {
    console.error('API Success (non-JSON):', text.substring(0, 100));
    throw new Error('Invalid JSON response from server');
  }
};

export const api = {
  get: async (endpoint: string) => {
    const token = localStorage.getItem('token');
    const response = await fetchWithRetry(`${API_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },

  post: async (endpoint: string, data: any) => {
    const token = localStorage.getItem('token');
    const response = await fetchWithRetry(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  postFormData: async (endpoint: string, formData: FormData) => {
    const token = localStorage.getItem('token');
    const response = await fetchWithRetry(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    return handleResponse(response);
  },

  put: async (endpoint: string, data: any) => {
    const token = localStorage.getItem('token');
    const response = await fetchWithRetry(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  patch: async (endpoint: string, data: any) => {
    const token = localStorage.getItem('token');
    const response = await fetchWithRetry(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (endpoint: string, data?: any) => {
    const token = localStorage.getItem('token');
    const response = await fetchWithRetry(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse(response);
  },
};
