"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { apiClient } from "@/lib/apiClient";

export interface SavedTheme {
  id: string;
  name: string;
  variables: Record<string, string>;
  is_default?: boolean;
  created_at: string;
}

interface CachedActiveTheme {
  theme_name: string;
  theme_variables: Record<string, string>;
  active_theme_id: string | null;
  cached_at: string;
}

const ACTIVE_THEME_CACHE_KEY = "finiq_active_theme";

interface ThemeContextValue {
  variables: Record<string, string>;
  themeName: string;
  activeThemeId: string | null;
  savedThemes: SavedTheme[];
  isLoading: boolean;
  isSavedThemesLoading: boolean;

  applyPreview: (vars: Record<string, string>) => void;
  revertPreview: () => void;

  activateTheme: (savedThemeId: string) => Promise<void>;
  activateDefault: () => Promise<void>;

  saveTheme: (name: string, variables: Record<string, string>) => Promise<SavedTheme>;
  updateSavedTheme: (id: string, name: string, variables: Record<string, string>) => Promise<SavedTheme>;
  deleteSavedTheme: (id: string) => Promise<void>;

  // Kept for callers that explicitly need to force a fresh read from the server
  // (should be rare — only used as a fallback / manual "sync" action).
  refreshTheme: () => Promise<void>;

  // Must be called explicitly by the Appearance settings page. Never called
  // automatically by ThemeProvider.
  refreshSavedThemes: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function readActiveThemeCache(): CachedActiveTheme | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACTIVE_THEME_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedActiveTheme;
    if (
      parsed.theme_name === "FinIQ Modern Slate" ||
      parsed.active_theme_id === "th-slate-01" ||
      parsed.theme_variables?.["--fin-page-bg"] === "#0f172a"
    ) {
      localStorage.removeItem(ACTIVE_THEME_CACHE_KEY);
      return null;
    }
    return parsed;
  } catch (_) {
    return null;
  }
}

