// src/lib/apiClient.ts

const getAuthToken = () => {

  if (typeof document === 'undefined') return null;
  
  // Decide which token to use based on the current path
  const path = window.location.pathname;
  const tokenName = path.startsWith('/investor') ? 'investor-auth-token' : 'staff-auth-token';
  
  const match = document.cookie.match(new RegExp('(^| )' + tokenName + '=([^;]+)'));
  if (match) return decodeURIComponent(match[2]);
  return null;
};


async function fetchWithConfig<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Rectification: Explicitly set the Bearer token
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Force relative path to trigger next.config.ts rewrites
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  
  // Ensure we don't end up with //investors
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  try {
    const response = await fetch(`${baseUrl}${cleanEndpoint}`, {
      ...options,
      headers,
      credentials: 'same-origin', 
    });

    if (!response.ok) {
      // // INSTANT REDIRECT ON EXPIRED TOKEN (401)
      // if (response.status === 401) {
      //   console.warn("Unauthorized: The token expired or is invalid. Redirecting to login...");
      //   if (typeof window !== 'undefined') {
      //     // Redirect distributor to their portal, investor to theirs
      //     window.location.href = window.location.pathname.startsWith('/distributor') 
      //       ? '/distributor-portal' 
      //       : '/login'; // for the investors
      //   }
      // }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    return response.json();
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
};