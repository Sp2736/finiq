// src/lib/authClient.ts

export type PortalType = 'investor' | 'staff';

const getCookieNames = (type: PortalType) => ({
  access: `${type}-auth-token`,
  refresh: `${type}-refresh-token`,
});

export const setAuthCookies = (accessToken: string, refreshToken?: string, portal: PortalType = 'staff') => {
  const { access, refresh } = getCookieNames(portal);

  // Calculate explicit expiration dates for cross-browser persistence
  const accessExpires = new Date();
  accessExpires.setTime(accessExpires.getTime() + 100 * 60 * 60 * 1000); // 100 hours

  document.cookie = `${access}=${accessToken}; path=/; expires=${accessExpires.toUTCString()}; max-age=360000; SameSite=Lax`;

  // Refresh token: 7 days (604800s) - Only set if provided
  if (refreshToken) {
    const refreshExpires = new Date();
    refreshExpires.setTime(refreshExpires.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
    document.cookie = `${refresh}=${refreshToken}; path=/; expires=${refreshExpires.toUTCString()}; max-age=604800; SameSite=Lax`;
  }
};

export const removeAuthCookies = (portal: PortalType = 'staff') => {
  const { access, refresh } = getCookieNames(portal);
  document.cookie = `${access}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  document.cookie = `${refresh}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
};