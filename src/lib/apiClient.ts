// src/lib/apiClient.ts

const getCookieValue = (name: string) => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  if (match) return decodeURIComponent(match[2]);
  return null;
};

const getPortalContext = () => {
  if (typeof window === "undefined") return "staff";
  return window.location.pathname.startsWith("/investor")
    ? "investor"
    : "staff";
};

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

// Single, unified options shape — every method (get/post/put/delete/postBlob)
// is built on top of this, so there is only ONE place that knows how to
// turn a fetch Response into json/blob/text/raw.
export interface ApiClientOptions extends RequestInit {
  responseType?: "json" | "blob" | "text" | "raw";
}

async function fetchWithConfig<T>(
  endpoint: string,
  options: ApiClientOptions = {},
): Promise<T> {
  const portal = getPortalContext();
  let token = getCookieValue(`${portal}-auth-token`);

  const getHeaders = (activeToken: string | null) => {
    const headers = new Headers(options.headers || {});
    if (!headers.has("Content-Type"))
      headers.set("Content-Type", "application/json");
    if (activeToken) headers.set("Authorization", `Bearer ${activeToken}`);
    return headers;
  };

  const baseUrl = "/api";
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  try {
    let response = await fetch(`${baseUrl}${cleanEndpoint}`, {
      ...options,
      headers: getHeaders(token),
      credentials: "same-origin",
    });

    // ─── REFRESH TOKEN INTERCEPTOR ───
    // Investors do not use refresh tokens (their JWT lasts 7 days), so skip refresh logic for them.
    if (
      response.status === 401 &&
      !endpoint.includes("/auth/refresh") &&
      portal === "staff"
    ) {
      const refreshToken = getCookieValue(`${portal}-refresh-token`);
      const userId = getCookieValue(`${portal}-user-id`);

      if (refreshToken && userId) {
        if (!isRefreshing) {
          isRefreshing = true;

          refreshPromise = fetch(`${baseUrl}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: userId,
              refresh_token: refreshToken,
            }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.success && data.data.access_token) {
                const newAccess = data.data.access_token;
                const newRefresh = data.data.refresh_token || refreshToken;

                const expires = new Date();
                expires.setTime(expires.getTime() + 30 * 24 * 60 * 60 * 1000);
                document.cookie = `${portal}-auth-token=${newAccess}; path=/; expires=${expires.toUTCString()}; max-age=2592000; SameSite=Lax`;
                document.cookie = `${portal}-refresh-token=${newRefresh}; path=/; expires=${expires.toUTCString()}; max-age=2592000; SameSite=Lax`;

                return newAccess;
              }
              throw new Error("Refresh token invalid");
            })
            .catch(() => null)
            .finally(() => {
              isRefreshing = false;
            });
        }

        const newAccessToken = await refreshPromise;

        if (newAccessToken) {
          response = await fetch(`${baseUrl}${cleanEndpoint}`, {
            ...options,
            headers: getHeaders(newAccessToken),
            credentials: "same-origin",
          });
        }
      }

      // ─── FINAL LOGOUT IF REFRESH FAILS OR DOESN'T EXIST ───
      if (response.status === 401) {
        console.warn(
          "Unauthorized: The token expired or is invalid. Redirecting to login...",
        );
        if (typeof window !== "undefined") {
          document.cookie = `${portal}-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          document.cookie = `${portal}-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          document.cookie = `${portal}-user-id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;

          localStorage.clear();
          sessionStorage.clear();

          window.location.href =
            portal === "staff" ? "/distributor-portal" : "/login";
        }
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    // ─── RESPONSE TYPE INTERCEPTOR ───
    if (options.responseType === "blob") {
      return response.blob() as unknown as Promise<T>;
    }
    if (options.responseType === "text") {
      return response.text() as unknown as Promise<T>;
    }
    if (options.responseType === "raw") {
      return response as unknown as Promise<T>;
    }

    // Default JSON parse
    return response.json();
  } catch (error) {
    console.error(`API Client Error [${endpoint}]:`, error);
    throw error;
  }
}

export const apiClient = {
  get: <T = any>(endpoint: string, options?: ApiClientOptions) =>
    fetchWithConfig<T>(endpoint, { ...options, method: "GET" }),

  post: <T = any>(endpoint: string, data: any, options?: ApiClientOptions) =>
    fetchWithConfig<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Convenience wrapper kept for backward compatibility with
  // portfolioExport.ts / capitalGainsExport.ts, which call
  // apiClient.postBlob(...) directly. Internally this is just
  // post() with responseType forced to "blob" — same fetchWithConfig
  // path as everything else, so there is no second implementation
  // of blob-handling to keep in sync.
  postBlob: <T = Blob>(
    endpoint: string,
    data: any,
    options?: ApiClientOptions,
  ) =>
    fetchWithConfig<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
      responseType: "blob",
    }),

  put: <T = any>(endpoint: string, data: any, options?: ApiClientOptions) =>
    fetchWithConfig<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: <T = any>(endpoint: string, options?: ApiClientOptions) =>
    fetchWithConfig<T>(endpoint, { ...options, method: "DELETE" }),
};
