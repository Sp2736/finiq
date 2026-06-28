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

interface ThemeContextValue {
  // The currently active theme's variables (applied to the whole site)
  variables: Record<string, string>;
  themeName: string;
  activeThemeId: string | null;
  savedThemes: SavedTheme[];
  isLoading: boolean;

  // applyPreview / revertPreview are intentionally NO-OPS for global DOM.
  // They exist so ThemePanel can call them without errors, but they do nothing
  // to the global site. The ThemePreviewPane receives localVars directly via props
  // and scopes them with inline style — no global mutation needed.
  applyPreview: (vars: Record<string, string>) => void;
  revertPreview: () => void;

  // These are the ONLY functions that change the global site appearance:
  activateTheme: (savedThemeId: string) => Promise<void>;
  activateDefault: () => Promise<void>;

  saveTheme: (name: string, variables: Record<string, string>) => Promise<SavedTheme>;
  updateSavedTheme: (id: string, name: string, variables: Record<string, string>) => Promise<SavedTheme>;
  deleteSavedTheme: (id: string) => Promise<void>;
  refreshTheme: () => Promise<void>;
  refreshSavedThemes: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [themeName, setThemeName] = useState("System Default");
  const [activeThemeId, setActiveThemeId] = useState<string | null>(null);
  const [savedThemes, setSavedThemes] = useState<SavedTheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // snapshotRef is kept for potential future use but not used for global DOM mutation.
  const snapshotRef = useRef<Record<string, string>>({});

  const applyVarsToDOM = useCallback((vars: Record<string, string>) => {
    if (typeof window === "undefined") return;
    if (Object.keys(vars).length === 0) {
      // System default: remove all inline overrides so :root CSS defaults apply
      document.documentElement.style.cssText = "";
      // Also remove individual properties in case cssText didn't fully clear
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

  const fetchActiveTheme = useCallback(async () => {
    try {
      const res = await apiClient.get<any>("themes/active");
      const data = res.data || res;
      
      const vars = data?.theme_variables || {};
      const name = data?.theme_name || "System Default";
      const id = data?.active_theme_id || null;
      
      setVariables(vars);
      setThemeName(name);
      setActiveThemeId(id);
      applyVarsToDOM(vars);
      // Cache for FOUC prevention on next page load
      try {
        if (Object.keys(vars).length > 0) {
          localStorage.setItem("finiq_theme_vars", JSON.stringify(vars));
        } else {
          localStorage.removeItem("finiq_theme_vars");
        }
      } catch (_) {}
    } catch (error) {
      console.error("Failed to fetch active theme:", error);
    }
  }, [applyVarsToDOM]);

  const fetchSavedThemes = useCallback(async () => {
    try {
      const res = await apiClient.get<any>("themes/saved");
      const data = res.data || res;
      
      setSavedThemes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch saved themes:", error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchActiveTheme(), fetchSavedThemes()]);
      setIsLoading(false);
    };
    init();
  }, [fetchActiveTheme, fetchSavedThemes]);

  // ─── applyPreview and revertPreview are INTENTIONAL NO-OPS ───────────────
  // The preview pane is isolated via inline style scoping on its container.
  // Global DOM changes happen only through activateTheme / activateDefault below.
  const applyPreview = useCallback((_vars: Record<string, string>) => {
    // No-op: ThemePreviewPane receives localVars directly as a prop.
    // The variables are scoped to the preview container via inline style.
  }, []);

  const revertPreview = useCallback(() => {
    // No-op: nothing to revert because we never applied anything globally.
    // When the user cancels editing, the active theme (set via activateTheme)
    // is already visible on the live site unchanged.
  }, []);

  // ─── These are the only functions that mutate the global site ────────────

  const activateTheme = useCallback(async (savedThemeId: string) => {
    await apiClient.put(`themes/activate/${savedThemeId}`, {});
    snapshotRef.current = {};
    await fetchActiveTheme(); // Re-fetches and applies to DOM globally
  }, [fetchActiveTheme]);

  const activateDefault = useCallback(async () => {
    await apiClient.put("themes/activate-default", {});
    snapshotRef.current = {};
    try { localStorage.removeItem("finiq_theme_vars"); } catch (_) {}
    await fetchActiveTheme(); // Re-fetches and clears DOM vars globally
  }, [fetchActiveTheme]);

  // ─── These mutate the DB but do NOT change the live site appearance ───────

  const saveTheme = useCallback(async (
    name: string,
    newVars: Record<string, string>,
  ): Promise<SavedTheme> => {
    const res = await apiClient.post<any>("themes/saved", {
      name,
      variables: newVars,
    });
    await fetchSavedThemes(); // Refresh the list
    return res.data || res;
  }, [fetchSavedThemes]);

  const updateSavedTheme = useCallback(async (
    id: string,
    name: string,
    newVars: Record<string, string>,
  ): Promise<SavedTheme> => {
    const res = await apiClient.put<any>(`themes/saved/${id}`, {
      name,
      variables: newVars,
    });
    await fetchSavedThemes();
    // If this is the currently active theme, also refresh the active theme
    // to update the global site appearance with the new variables.
    if (activeThemeId === id) {
      await activateTheme(id); // Re-push to DB and re-apply globally
    }
    return res.data || res;
  }, [fetchSavedThemes, activateTheme, activeThemeId]);

  const deleteSavedTheme = useCallback(async (id: string) => {
    await apiClient.delete(`themes/saved/${id}`);
    await fetchSavedThemes();
    // If we deleted the active theme, the backend already reset to System Default.
    // Re-fetch active theme to pick up the cleared state.
    if (activeThemeId === id) {
      await fetchActiveTheme();
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
