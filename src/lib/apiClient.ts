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

// Global variables to prevent infinite refresh loops when multiple API calls fail simultaneously
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Performs the fetch, including the 401 → refresh-token → retry → logout
 * flow. Returns the raw Response so callers can decide how to consume the
 * body (json() vs blob()).
 */
async function rawFetch(
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> {
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

  let response = await fetch(`${baseUrl}${cleanEndpoint}`, {
    ...options,
    headers: getHeaders(token),
    credentials: "same-origin",
  });

  // ─── REFRESH TOKEN INTERCEPTOR ───
  // Investors do not use refresh tokens (their JWT lasts 7 days), so skip refresh logic for them.
  if (response.status === 401 && !endpoint.includes("/auth/refresh") && portal === "staff") {
    const refreshToken = getCookieValue(`${portal}-refresh-token`);
    const userId = getCookieValue(`${portal}-user-id`);

    if (refreshToken && userId) {
      if (!isRefreshing) {
        isRefreshing = true;

        // Execute refresh token request (only for staff)
        refreshPromise = fetch(`${baseUrl}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, refresh_token: refreshToken }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.data.access_token) {
              const newAccess = data.data.access_token;
              const newRefresh = data.data.refresh_token || refreshToken;

              // Silently update cookies for another 30 days
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

      // If refresh was successful, retry original request
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

  return response;
}

async function fetchWithConfig<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  try {
    const response = await rawFetch(endpoint, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error(`API Client Error [${endpoint}]:`, error);
    throw error;
  }
}

export interface DownloadedFile {
  blob: Blob;
  filename: string;
}

/**
 * Parses a filename out of a Content-Disposition header, e.g.
 * `attachment; filename="Report_2026-07-01.pdf"` → `Report_2026-07-01.pdf`.
 */
function parseFilenameFromContentDisposition(
  header: string | null,
  fallback: string,
): string {
  if (!header) return fallback;
  const match = header.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return match?.[1] ? decodeURIComponent(match[1]) : fallback;
}

/**
 * Like fetchWithConfig, but for endpoints that return a binary file
 * (e.g. a generated PDF/Excel) instead of JSON. Shares the same
 * auth/refresh handling via rawFetch.
 */
async function fetchFile(
  endpoint: string,
  options: RequestInit = {},
  fallbackFilename: string = "download",
): Promise<DownloadedFile> {
  try {
    const response = await rawFetch(endpoint, options);

    if (!response.ok) {
      // Errors from these endpoints are still JSON (NestJS exception filters)
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    const blob = await response.blob();
    const filename = parseFilenameFromContentDisposition(
      response.headers.get("Content-Disposition"),
      fallbackFilename,
    );

    return { blob, filename };
  } catch (error) {
    console.error(`API Client Error [${endpoint}]:`, error);
    throw error;
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    fetchWithConfig<T>(endpoint, { ...options, method: "GET" }),
  post: <T>(endpoint: string, data: any, options?: RequestInit) =>
    fetchWithConfig<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
    }),
  put: <T>(endpoint: string, data: any, options?: RequestInit) =>
    fetchWithConfig<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: <T>(endpoint: string, options?: RequestInit) =>
    fetchWithConfig<T>(endpoint, { ...options, method: "DELETE" }),
  /**
   * POST that expects a binary file response (PDF/Excel) instead of JSON.
   * Use this for report "export" endpoints.
   */
  postForFile: (
    endpoint: string,
    data: any,
    fallbackFilename?: string,
    options?: RequestInit,
  ) =>
    fetchFile(
      endpoint,
      { ...options, method: "POST", body: JSON.stringify(data) },
      fallbackFilename,
    ),
};
