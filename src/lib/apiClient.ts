// src/lib/apiClient.ts

// Helper to safely get the cookie on the client side
const getAuthToken = () => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )auth-token=([^;]+)'));
  if (match) return match[2];
  return null;
};

// Generic fetch wrapper to standardize API calls
async function fetchWithConfig<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  
  // Always attach JSON headers
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Attach the Bearer token if it exists
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Use the NEXT_PUBLIC_API_URL environment variable, or fallback to relative routing
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // You could handle specific global errors here (e.g., 401 Unauthorized -> Force Logout)
      if (response.status === 401) {
        if (typeof document !== 'undefined') {
          // Wipe cookie and redirect to login if unauthorized
          document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          window.location.href = '/login';
        }
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    // Some APIs might return empty responses, handle gracefully
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    
    return {} as T;

  } catch (error) {
    console.error(`API Client Error [${endpoint}]:`, error);
    throw error;
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) => 
    fetchWithConfig<T>(endpoint, { ...options, method: 'GET' }),
    
  post: <T>(endpoint: string, data: any, options?: RequestInit) => 
    fetchWithConfig<T>(endpoint, { 
      ...options, 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
    
  put: <T>(endpoint: string, data: any, options?: RequestInit) => 
    fetchWithConfig<T>(endpoint, { 
      ...options, 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }),
    
  delete: <T>(endpoint: string, options?: RequestInit) => 
    fetchWithConfig<T>(endpoint, { ...options, method: 'DELETE' }),
};