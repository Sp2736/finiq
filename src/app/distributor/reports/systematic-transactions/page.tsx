"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, Repeat, AlertCircle } from "lucide-react";

/**
 * Available transaction types for the systematic report.
 * Utilizing standard title casing for professional presentation.
 */
const TRANSACTION_TYPES = [
  { id: "SIP", label: "Systematic Investment Plan (SIP)" },
  { id: "STP", label: "Systematic Transfer Plan (STP)" },
  { id: "SWP", label: "Systematic Withdrawal Plan (SWP)" },
];

/**
 * Mock investor data representing the client list.
 * Note: Names are strictly formatted in Title Case as per project requirements.
 */
const MOCK_INVESTORS = [
  { id: "inv-1", name: "Aman Gupta" },
  { id: "inv-2", name: "Bhaisaheb Murtaza Zulfiqar" },
  { id: "inv-3", name: "Swayam Patel" },
];

export default function SystematicTransactionsReport() {
  // --- State Management for Investor Dropdown ---
  const [isInvestorOpen, setIsInvestorOpen] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState(MOCK_INVESTORS[0]);
  const [investorSearch, setInvestorSearch] = useState("");
  const investorDropdownRef = useRef<HTMLDivElement>(null);

  // --- State Management for Transaction Type Dropdown ---
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(TRANSACTION_TYPES[0]);
  const typeDropdownRef = useRef<HTMLDivElement>(null);

  /**
   * Effect hook to handle outside clicks for custom dropdown menus.
   * Ensures the dropdowns close smoothly when interacting with other parts of the UI.
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (investorDropdownRef.current && !investorDropdownRef.current.contains(event.target as Node)) {
        setIsInvestorOpen(false);
      }
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
        setIsTypeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter logic for the investor search bar
  const filteredInvestors = MOCK_INVESTORS.filter((inv) =>
    inv.name.toLowerCase().includes(investorSearch.toLowerCase())
  );

  return (
    // RELATIVE CONTAINER: Matches the layout structure of the Active SIPs page
    <div className="relative flex-1 w-full h-[calc(100vh-5rem)] flex flex-col p-4 sm:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out gap-6 lg:gap-8">
      
      {/* ─── PAGE HEADER & DESCRIPTION ─── */}
      <div className="shrink-0">
        <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 mb-1 flex items-center gap-3">
          Systematic Transaction <span className="text-distributor-600">Report</span>
        </h1>
        <p className="text-slate-500 font-medium text-sm">
          Track and manage SIP, STP, and SWP mandates across your client portfolio.
        </p>
      </div>

      {/* ─── CONTROL PANEL: DROPDOWNS & SEARCH ─── */}
      <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm flex flex-col sm:flex-row gap-5 items-start sm:items-center relative z-20 shrink-0">
        
        {/* Custom Investor Select Dropdown */}
        <div className="relative w-full sm:max-w-sm" ref={investorDropdownRef}>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
            Select Investor
          </label>
          <button
            onClick={() => setIsInvestorOpen(!isInvestorOpen)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-sm font-semibold text-slate-700 hover:bg-white focus:bg-white focus:ring-2 focus:ring-distributor-500/20 focus:border-distributor-500 transition-all outline-none"
          >
            <span className="truncate">
              {selectedInvestor ? selectedInvestor.name : "Search investor..."}
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isInvestorOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown Menu Container */}
          {isInvestorOpen && (
            <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
              <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={investorSearch}
                    onChange={(e) => setInvestorSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:border-distributor-500 focus:ring-1 focus:ring-distributor-500/20 transition-all"
                  />
                </div>
              </div>
              
              {/* Scrollable Results Area */}
              <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                {filteredInvestors.length > 0 ? (
                  filteredInvestors.map((inv) => (
                    <button
                      key={inv.id}
                      onClick={() => {
                        setSelectedInvestor(inv);
                        setIsInvestorOpen(false);
                        setInvestorSearch("");
                      }}
                      className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-distributor-50 hover:text-distributor-700 transition-colors flex items-center justify-between group"
                    >
                      {inv.name}
                      {selectedInvestor.id === inv.id && <Check className="w-4 h-4 text-distributor-600" />}
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-slate-400 font-medium">No investors found.</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Custom Transaction Type Select Dropdown */}
        <div className="relative w-full sm:max-w-xs" ref={typeDropdownRef}>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
            Transaction Type
          </label>
          <button
            onClick={() => setIsTypeOpen(!isTypeOpen)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-sm font-semibold text-slate-700 hover:bg-white focus:bg-white focus:ring-2 focus:ring-distributor-500/20 focus:border-distributor-500 transition-all outline-none"
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
                        ? "bg-distributor-50 text-distributor-700" 
                        : "text-slate-700 hover:bg-slate-50 hover:text-distributor-600"
                    }`}
                  >
                    {type.label}
                    {selectedType.id === type.id && <Check className="w-4 h-4 text-distributor-600" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── DATA VIEW CONTAINER ─── */}
      {/* Serves as the table container once data is hooked up. Currently displaying empty state. */}
      <div className="bg-white border border-slate-200 rounded-md shadow-sm flex flex-col flex-1 min-h-0 w-full overflow-hidden items-center justify-center relative z-10 p-8">
        <div className="w-16 h-16 bg-distributor-50 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-distributor-600" />
        </div>
        <h3 className="text-lg font-black text-slate-800 mb-2">No Active {selectedType.id}s Found</h3>
        <p className="text-slate-500 text-sm max-w-md text-center">
          There are currently no active systematic mandates of type <strong>{selectedType.id}</strong> registered for <strong>{selectedInvestor.name}</strong>. Data will populate here once transactions are initiated.
        </p>
      </div>
    </div>
  );
}