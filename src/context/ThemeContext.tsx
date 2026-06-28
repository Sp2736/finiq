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
  variables: Record<string, string>;
  themeName: string;
  activeThemeId: string | null; // ID of the currently active saved theme, or null for "System Default"
  savedThemes: SavedTheme[];
  isLoading: boolean;
  applyPreview: (vars: Record<string, string>) => void;
  revertPreview: () => void;
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

  const snapshotRef = useRef<Record<string, string>>({});

  const applyVarsToDOM = useCallback((vars: Record<string, string>) => {
    if (typeof window === "undefined") return;
    if (Object.keys(vars).length === 0) {
      document.documentElement.style.cssText = "";
      return;
    }
    Object.entries(vars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, []);

  const fetchActiveTheme = useCallback(async () => {
    try {
      const data = await apiClient.get<any>("themes/active");
      const vars = data.theme_variables || {};
      const name = data.theme_name || "System Default";
      const id = data.active_theme_id || null;
      setVariables(vars);
      setThemeName(name);
      setActiveThemeId(id);
      applyVarsToDOM(vars);
      // Cache for FOUC prevention
      try {
        localStorage.setItem("finiq_theme_vars", JSON.stringify(vars));
      } catch (_) {}
    } catch (error) {
      console.error("Failed to fetch active theme", error);
    }
  }, [applyVarsToDOM]);

  const fetchSavedThemes = useCallback(async () => {
    try {
      const data = await apiClient.get<SavedTheme[]>("themes/saved");
      setSavedThemes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch saved themes", error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchActiveTheme(), fetchSavedThemes()]);
      setIsLoading(false);
    };
    init();
  }, [fetchActiveTheme, fetchSavedThemes]);

  const applyPreview = useCallback((vars: Record<string, string>) => {
    // Save current active snapshot so we can revert
    snapshotRef.current = variables;
    applyVarsToDOM(vars);
  }, [variables, applyVarsToDOM]);

  const revertPreview = useCallback(() => {
    // Restore the last snapshot (which is the currently saved/active theme)
    if (Object.keys(snapshotRef.current).length > 0) {
      applyVarsToDOM(snapshotRef.current);
    } else {
      // No snapshot means system default was active — clear all inline vars
      document.documentElement.style.cssText = '';
    }
    snapshotRef.current = {};
  }, [applyVarsToDOM]);

  const saveTheme = useCallback(async (name: string, newVars: Record<string, string>): Promise<SavedTheme> => {
    const data = await apiClient.post<SavedTheme>("themes/saved", { name, variables: newVars });
    await fetchSavedThemes();
    return data;
  }, [fetchSavedThemes]);

  const updateSavedTheme = useCallback(async (id: string, name: string, newVars: Record<string, string>): Promise<SavedTheme> => {
    const data = await apiClient.put<SavedTheme>(`themes/saved/${id}`, { name, variables: newVars });
    await fetchSavedThemes();
    // If this was the active theme, refresh active too
    if (activeThemeId === id) {
      await fetchActiveTheme();
    }
    return data;
  }, [fetchSavedThemes, fetchActiveTheme, activeThemeId]);

  const activateTheme = useCallback(async (savedThemeId: string) => {
    await apiClient.put(`themes/activate/${savedThemeId}`, {});
    snapshotRef.current = {};
    await fetchActiveTheme();
  }, [fetchActiveTheme]);

  const activateDefault = useCallback(async () => {
    await apiClient.put("themes/activate-default", {});
    snapshotRef.current = {};
    // Clear the FOUC cache so next page load also shows system default
    try { localStorage.removeItem('finiq_theme_vars'); } catch (_) {}
    await fetchActiveTheme();
  }, [fetchActiveTheme]);

  const deleteSavedTheme = useCallback(async (id: string) => {
    await apiClient.delete(`themes/saved/${id}`);
    await fetchSavedThemes();
    // If we deleted the active theme, revert to default
    if (activeThemeId === id) {
      await activateDefault();
    }
  }, [fetchSavedThemes, activateDefault, activeThemeId]);

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
