const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

// Helper to safely get token without crashing in strict-privacy browsers
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('token');
  } catch (e) {
    // Browser blocking localStorage (e.g., Safari blocked cookies/storage)
    return null; 
  }
};

async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, headers, ...customConfig } = options;

  // 1. Build URL with query parameters securely
  const url = new URL(`${BASE_URL}${endpoint}`);
  if (params) {
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
  }

  const token = getAuthToken();

  // 2. Configure Strict Headers
  const config: RequestInit = {
    ...customConfig,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      // Prevent browsers from caching sensitive API responses
      'Cache-Control': 'no-store, max-age=0', 
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };

  try {
    const response = await fetch(url.toString(), config);

    // 204 No Content handling
    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json().catch(() => ({}));

    // 3. Error Handling
    if (!response.ok) {
      // Handle Unauthorized globally
      if (response.status === 401 && typeof window !== 'undefined') {
        try {
          localStorage.removeItem('token');
        } catch(e) {}
        // Secure redirect to login, clearing state
        window.location.replace('/login'); 
      }
      
      // Throw a sanitized error. Do NOT throw raw backend objects that might contain stack traces.
      throw new Error(data?.message || 'A server error occurred. Please try again later.');
    }

    return data as T;
  } catch (error: any) {
    // 4. Secure Logging: Only log in development to prevent PII leakage in prod tools
    if (process.env.NODE_ENV === 'development') {
      console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, error.message);
    }
    throw error;
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: FetchOptions) => 
    fetchApi<T>(endpoint, { ...options, method: 'GET' }),
    
  post: <T>(endpoint: string, body?: any, options?: FetchOptions) => 
    fetchApi<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
    
  put: <T>(endpoint: string, body?: any, options?: FetchOptions) => 
    fetchApi<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
    
  delete: <T>(endpoint: string, options?: FetchOptions) => 
    fetchApi<T>(endpoint, { ...options, method: 'DELETE' }),
};