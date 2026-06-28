"use client";

import React from "react";
import { motion } from "framer-motion";

interface ColorPickerGroupProps {
  label: string;
  description?: string;
  variables: { key: string; label: string; value: string }[];
  onChange: (key: string, value: string) => void;
  disabled?: boolean;
}

export default function ColorPickerGroup({
  label,
  description,
  variables,
  onChange,
  disabled = false,
}: ColorPickerGroupProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-5 rounded-2xl bg-white/70 backdrop-blur-xl border shadow-sm transition-all ${
        disabled
          ? "border-slate-100 opacity-50 pointer-events-none select-none"
          : "border-slate-200/60 hover:border-slate-300/60"
      }`}
    >
      <h3 className="text-sm font-black text-slate-900">{label}</h3>
      {description && (
        <p className="text-xs text-slate-500 mt-1 mb-4">{description}</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
        {variables.map((v) => (
          <div
            key={v.key}
            className="flex items-center space-x-3 group cursor-pointer"
          >
            <div className="relative w-10 h-10 rounded-full overflow-hidden shadow-inner ring-1 ring-slate-200 group-hover:ring-blue-400 transition-all shrink-0">
              <input
                type="color"
                value={v.value || "#000000"}
                disabled={disabled}
                onChange={(e) => onChange(v.key, e.target.value)}
                className="absolute inset-[-50%] w-[200%] h-[200%] cursor-pointer opacity-0 z-10"
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ backgroundColor: v.value }}
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-700 leading-tight truncate">
                {v.label}
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                {v.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
