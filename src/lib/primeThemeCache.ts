// src/lib/primeThemeCache.ts
import { apiClient } from "@/lib/apiClient";

const ACTIVE_THEME_CACHE_KEY = "finiq_active_theme";

/**
 * Call this exactly once, right after a successful login (any portal),
 * before redirecting into the themed layout. Fetches the active theme once
 * and caches it to localStorage so ThemeContext never needs to call
 * `themes/active` again until the next login.
 *
 * Safe to call even if it fails — ThemeContext falls back to a network
 * call on mount if the cache is missing.
 */
export async function primeThemeCache(): Promise<void> {
  try {
    const res = await apiClient.get<any>("themes/active");
    const data = res.data || res;
    const payload = {
      theme_name: data?.theme_name || "System Default",
      theme_variables: data?.theme_variables || {},
      active_theme_id: data?.active_theme_id ?? null,
      cached_at: new Date().toISOString(),
    };
    localStorage.setItem(ACTIVE_THEME_CACHE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error("Failed to prime theme cache after login:", err);
    // Non-fatal: ThemeContext will fetch it on first mount instead.
  }
}
