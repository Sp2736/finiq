"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTheme, SavedTheme } from "@/context/ThemeContext";
import ColorPickerGroup from "./ColorPickerGroup";
import ThemePreviewPane from "./ThemePreviewPane";
import ThemePickerList from "./ThemePickerList";
import { Save, RotateCcw, CheckCircle2, XCircle, Loader2, Pencil, Trash2, Zap, Monitor } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { deriveColorScale } from "@/lib/colorUtils";

// ─── Toast Notification ─────────────────────────────────────────────────────
type ToastType = "success" | "error";
interface Toast {
  id: number;
  type: ToastType;
  message: string;
}
let toastCounter = 0;

// ─── Default CSS variable values ─────────────────────────────────────────────
const DEFAULT_VARS: Record<string, string> = {
  // Full brand scale — must be complete so preview pane is fully isolated
  "--fin-brand-50":  "#f0f4fa",
  "--fin-brand-100": "#e3ecf7",
  "--fin-brand-200": "#cddcf0",
  "--fin-brand-300": "#abc5e6",
  "--fin-brand-400": "#83a8d9",
  "--fin-brand-500": "#658ccb",
  "--fin-brand-600": "#3d60ab",
  "--fin-brand-700": "#334e8f",
  "--fin-brand-800": "#2b4177",
  "--fin-brand-900": "#263760",
  "--fin-brand-950": "#18223e",
  // Page & surfaces
  "--fin-page-bg": "#f8fafc",
  "--fin-page-bg-subtle": "#f1f5f9",
  "--fin-content-surface": "#ffffff",
  "--fin-sidebar-bg": "#ffffff",
  // Typography
  "--fin-heading-primary": "#0f172a",
  "--fin-heading-secondary": "#1e293b",
  "--fin-heading-tertiary": "#334155",
  "--fin-body-text": "#475569",
  "--fin-muted-text": "#64748b",
  "--fin-aux-text": "#94a3b8",
  "--fin-overline-text": "#94a3b8",
  "--fin-link-text": "#3d60ab",
  // Borders
  "--fin-border": "#e2e8f0",
  "--fin-border-subtle": "#f1f5f9",
  // Buttons
  "--fin-btn-primary-bg": "#3d60ab",
  "--fin-btn-primary-bg-hover": "#263760",
  "--fin-btn-primary-text": "#ffffff",
  "--fin-btn-secondary-bg": "#ffffff",
  "--fin-btn-secondary-bg-hover": "#f8fafc",
  "--fin-btn-secondary-text": "#334155",
  "--fin-btn-secondary-border": "#e2e8f0",
  // KPI Cards
  "--fin-kpi-bg": "#ffffff",
  "--fin-kpi-border": "#e2e8f0",
  "--fin-kpi-label": "#64748b",
  "--fin-kpi-value-revealed": "#0f172a",
  "--fin-kpi-icon-color": "#64748b",
  "--fin-kpi-accent-bar": "#658ccb",
  // Sidebar
  "--fin-sidebar-item-active-bg": "#3d60ab",
  "--fin-sidebar-item-hover-bg": "#f0f4fa",
  "--fin-sidebar-brand-label": "#3d60ab",
  // Ribbon
  "--fin-ribbon-bg": "#ffffff",
  "--fin-ribbon-border": "rgba(226,232,240,0.60)",
  "--fin-ribbon-label": "#94a3b8",
  "--fin-ribbon-value": "#0f172a",
  "--fin-ribbon-highlight-value": "#3d60ab",
  // Modals
  "--fin-modal-bg": "#ffffff",
  "--fin-modal-border": "#e2e8f0",
  "--fin-modal-tab-active-border": "#3d60ab",
  // Filters & Pagination
  "--fin-filter-option-active-bg": "#3d60ab",
  "--fin-filter-option-active-text": "#ffffff",
  "--fin-page-btn-active-bg": "#3d60ab",
  // Tables
  "--fin-table-header-bg": "#f8fafc",
  "--fin-table-header-text": "#64748b",
  "--fin-table-row-hover-bg": "rgba(248,250,252,0.60)",
  "--fin-table-row-text": "#334155",
  "--fin-table-row-border": "#f1f5f9",
  // Charts
  "--fin-chart-color-1": "#3d60ab",
  "--fin-chart-color-2": "#658ccb",
  "--fin-chart-color-3": "#83a8d9",
  "--fin-chart-color-4": "#10b981",
  "--fin-chart-color-5": "#f59e0b",
  "--fin-chart-color-6": "#ef4444",
  // Status
  "--fin-kpi-positive-text": "#16a34a",
  "--fin-kpi-negative-text": "#dc2626",
  "--fin-analysis-positive-bg": "#f0fdf4",
  "--fin-analysis-negative-bg": "#fef2f2",
};

