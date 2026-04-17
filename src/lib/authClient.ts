// src/lib/authClient.ts

const COOKIE_NAME = 'auth-token';

export const setAuthCookie = (token: string) => {
  // Sets a 24-hour cookie accessible across the site
  document.cookie = `${COOKIE_NAME}=${token}; path=/; max-age=86400; SameSite=Strict`;
};

export const removeAuthCookie = () => {
  // Expires the cookie immediately to log the user out
  document.cookie = `${COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
};