function writeActiveThemeCache(data: {
  theme_name: string;
  theme_variables: Record<string, string>;
  active_theme_id: string | null;
}) {
  if (typeof window === "undefined") return;
  try {
    const payload: CachedActiveTheme = {
      ...data,
      cached_at: new Date().toISOString(),
    };
    localStorage.setItem(ACTIVE_THEME_CACHE_KEY, JSON.stringify(payload));
  } catch (_) {}
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [themeName, setThemeName] = useState("System Default");
  const [activeThemeId, setActiveThemeId] = useState<string | null>(null);
  const [savedThemes, setSavedThemes] = useState<SavedTheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavedThemesLoading, setIsSavedThemesLoading] = useState(false);

  const snapshotRef = useRef<Record<string, string>>({});

  const applyVarsToDOM = useCallback((vars: Record<string, string>) => {
    if (typeof window === "undefined") return;
    if (Object.keys(vars).length === 0) {
      document.documentElement.style.cssText = "";
      const root = document.documentElement;
      Array.from(root.style).forEach((prop) => {
        if (prop.startsWith("--fin-")) root.style.removeProperty(prop);
      });
      return;
    }
    Object.entries(vars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, []);

  // Applies a theme payload to state + DOM + cache, in one place.
  const applyAndCache = useCallback((data: {
    theme_name: string;
    theme_variables: Record<string, string>;
    active_theme_id: string | null;
  }) => {
    const vars = data.theme_variables || {};
    setVariables(vars);
    setThemeName(data.theme_name || "System Default");
    setActiveThemeId(data.active_theme_id ?? null);
    applyVarsToDOM(vars);
    writeActiveThemeCache({
      theme_name: data.theme_name || "System Default",
      theme_variables: vars,
      active_theme_id: data.active_theme_id ?? null,
    });
  }, [applyVarsToDOM]);

  // Network fallback — only used when localStorage cache is missing/corrupt,
  // or when explicitly forced via refreshTheme() / after activation calls.
  const fetchActiveTheme = useCallback(async () => {
    try {
      const res = await apiClient.get<any>("themes/active");
      const data = res.data || res;
      applyAndCache({
        theme_name: data?.theme_name,
        theme_variables: data?.theme_variables || {},
        active_theme_id: data?.active_theme_id ?? null,
      });
    } catch (error) {
      console.error("Failed to fetch active theme:", error);
    }
  }, [applyAndCache]);

  // Only called explicitly by the Appearance settings page.
  const fetchSavedThemes = useCallback(async () => {
    setIsSavedThemesLoading(true);
    try {
      const res = await apiClient.get<any>("themes/saved");
      const data = res.data || res;
      setSavedThemes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch saved themes:", error);
    } finally {
      setIsSavedThemesLoading(false);
    }
  }, []);

  // ─── Mount: read from cache first, only hit the network if cache is empty ──
  useEffect(() => {
    const init = async () => {
      const cached = readActiveThemeCache();
      if (cached) {
        setVariables(cached.theme_variables || {});
        setThemeName(cached.theme_name || "System Default");
        setActiveThemeId(cached.active_theme_id ?? null);
        applyVarsToDOM(cached.theme_variables || {});
        setIsLoading(false);
        return;
      }
      // No cache found (e.g. localStorage cleared, or login page didn't prime
      // it for some reason) — fall back to a single network call so the site
      // isn't stuck unthemed.
      await fetchActiveTheme();
      setIsLoading(false);
    };
    init();
    // NOTE: fetchSavedThemes is intentionally NOT called here.
  }, [fetchActiveTheme, applyVarsToDOM]);

  const applyPreview = useCallback((_vars: Record<string, string>) => {}, []);
  const revertPreview = useCallback(() => {}, []);

  const activateTheme = useCallback(async (savedThemeId: string) => {
    await apiClient.put(`themes/activate/${savedThemeId}`, {});
    snapshotRef.current = {};
    await fetchActiveTheme(); // Re-fetches, applies to DOM, AND re-caches to localStorage
  }, [fetchActiveTheme]);

  const activateDefault = useCallback(async () => {
    await apiClient.put("themes/activate-default", {});
    snapshotRef.current = {};
    await fetchActiveTheme(); // Re-fetches (empty vars) and re-caches
  }, [fetchActiveTheme]);

  const saveTheme = useCallback(async (
    name: string,
    newVars: Record<string, string>,
  ): Promise<SavedTheme> => {
    const res = await apiClient.post<any>("themes/saved", { name, variables: newVars });
    await fetchSavedThemes();
    return res.data || res;
  }, [fetchSavedThemes]);

  const updateSavedTheme = useCallback(async (
    id: string,
    name: string,
    newVars: Record<string, string>,
  ): Promise<SavedTheme> => {
    const res = await apiClient.put<any>(`themes/saved/${id}`, { name, variables: newVars });
    await fetchSavedThemes();
    if (activeThemeId === id) {
      await activateTheme(id); // re-activates + re-caches active theme
    }
    return res.data || res;
  }, [fetchSavedThemes, activateTheme, activeThemeId]);

  const deleteSavedTheme = useCallback(async (id: string) => {
    await apiClient.delete(`themes/saved/${id}`);
    await fetchSavedThemes();
    if (activeThemeId === id) {
      await fetchActiveTheme(); // backend reset to default; re-sync cache
    }
  }, [fetchSavedThemes, fetchActiveTheme, activeThemeId]);

  return (
    <ThemeContext.Provider
      value={{
        variables,
        themeName,
        activeThemeId,
        savedThemes,
        isLoading,
        isSavedThemesLoading,
        applyPreview,
        revertPreview,
        activateTheme,
        activateDefault,
        saveTheme,
        updateSavedTheme,
        deleteSavedTheme,
        refreshTheme: fetchActiveTheme,
        refreshSavedThemes: fetchSavedThemes,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
