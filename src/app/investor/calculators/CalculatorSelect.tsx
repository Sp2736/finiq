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
        className="w-full flex items-center justify-between bg-investor-50 px-4 py-3 rounded-md border border-distributor-100 transition-all shadow-sm text-sm font-black text-distributor-700 hover:border-distributor-300 focus:outline-none focus:ring-4 focus:ring-distributor-500/10"
      >
        <span className="truncate">{selectedOption.label}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-distributor-600" : "text-distributor-400"
          }`}
        />
      </button>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <>
          {/* Invisible Backdrop for click-outside */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          
          <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-md shadow-[0_12px_40px_-10px_rgba(0,0,0,0.15)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
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
                      ? "bg-investor-50 text-distributor-700 font-black border-l-2 border-distributor-500"
                      : "text-slate-600 font-semibold hover:bg-slate-50 hover:text-slate-900 border-l-2 border-transparent"
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