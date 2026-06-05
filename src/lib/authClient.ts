// src/lib/authClient.ts

export type PortalType = 'investor' | 'staff';

const getCookieNames = (type: PortalType) => ({
  access: `${type}-auth-token`,
  refresh: `${type}-refresh-token`,
  userId: `${type}-user-id`,
});

export const setAuthCookies = (accessToken: string, refreshToken?: string, portal: PortalType = 'staff', userId?: string) => {
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

export const removeAuthCookies = (portal: PortalType = 'staff') => {
  const { access, refresh, userId: userIdCookie } = getCookieNames(portal);
  document.cookie = `${access}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  document.cookie = `${refresh}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  document.cookie = `${userIdCookie}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
};