// ─── Editing Mode ────────────────────────────────────────────────────────────
type EditorMode =
  | { type: "idle" } // Nothing selected
  | { type: "new" } // Creating a new theme from scratch
  | { type: "edit"; theme: SavedTheme }; // Editing an existing saved theme

export default function ThemePanel() {
  const {
    variables,
    activeThemeId,
    savedThemes,
    applyPreview,
    revertPreview,
    activateDefault,
    activateTheme,
    saveTheme,
    updateSavedTheme,
    deleteSavedTheme,
  } = useTheme();

  const [localVars, setLocalVars] = useState<Record<string, string>>({ ...DEFAULT_VARS, ...variables });
  const [editorMode, setEditorMode] = useState<EditorMode>({ type: "idle" });
  const [themeName, setThemeName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const themeNameRef = useRef<HTMLInputElement>(null);
  
  // For header-level actions
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync local vars when context variables change (e.g. on activate)
  useEffect(() => {
    const merged = { ...DEFAULT_VARS, ...variables };
    setLocalVars(merged);
    setHasUnsavedChanges(false);
  }, [variables]);

  // When editing an existing theme, load its vars into the editor
  useEffect(() => {
    if (editorMode.type === "edit") {
      const merged = { ...DEFAULT_VARS, ...editorMode.theme.variables };
      setLocalVars(merged);
      setThemeName(editorMode.theme.name || "");
      setHasUnsavedChanges(false);
    } else if (editorMode.type === "new") {
      // Start a new theme from the current active vars as a base
      const merged = { ...DEFAULT_VARS, ...variables };
      setLocalVars(merged);
      setThemeName("");
      setHasUnsavedChanges(false);
      setTimeout(() => themeNameRef.current?.focus(), 100);
    } else {
      // idle: reset editor to active theme
      setLocalVars({ ...DEFAULT_VARS, ...variables });
      setThemeName("");
      setHasUnsavedChanges(false);
    }
    setConfirmDelete(false);
  }, [editorMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = ++toastCounter;
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const handleColorChange = useCallback((key: string, val: string) => {
    setLocalVars((prev) => {
      let updated = { ...prev, [key]: val };

      // Auto-derive the full brand scale when the 600 (accent) changes
      if (key === "--fin-brand-600") {
        const scale = deriveColorScale(val);
        updated = { ...updated, ...scale };
        // Sync all tokens that should always match the brand accent
        updated["--fin-sidebar-item-active-bg"] = val;
        updated["--fin-sidebar-brand-label"] = val;
        updated["--fin-btn-primary-bg"] = val;
        updated["--fin-btn-primary-bg-hover"] = scale["--fin-brand-700"] ?? val;
        updated["--fin-link-text"] = val;
        updated["--fin-heading-secondary"] = val;
        updated["--fin-kpi-value-revealed"] = val;
        updated["--fin-kpi-accent-bar"] = scale["--fin-brand-500"] ?? val;
        updated["--fin-filter-option-active-bg"] = val;
        updated["--fin-page-btn-active-bg"] = val;
        updated["--fin-chart-color-1"] = val;
        updated["--fin-modal-tab-active-border"] = val;
      }
      // No applyPreview here — localVars flows to ThemePreviewPane via props
      return updated;
    });
    setHasUnsavedChanges(true);
  }, []); // No dependencies needed — no external calls

  const handleSave = async () => {
    if (!(themeName || "").trim()) {
      themeNameRef.current?.focus();
      addToast("error", "Please enter a name for this theme.");
      return;
    }
    setIsSubmitting(true);
    try {
      if (editorMode.type === "edit") {
        // Update the saved theme in the DB
        const updated = await updateSavedTheme(
          editorMode.theme.id,
          themeName.trim(),
          localVars,
        );
        // updateSavedTheme in context already re-activates if it's the active theme
        if (activeThemeId === editorMode.theme.id) {
          addToast("success", `"${themeName.trim()}" updated and live across your company.`);
        } else {
          addToast("success", `"${themeName.trim()}" saved. Use "Set Active" to apply it.`);
        }
        setEditorMode({
          type: "edit",
          theme: { ...editorMode.theme, name: themeName.trim(), variables: localVars },
        });
      } else {
        // Save as a new theme — does NOT auto-activate
        const saved = await saveTheme(themeName.trim(), localVars);
        addToast(
          "success",
          `"${saved.name}" saved. Click "Set Active" to apply it company-wide.`,
        );
        setEditorMode({ type: "edit", theme: saved });
      }
      setHasUnsavedChanges(false);
    } catch (err: any) {
      addToast("error", err?.message || "Failed to save theme. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    // Reset the editor inputs to the canonical system defaults.
    // This does NOT change what theme is active, does NOT touch the DB,
    // and does NOT affect any other user or session.
    setLocalVars({ ...DEFAULT_VARS });
    if (isEditing) {
      applyPreview({ ...DEFAULT_VARS });
    } else {
      setEditorMode({ type: "new" });
    }
    setHasUnsavedChanges(true); // Mark as changed so user knows to save if they want
    addToast("success", "Color inputs reset to system defaults. Save to apply.");
  };

  const handleCancelEdit = () => {
    revertPreview();
    setEditorMode({ type: "idle" });
  };
  
  const handleActivateCurrent = async () => {
    if (editorMode.type !== "edit") return;
    if (hasUnsavedChanges) {
      addToast("error", "Please save your changes before applying the theme.");
      return;
    }
    setIsActivating(true);
    try {
      await activateTheme(editorMode.theme.id);
      addToast("success", `"${themeName}" is now the active theme.`);
    } catch (err: any) {
      addToast("error", "Failed to activate theme.");
    } finally {
      setIsActivating(false);
    }
  };

  const handleDeleteCurrent = async () => {
    if (editorMode.type !== "edit") return;
    setIsDeleting(true);
    try {
      await deleteSavedTheme(editorMode.theme.id);
      addToast("success", `Theme "${themeName}" deleted successfully.`);
      setEditorMode({ type: "idle" });
    } catch (err: any) {
      addToast("error", "Failed to delete theme.");
    } finally {
      setIsDeleting(false);
    }
  };

  const isEditing = editorMode.type !== "idle";
  const currentIsActive = editorMode.type === "edit" && activeThemeId === editorMode.theme.id;

  const varGroupLabel = (key: string) => localVars[key] || DEFAULT_VARS[key] || "#000000";

  return (
    <div className="h-full">
      {/* Mobile restriction message */}
      <div className="lg:hidden flex flex-col items-center justify-center h-[60vh] text-center p-6">
        <Monitor size={48} className="text-[var(--fin-aux-text)] mb-4" />
        <h2 className="text-xl font-black text-[var(--fin-table-row-text)] mb-2">Desktop Only</h2>
        <p className="text-sm text-[var(--fin-muted-text)] font-medium max-w-sm">
          The advanced theme customizer is only available on desktop and large tablet screens. Please switch to a larger device to edit your platform's appearance.
        </p>
      </div>

      <div className="hidden lg:flex flex-col gap-0 h-full">

      {/* ─── Toast Stack ──────────────────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-[999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl backdrop-blur-md border text-sm font-semibold ${
                toast.type === "success"
                  ? "bg-[var(--fin-badge-success-bg)] border-[var(--fin-badge-success-border)] text-[var(--fin-badge-success-text)]"
                  : "bg-[var(--fin-badge-danger-bg)] border-[var(--fin-badge-danger-border)] text-[var(--fin-badge-danger-text)]"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 size={18} className="text-[var(--fin-badge-success-text)] shrink-0" />
              ) : (
                <XCircle size={18} className="text-[var(--fin-badge-danger-text)] shrink-0" />
              )}
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ─── Horizontal Theme Picker ──────────────────────────────────────── */}
      <ThemePickerList
        editorMode={editorMode}
        onStartNew={() => setEditorMode({ type: "new" })}
        onStartEdit={(theme) => setEditorMode({ type: "edit", theme })}
        onCancelEdit={handleCancelEdit}
        hasUnsavedChanges={hasUnsavedChanges}
        addToast={addToast}
      />

      {/* ─── Main Editor + Preview ─────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0 mt-8">

        {/* Editor Column */}
        <div className="flex-1 overflow-y-auto pr-1 pb-10 min-w-0">

          {/* Header Bar */}
          <div className="flex flex-col gap-5 mb-6">
            <div className="min-w-0">
              {isEditing ? (
                <div>
                  <label className="block text-[10px] font-black text-[var(--fin-muted-text)] uppercase tracking-widest mb-1.5">
                    {editorMode.type === "edit" ? "Editing Theme" : "New Theme Name"}
                  </label>
                  <div className="flex items-center gap-3">
                    {editorMode.type === "edit" && <Pencil size={14} className="text-[var(--fin-aux-text)] shrink-0" />}
                    <input
                      ref={themeNameRef}
                      type="text"
                      placeholder="e.g. Corporate Blue, Saffron Brand…"
                      value={themeName}
                      onChange={(e) => { setThemeName(e.target.value); setHasUnsavedChanges(true); }}
                      className="w-full sm:max-w-md px-3.5 py-2.5 border border-[var(--fin-border)] rounded-xl text-sm font-semibold bg-[var(--fin-table-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--fin-input-ring-focus)] focus:border-transparent transition-all placeholder:text-[var(--fin-aux-text)]"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-black text-[var(--fin-heading-primary)]">Theme Customizer</h2>
                  <p className="text-sm text-[var(--fin-muted-text)] mt-1">
                    Select a theme to edit, or create a new one from scratch.
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {hasUnsavedChanges && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-[10px] font-bold text-[var(--fin-badge-warning-text)] bg-[var(--fin-badge-warning-bg)] border border-[var(--fin-badge-warning-border)] px-3 py-1.5 rounded-full uppercase tracking-wider"
                >
                  Unsaved changes
                </motion.span>
              )}

              {/* Reset is a utility button, kept subtle */}
              <button
                onClick={handleReset}
                disabled={isSubmitting}
                className="px-4 py-2.5 flex items-center gap-2 text-sm font-bold text-[var(--fin-body-text)] bg-[var(--fin-table-bg)] border border-[var(--fin-border)] rounded-xl hover:bg-[var(--fin-page-bg)] transition-colors shadow-sm disabled:opacity-50"
                title="Reset color pickers to system defaults (does not change active theme)"
              >
                <RotateCcw size={15} />
                <span>Reset Defaults</span>
              </button>

              {isEditing && (
                <div className="flex flex-wrap items-center gap-3 border-l-0 sm:border-l sm:border-[var(--fin-border)] pl-0 sm:pl-3 w-full sm:w-auto mt-2 sm:mt-0">
                  {/* Cancel */}
                  <button
                    onClick={handleCancelEdit}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 text-sm font-bold text-[var(--fin-muted-text)] bg-[var(--fin-skeleton-base)] border border-[var(--fin-border)] rounded-xl hover:bg-[var(--fin-skeleton-base)] transition-colors disabled:opacity-50"
                  >
                    {hasUnsavedChanges ? "Discard" : "Cancel"}
                  </button>
                  
                  {/* Delete Theme */}
                  {editorMode.type === "edit" && (
                    confirmDelete ? (
                      <div className="flex gap-1 animate-in fade-in slide-in-from-right-4 duration-200">
                        <button
                          onClick={handleDeleteCurrent}
                          disabled={isDeleting}
                          className="px-4 py-2.5 text-sm font-bold text-[var(--fin-btn-primary-text)] bg-[var(--fin-badge-danger-text)] border border-[var(--fin-badge-danger-text)] rounded-xl hover:bg-[var(--fin-badge-danger-text)] transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                        >
                          {isDeleting ? <Loader2 size={15} className="animate-spin" /> : "Confirm Delete"}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(false)}
                          disabled={isDeleting}
                          className="px-4 py-2.5 text-sm font-bold text-[var(--fin-body-text)] bg-[var(--fin-table-bg)] border border-[var(--fin-border)] rounded-xl hover:bg-[var(--fin-page-bg)] transition-colors shadow-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(true)}
                        disabled={isSubmitting || isActivating}
                        className="px-4 py-2.5 flex items-center gap-2 text-sm font-bold text-[var(--fin-badge-danger-text)] bg-[var(--fin-table-bg)] border border-[var(--fin-badge-danger-border)] rounded-xl hover:bg-[var(--fin-badge-danger-bg)] transition-colors shadow-sm disabled:opacity-50"
                        title="Delete Theme"
                      >
                        <Trash2 size={15} />
                        <span className="hidden xl:inline">Delete</span>
                      </button>
                    )
                  )}

                  {/* Set Active button — shown when in edit mode */}
                  {editorMode.type === "edit" && (
                    <button
                      onClick={handleActivateCurrent}
                      disabled={isSubmitting || isActivating || hasUnsavedChanges}
                      className={`px-4 py-2.5 flex items-center gap-2 text-sm font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                        currentIsActive
                          ? "text-[var(--fin-badge-success-text)] bg-[var(--fin-badge-success-bg)] border border-[var(--fin-badge-success-border)] hover:bg-[var(--fin-badge-success-bg)] cursor-default"
                          : "text-[var(--fin-badge-broker-text)] bg-[var(--fin-badge-broker-bg)] border border-[var(--fin-badge-broker-border)] hover:bg-[var(--fin-badge-broker-bg)]"
                      }`}
                      title={
                        currentIsActive
                          ? "This is the active theme"
                          : hasUnsavedChanges
                            ? "Save changes before activating"
                            : "Apply as the active theme for your entire company"
                      }
                    >
                      {isActivating ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : currentIsActive ? (
                        <CheckCircle2 size={15} />
                      ) : (
                        <Zap size={15} />
                      )}
                      <span className="hidden xl:inline">
                        {currentIsActive ? "Active" : "Set Active"}
                      </span>
                    </button>
                  )}

                  {/* Save Theme */}
                  <button
                    onClick={handleSave}
                    disabled={isSubmitting || !(themeName || "").trim()}
                    className="px-6 py-2.5 flex items-center gap-2 text-sm font-bold text-[var(--fin-btn-primary-text)] bg-[var(--fin-badge-broker-text)] border border-[var(--fin-badge-broker-border)] rounded-xl hover:bg-[var(--fin-badge-broker-bg)] transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Save size={15} />
                    )}
                    <span>
                      {editorMode.type === "edit" ? "Save Changes" : "Save Theme"}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Color Groups — always visible so user can explore */}
          <AnimatePresence>
            {!isEditing && (
              <motion.div
                key="idle-hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mb-6 p-4 bg-[var(--fin-badge-broker-bg)] border border-[var(--fin-badge-broker-border)] rounded-2xl text-sm text-[var(--fin-badge-broker-text)] font-medium flex items-center gap-3"
              >
                <Pencil size={16} className="shrink-0 text-[var(--fin-badge-broker-text)]" />
                Click on any theme card above to edit it, or create a new one. Color changes below will apply only when a theme is selected.
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div layout className="grid gap-6">
            <ColorPickerGroup
              label="Brand Core"
              description="Primary palette used in buttons, links, highlights, and navigation."
              variables={[
                { key: "--fin-brand-500", label: "Brand Primary", value: varGroupLabel("--fin-brand-500") },
                { key: "--fin-brand-600", label: "Brand Accent", value: varGroupLabel("--fin-brand-600") },
                { key: "--fin-brand-900", label: "Brand Deep", value: varGroupLabel("--fin-brand-900") },
              ]}
              onChange={isEditing ? handleColorChange : () => {}}
              disabled={!isEditing}
            />

            <ColorPickerGroup
              label="Surface & Backgrounds"
              description="Page bases and component surfaces."
              variables={[
                { key: "--fin-page-bg", label: "Primary Background", value: varGroupLabel("--fin-page-bg") },
                { key: "--fin-page-bg-subtle", label: "Secondary Background", value: varGroupLabel("--fin-page-bg-subtle") },
                { key: "--fin-content-surface", label: "Card Surface", value: varGroupLabel("--fin-content-surface") },
                { key: "--fin-sidebar-bg", label: "Sidebar", value: varGroupLabel("--fin-sidebar-bg") },
              ]}
              onChange={isEditing ? handleColorChange : () => {}}
              disabled={!isEditing}
            />

            <ColorPickerGroup
              label="Typography"
              description="Text hierarchy across headings, body, and subtle labels."
              variables={[
                { key: "--fin-heading-primary", label: "H1 Headings", value: varGroupLabel("--fin-heading-primary") },
                { key: "--fin-heading-secondary", label: "H2 Headings", value: varGroupLabel("--fin-heading-secondary") },
                { key: "--fin-heading-tertiary", label: "H3 Headings", value: varGroupLabel("--fin-heading-tertiary") },
                { key: "--fin-body-text", label: "Body Text", value: varGroupLabel("--fin-body-text") },
                { key: "--fin-muted-text", label: "Muted / Labels", value: varGroupLabel("--fin-muted-text") },
              ]}
              onChange={isEditing ? handleColorChange : () => {}}
              disabled={!isEditing}
            />

            <ColorPickerGroup
              label="Borders & Dividers"
              variables={[
                { key: "--fin-border", label: "Standard Border", value: varGroupLabel("--fin-border") },
                { key: "--fin-border-subtle", label: "Subtle Border", value: varGroupLabel("--fin-border-subtle") },
              ]}
              onChange={isEditing ? handleColorChange : () => {}}
              disabled={!isEditing}
            />

            <ColorPickerGroup
              label="Buttons"
              description="Primary and Secondary button styles."
              variables={[
                { key: "--fin-btn-primary-bg", label: "Primary Bg", value: varGroupLabel("--fin-btn-primary-bg") },
                { key: "--fin-btn-primary-bg-hover", label: "Primary Hover", value: varGroupLabel("--fin-btn-primary-bg-hover") },
                { key: "--fin-btn-primary-text", label: "Primary Text", value: varGroupLabel("--fin-btn-primary-text") },
                { key: "--fin-btn-secondary-bg", label: "Secondary Bg", value: varGroupLabel("--fin-btn-secondary-bg") },
                { key: "--fin-btn-secondary-bg-hover", label: "Secondary Hover", value: varGroupLabel("--fin-btn-secondary-bg-hover") },
                { key: "--fin-btn-secondary-text", label: "Secondary Text", value: varGroupLabel("--fin-btn-secondary-text") },
                { key: "--fin-btn-secondary-border", label: "Secondary Border", value: varGroupLabel("--fin-btn-secondary-border") },
              ]}
              onChange={isEditing ? handleColorChange : () => {}}
              disabled={!isEditing}
            />

            <ColorPickerGroup
              label="KPI Cards"
              description="Metric cards, stat widgets, and dashboard summaries."
              variables={[
                { key: "--fin-kpi-bg", label: "Card Bg", value: varGroupLabel("--fin-kpi-bg") },
                { key: "--fin-kpi-border", label: "Card Border", value: varGroupLabel("--fin-kpi-border") },
                { key: "--fin-kpi-label", label: "Label Text", value: varGroupLabel("--fin-kpi-label") },
                { key: "--fin-kpi-value-revealed", label: "Value Text", value: varGroupLabel("--fin-kpi-value-revealed") },
                { key: "--fin-kpi-icon-color", label: "Icon Color", value: varGroupLabel("--fin-kpi-icon-color") },
              ]}
              onChange={isEditing ? handleColorChange : () => {}}
              disabled={!isEditing}
            />

            <ColorPickerGroup
              label="Sidebar"
              description="Navigation panel colors for active, hover, and default states."
              variables={[
                { key: "--fin-sidebar-bg", label: "Sidebar Background", value: varGroupLabel("--fin-sidebar-bg") },
                { key: "--fin-sidebar-item-active-bg", label: "Active Item", value: varGroupLabel("--fin-sidebar-item-active-bg") },
                { key: "--fin-sidebar-item-hover-bg", label: "Hover Item", value: varGroupLabel("--fin-sidebar-item-hover-bg") },
                { key: "--fin-sidebar-brand-label", label: "Brand Label", value: varGroupLabel("--fin-sidebar-brand-label") },
              ]}
              onChange={isEditing ? handleColorChange : () => {}}
              disabled={!isEditing}
            />

            <ColorPickerGroup
              label="Tables"
              description="Table headers, row backgrounds, and hover states."
              variables={[
                { key: "--fin-table-header-bg", label: "Header Background", value: varGroupLabel("--fin-table-header-bg") },
                { key: "--fin-table-header-text", label: "Header Text", value: varGroupLabel("--fin-table-header-text") },
                { key: "--fin-table-row-hover-bg", label: "Row Hover", value: varGroupLabel("--fin-table-row-hover-bg") },
                { key: "--fin-table-row-text", label: "Row Text", value: varGroupLabel("--fin-table-row-text") },
              ]}
              onChange={isEditing ? handleColorChange : () => {}}
              disabled={!isEditing}
            />

            <ColorPickerGroup
              label="Charts"
              description="Data visualisation series colors."
              variables={[
                { key: "--fin-chart-color-1", label: "Series 1", value: varGroupLabel("--fin-chart-color-1") },
                { key: "--fin-chart-color-2", label: "Series 2", value: varGroupLabel("--fin-chart-color-2") },
                { key: "--fin-chart-color-3", label: "Series 3", value: varGroupLabel("--fin-chart-color-3") },
                { key: "--fin-chart-color-4", label: "Series 4 (Green)", value: varGroupLabel("--fin-chart-color-4") },
                { key: "--fin-chart-color-5", label: "Series 5 (Amber)", value: varGroupLabel("--fin-chart-color-5") },
                { key: "--fin-chart-color-6", label: "Series 6 (Red)", value: varGroupLabel("--fin-chart-color-6") },
              ]}
              onChange={isEditing ? handleColorChange : () => {}}
              disabled={!isEditing}
            />

            <ColorPickerGroup
              label="Status Indicators"
              description="Positive (gains), negative (losses), and neutral states."
              variables={[
                { key: "--fin-kpi-positive-text", label: "Positive / Gain", value: varGroupLabel("--fin-kpi-positive-text") },
                { key: "--fin-kpi-negative-text", label: "Negative / Loss", value: varGroupLabel("--fin-kpi-negative-text") },
                { key: "--fin-analysis-positive-bg", label: "Gain Card Bg", value: varGroupLabel("--fin-analysis-positive-bg") },
                { key: "--fin-analysis-negative-bg", label: "Loss Card Bg", value: varGroupLabel("--fin-analysis-negative-bg") },
              ]}
              onChange={isEditing ? handleColorChange : () => {}}
              disabled={!isEditing}
            />

          </motion.div>
        </div>

        {/* Live Preview Column */}
        <div className="hidden lg:block w-[420px] xl:w-[480px] shrink-0 sticky top-0 self-start">
          <div className="relative h-[calc(100vh-220px)] max-h-[820px]">
            <ThemePreviewPane previewVariables={localVars} />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}