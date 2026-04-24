// src/lib/apiClient.ts

const getAuthToken = () => {

  // 🛑 TEMPORARY BYPASS: Hardcoded token for local testing
  if (process.env.NODE_ENV === 'development') {
    return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwYjVmN2YxZC1kYmViLTQ2NTQtYTI2OS04MzcwN2ViNGM4NjkiLCJwaG9uZV9udW1iZXIiOiIrOTE4NDg3OTk2NTU2Iiwicm9sZXMiOlt7ImlkIjoiZDE0OTI4ZDgtN2QzYi00YzY5LWJmMTctOWJlZDBhM2YzMGJjIiwicm9sZSI6IkZJTklRX0FETUlOIiwidGVuYW50X2lkIjpudWxsLCJjb21wYW55X2lkIjpudWxsLCJjb21wYW55X25hbWUiOm51bGwsImZpcnN0X25hbWUiOiJGaW5JUSIsImxhc3RfbmFtZSI6IlN1cGVyQWRtaW4ifSx7ImlkIjoiNDdjZmQzOTgtYTBkNS00Y2JmLTk2ZTUtZWQxM2UxNWU1MDMyIiwicm9sZSI6IkNPTVBBTllfQURNSU4iLCJ0ZW5hbnRfaWQiOiJjMWZjY2EwNy02MTI1LTRhMmUtYTkzNi0yOGM2ODYxYTI1ZWQiLCJjb21wYW55X2lkIjoiOWQwMzQzNTMtZDY1OC00ZmE1LWI1YTEtZTQ2MjUzY2RiYzBjIiwiY29tcGFueV9uYW1lIjoiU2hyaW5hdGhqaSBJbnZlc3RtZW50cyIsImZpcnN0X25hbWUiOm51bGwsImxhc3RfbmFtZSI6bnVsbH1dLCJpYXQiOjE3NzcwMjY3NzcsImV4cCI6MTc3NzExMzE3N30.V-UTgcCVyGAGq-bMWmJZ0k35V45Zolsll2Dj2ew6kmY";
  }

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
      // 'same-origin' is required for the local proxy to handle headers correctly
      credentials: 'same-origin', 
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.warn("Unauthorized: The token was sent but rejected by the server.");
      }
      
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