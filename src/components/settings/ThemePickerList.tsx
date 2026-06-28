"use client";

import React, { useState } from "react";
import { useTheme, SavedTheme } from "@/context/ThemeContext";
import { Check, Trash2, Plus, Zap, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ToastType = "success" | "error";

interface ThemePickerListProps {
  editorMode: { type: "idle" } | { type: "new" } | { type: "edit"; theme: SavedTheme };
  onStartNew: () => void;
  onStartEdit: (theme: SavedTheme) => void;
  onCancelEdit: () => void;
  hasUnsavedChanges: boolean;
  addToast: (type: ToastType, message: string) => void;
}

export default function ThemePickerList({
  editorMode,
  onStartNew,
  onStartEdit,
  onCancelEdit,
  hasUnsavedChanges,
  addToast,
}: ThemePickerListProps) {
  const {
    savedThemes,
    activeThemeId,
    themeName,
    activateTheme,
    activateDefault,
    deleteSavedTheme,
  } = useTheme();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const isSystemDefaultActive = !activeThemeId;
  const editingThemeId = editorMode.type === "edit" ? editorMode.theme.id : null;

  const handleActivate = async (themeId: string) => {
    if (hasUnsavedChanges) {
      addToast("error", "You have unsaved changes. Save or cancel before switching themes.");
      return;
    }
    setActivatingId(themeId);
    try {
      await activateTheme(themeId);
      addToast("success", "Theme activated and applied platform-wide.");
      if (editorMode.type !== "idle") onCancelEdit();
    } catch {
      addToast("error", "Failed to activate theme.");
    } finally {
      setActivatingId(null);
    }
  };

  const handleActivateDefault = async () => {
    if (hasUnsavedChanges) {
      addToast("error", "You have unsaved changes. Save or cancel before switching themes.");
      return;
    }
    setActivatingId("default");
    try {
      await activateDefault();
      addToast("success", "System Default theme activated.");
      if (editorMode.type !== "idle") onCancelEdit();
    } catch {
      addToast("error", "Failed to activate System Default.");
    } finally {
      setActivatingId(null);
    }
  };

  const handleDelete = async (themeId: string) => {
    setConfirmDeleteId(null);
    setDeletingId(themeId);
    try {
      await deleteSavedTheme(themeId);
      addToast("success", "Theme deleted.");
      if (editingThemeId === themeId) onCancelEdit();
    } catch {
      addToast("error", "Failed to delete theme.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleStartEdit = (theme: SavedTheme) => {
    if (hasUnsavedChanges) {
      addToast("error", "You have unsaved changes. Save or cancel before editing another theme.");
      return;
    }
    onStartEdit(theme);
  };

  const handleStartNew = () => {
    if (hasUnsavedChanges) {
      addToast("error", "You have unsaved changes. Save or cancel before creating a new theme.");
      return;
    }
    onStartNew();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
          Saved Themes
        </h3>
        <span className="text-xs font-medium text-slate-400">
          {savedThemes.length} {savedThemes.length === 1 ? "theme" : "themes"} saved
        </span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-3 snap-x scrollbar-thin scrollbar-thumb-slate-200">

        {/* System Default Card */}
        <motion.div
          layout
          className={`shrink-0 snap-start w-48 p-4 rounded-2xl cursor-pointer transition-all border-2 flex flex-col justify-between group relative overflow-hidden ${
            isSystemDefaultActive
              ? "bg-slate-900 border-slate-900 shadow-lg shadow-slate-900/20"
              : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md"
          }`}
          onClick={isSystemDefaultActive ? undefined : handleActivateDefault}
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black ${
              isSystemDefaultActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
            }`}>
              S
            </div>
            {isSystemDefaultActive ? (
              <span className="text-[9px] font-black text-white/80 bg-white/20 px-2 py-1 rounded-full uppercase tracking-wider">
                Active
              </span>
            ) : (
              activatingId === "default" ? (
                <div className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" />
              ) : (
                <span className="text-[9px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to apply
                </span>
              )
            )}
          </div>
          <div>
            <p className={`text-sm font-black truncate ${isSystemDefaultActive ? "text-white" : "text-slate-700"}`}>
              System Default
            </p>
            <p className={`text-[10px] mt-0.5 ${isSystemDefaultActive ? "text-white/60" : "text-slate-400"}`}>
              Platform defaults
            </p>
          </div>
        </motion.div>

        {/* Saved Theme Cards */}
        <AnimatePresence>
          {savedThemes.map((theme) => {
            const isActive = activeThemeId === theme.id;
            const isEditing = editingThemeId === theme.id;
            const isDeleting = deletingId === theme.id;
            const isActivating = activatingId === theme.id;
            const brandColor = theme.variables["--fin-brand-600"] || "#3d60ab";

            return (
              <motion.div
                key={theme.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`shrink-0 snap-start w-48 p-4 rounded-2xl cursor-pointer transition-all border-2 flex flex-col justify-between group relative overflow-hidden ${
                  isEditing
                    ? "border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/15"
                    : isActive
                    ? "border-slate-900 bg-slate-900 shadow-lg shadow-slate-900/20"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md"
                } ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}
                onClick={() => !isEditing && !isDeleting && !isActivating && handleStartEdit(theme)}
              >
                {/* Color dot + status */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-9 h-9 rounded-xl shadow-sm ring-2 ring-white"
                    style={{ backgroundColor: brandColor }}
                  />
                  {isActive ? (
                    <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-wider ${isEditing ? "bg-blue-200 text-blue-700" : "bg-white/20 text-white/80"}`}>
                      Active
                    </span>
                  ) : isActivating ? (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-transparent animate-spin mt-1" />
                  ) : isEditing ? (
                    <span className="text-[9px] font-black text-blue-600 bg-blue-200 px-2 py-1 rounded-full uppercase tracking-wider">
                      Editing
                    </span>
                  ) : null}
                </div>

                {/* Theme name */}
                <div className="mb-3">
                  <p className={`text-sm font-black truncate pr-2 ${isActive && !isEditing ? "text-white" : "text-slate-800"}`}>
                    {theme.name}
                  </p>
                  <p className={`text-[10px] mt-0.5 ${isActive && !isEditing ? "text-white/60" : "text-slate-400"}`}>
                    {new Date(theme.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {!isActive && (
                    <button
                      onClick={() => handleActivate(theme.id)}
                      disabled={!!activatingId}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-black text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors disabled:opacity-50"
                      title="Set as Active Theme"
                    >
                      <Zap size={11} />
                      {isActivating ? "Applying…" : "Apply"}
                    </button>
                  )}
                  {isActive && !isEditing && (
                    <div className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-black text-emerald-700 bg-emerald-100 rounded-lg">
                      <Check size={11} />
                      Applied
                    </div>
                  )}
                  
                  {/* Delete — show confirm inline */}
                  {confirmDeleteId === theme.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDelete(theme.id)}
                        className="px-2 py-1.5 text-[10px] font-black text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition-colors"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1.5 text-[10px] font-black text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(theme.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Theme"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Create New Card */}
        <motion.div
          layout
          onClick={handleStartNew}
          className={`shrink-0 snap-start w-48 p-4 rounded-2xl cursor-pointer transition-all border-2 border-dashed flex flex-col items-center justify-center gap-3 group ${
            editorMode.type === "new"
              ? "border-blue-400 bg-blue-50"
              : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"
          }`}
        >
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
            editorMode.type === "new" ? "bg-blue-200" : "bg-slate-100 group-hover:bg-blue-100"
          }`}>
            <Plus size={20} className={editorMode.type === "new" ? "text-blue-700" : "text-slate-500 group-hover:text-blue-600"} />
          </div>
          <div className="text-center">
            <p className={`text-sm font-black ${editorMode.type === "new" ? "text-blue-700" : "text-slate-600"}`}>
              Create New
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Custom theme</p>
          </div>
        </motion.div>

      </div>
    </div>
  );
}