// src/lib/authClient.ts

export type PortalType = 'investor' | 'staff';

const getCookieNames = (type: PortalType) => ({
  access: `${type}-auth-token`,
  refresh: `${type}-refresh-token`,
});

export const setAuthCookies = (accessToken: string, refreshToken?: string, portal: PortalType = 'staff') => {
  const { access, refresh } = getCookieNames(portal);
  
  // Access token: 1 hour (3600s)
  document.cookie = `${access}=${accessToken}; path=/; max-age=3600; SameSite=Strict`;
  
  // Refresh token: 7 days (604800s) - Only set if provided
  if (refreshToken) {
    document.cookie = `${refresh}=${refreshToken}; path=/; max-age=604800; SameSite=Strict`;
  }
};

export const removeAuthCookies = (portal: PortalType = 'staff') => {
  const { access, refresh } = getCookieNames(portal);
  document.cookie = `${access}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  document.cookie = `${refresh}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
};