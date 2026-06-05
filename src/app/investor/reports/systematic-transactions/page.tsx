// src/app/investor/reports/systematic-transactions/page.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, AlertCircle } from "lucide-react";
import InvestorSidebar from "@/components/investor/InvestorSidebar";

/**
 * Available transaction types for the systematic report.
 */
const TRANSACTION_TYPES = [
  { id: "SIP", label: "Systematic Investment Plan (SIP)" },
  { id: "STP", label: "Systematic Transfer Plan (STP)" },
  { id: "SWP", label: "Systematic Withdrawal Plan (SWP)" },
];

export default function InvestorSystematicTransactions() {
  // --- State Management for Transaction Type Dropdown ---
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(TRANSACTION_TYPES[0]);
  const typeDropdownRef = useRef<HTMLDivElement>(null);

  /**
   * Effect hook to manage clicking outside of the custom dropdown.
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
        setIsTypeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    // MAIN WRAPPER: Added flex and min-h-screen to accommodate the sidebar
    <div className="flex min-h-screen w-full bg-slate-50">
      
      {/* ─── INVESTOR SIDEBAR ─── */}
      <InvestorSidebar 
        onExportHoldings={() => {}} 
        onOpenCapitalGains={() => {}} 
        isExporting={false} 
        isPortfolioLoaded={true} 
      />

      {/* ─── PAGE CONTENT ─── */}
      <div className="relative flex-1 h-screen overflow-y-auto flex flex-col p-4 sm:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out gap-6 lg:gap-8">
        
        {/* PAGE HEADER & DESKTOP CONTROLS */}
        <div className="shrink-0 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 mb-1 flex items-center gap-3">
              My Systematic <span className="text-investor-600">Transactions</span>
            </h1>
            <p className="text-slate-500 font-medium text-sm">
              View your active and historical SIP, STP, and SWP mandates.
            </p>
          </div>

          {/* Custom Transaction Type Select Dropdown */}
          <div className="relative w-full md:w-72 z-20" ref={typeDropdownRef}>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 md:hidden">
              Transaction Type
            </label>
            <button
              onClick={() => setIsTypeOpen(!isTypeOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-sm font-semibold text-slate-700 hover:bg-white focus:bg-white focus:ring-2 focus:ring-investor-500/20 focus:border-investor-500 transition-all outline-none shadow-sm"
            >
              <span className="truncate">{selectedType.label}</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isTypeOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Type Dropdown Menu Container */}
            {isTypeOpen && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                <div className="flex flex-col py-1">
                  {TRANSACTION_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => {
                        setSelectedType(type);
                        setIsTypeOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors flex items-center justify-between ${
                        selectedType.id === type.id 
                          ? "bg-investor-50 text-investor-700" 
                          : "text-slate-700 hover:bg-slate-50 hover:text-investor-600"
                      }`}
                    >
                      {type.label}
                      {selectedType.id === type.id && <Check className="w-4 h-4 text-investor-600" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* DATA VIEW CONTAINER */}
        <div className="bg-white border border-slate-200 rounded-md shadow-sm flex flex-col flex-1 min-h-0 w-full overflow-hidden items-center justify-center relative z-10 p-8">
          <div className="w-16 h-16 bg-investor-50 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-investor-600" />
          </div>
          <h3 className="text-lg font-black text-slate-800 mb-2">No Records Found</h3>
          <p className="text-slate-500 text-sm max-w-md text-center">
            You currently don't have any active <strong>{selectedType.id}</strong> mandates running in your portfolio.
          </p>
        </div>
      </div>
    </div>
  );
}