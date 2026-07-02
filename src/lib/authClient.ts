// src/lib/authClient.ts

export type PortalType = "investor" | "staff";

const getCookieNames = (type: PortalType) => ({
  access: `${type}-auth-token`,
  refresh: `${type}-refresh-token`,
  userId: `${type}-user-id`,
});

export const setAuthCookies = (
  accessToken: string,
  refreshToken?: string,
  portal: PortalType = "staff",
  userId?: string,
) => {
  const { access, refresh, userId: userIdCookie } = getCookieNames(portal);

  // Extend cookie life to 30 days
  const expires = new Date();
  expires.setTime(expires.getTime() + 30 * 24 * 60 * 60 * 1000);
  const maxAge = 2592000; // 30 days in seconds

  document.cookie = `${access}=${accessToken}; path=/; expires=${expires.toUTCString()}; max-age=${maxAge}; SameSite=Lax`;

  if (refreshToken) {
    document.cookie = `${refresh}=${refreshToken}; path=/; expires=${expires.toUTCString()}; max-age=${maxAge}; SameSite=Lax`;
  }

  // Store user ID for refresh logic
  if (userId) {
    document.cookie = `${userIdCookie}=${userId}; path=/; expires=${expires.toUTCString()}; max-age=${maxAge}; SameSite=Lax`;
  }
};

export const removeAuthCookies = (portal: PortalType = "staff") => {
  const { access, refresh, userId: userIdCookie } = getCookieNames(portal);
  document.cookie = `${access}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  document.cookie = `${refresh}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  document.cookie = `${userIdCookie}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
};

// ─── JWT DECODING ─────────────────────────────────────────────────────────
export interface DecodedStaffToken {
  sub: string;
  phone_number: string;
  roles: Array<{
    id: string;
    role: string;
    tenant_id: string | null;
    company_id: string | null;
    company_name: string | null;
    first_name: string | null;
    last_name: string | null;
    sub_broker_id?: string | null;
  }>;
  company_id: string | null;
  iat: number;
  exp: number;
}

export interface DecodedInvestorToken {
  investor_id: string;
  mobile: string;
  username?: string | null;
  email?: string | null;
  company_id: string | null;
  name?: string | null;
  iat: number;
  exp: number;
}

/**
 * Decodes a JWT payload WITHOUT verifying the signature.
 * Safe for client-side use because the token always originates from our own
 * backend (signature is verified server-side on every protected request).
 */
export function decodeJwt<T = Record<string, unknown>>(
  token: string,
): T | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join(""),
    );
    return JSON.parse(jsonPayload) as T;
  } catch (err) {
    console.error("Failed to decode JWT:", err);
    return null;
  }
}
