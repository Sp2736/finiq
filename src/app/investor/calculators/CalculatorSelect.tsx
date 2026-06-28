import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface CalculatorSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
}

export const CalculatorSelect = ({ value, onChange, options }: CalculatorSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  return (
    <div className="relative w-full">
      {/* TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-md border transition-all shadow-sm text-sm font-black focus:outline-none focus:ring-4 group bg-[var(--fin-calc-select-bg)] border-[var(--fin-calc-select-border)] hover:border-[var(--fin-calc-select-hover-border)] text-[var(--fin-calc-select-text)] focus:ring-[var(--fin-calc-result-invested-bg)]"
      >
        <span className="truncate">{selectedOption.label}</span>
        <ChevronDown
          className="w-4 h-4 transition-transform duration-200 shrink-0"
          style={{ color: isOpen ? 'var(--fin-sidebar-chevron-open)' : 'var(--fin-sidebar-chevron-closed)', transform: isOpen ? 'rotate(180deg)' : 'none' }}
        />
      </button>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <>
          {/* Invisible Backdrop for click-outside */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          
          <div className="absolute z-50 w-full mt-2 rounded-md overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 bg-[var(--fin-content-surface)] border border-[var(--fin-border)] shadow-[0_12px_40px_-10px_rgba(0,0,0,0.15)]">
            <ul className="max-h-60 overflow-y-auto p-1.5 custom-scrollbar">
              {options.map((opt) => (
                <li
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`p-3 text-sm cursor-pointer rounded-md mx-0.5 my-0.5 transition-colors duration-150 ${
                    value === opt.value
                      ? "font-black border-l-2 bg-[var(--fin-sidebar-item-active-bg)] text-[var(--fin-sidebar-item-active-text)] border-[var(--fin-sidebar-item-active-text)]"
                      : "font-semibold border-l-2 border-transparent hover:bg-[var(--fin-sidebar-item-hover-bg)] hover:text-[var(--fin-sidebar-item-hover-text)] text-[var(--fin-sidebar-item-default-text)]"
                  }`}
                >
                  {opt.label}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};