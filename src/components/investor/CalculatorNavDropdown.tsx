"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

export default function CalculatorNavDropdown() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const calculators = [
    { path: "/investor/calculators/mf-returns", name: "MF Returns" },
    { path: "/investor/calculators/goal", name: "Goal Planner" },
    { path: "/investor/calculators/fd", name: "FD Calculator" },
    { path: "/investor/calculators/swp", name: "SWP Calculator" },
    { path: "/investor/calculators/stp", name: "STP Calculator" },
    { path: "/investor/calculators/reverse-emi", name: "Reverse EMI" },
  ];

  const selectedOption = calculators.find((calc) => calc.path === pathname) || calculators[0];

  return (
    <div className="relative w-[180px] sm:w-[200px]">
      {/* TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-[var(--fin-table-bg)]/60 backdrop-blur-md px-4 py-2.5 rounded-md border border-[var(--fin-border)] transition-all shadow-sm text-sm font-bold text-[var(--fin-table-row-text)] hover:border-[var(--fin-brand-300)] hover:bg-[var(--fin-brand-50)] hover:text-[var(--fin-brand-700)] focus:outline-none focus:ring-2 focus:ring-[var(--fin-brand-500)]/20"
      >
        <span className="truncate">{selectedOption.name}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-[var(--fin-brand-600)]" : "text-[var(--fin-aux-text)]"
          }`}
        />
      </button>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <>
          {/* Invisible Backdrop for click-outside */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          
          <div className="absolute right-0 z-50 w-full min-w-[200px] mt-2 bg-[var(--fin-table-bg)] border border-[var(--fin-border)] rounded-md shadow-[0_12px_40px_-10px_rgba(0,0,0,0.15)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <ul className="max-h-60 overflow-y-auto p-1.5 custom-scrollbar">
              {calculators.map((calc) => (
                <li
                  key={calc.path}
                  onClick={() => {
                    setIsOpen(false);
                    // Only push if it's a different route to save re-renders
                    if (pathname !== calc.path) {
                      router.push(calc.path);
                    }
                  }}
                  className={`p-3 text-sm cursor-pointer rounded-md mx-0.5 my-0.5 transition-colors duration-150 ${
                    pathname === calc.path
                      ? "bg-[var(--fin-brand-50)] text-[var(--fin-brand-700)] font-black border-l-2 border-[var(--fin-brand-500)]"
                      : "text-[var(--fin-body-text)] font-semibold hover:bg-[var(--fin-page-bg)] hover:text-[var(--fin-heading-primary)] border-l-2 border-transparent"
                  }`}
                >
                  {calc.name}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}