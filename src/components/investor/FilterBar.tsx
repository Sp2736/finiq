"use client";

import React from 'react';

interface FilterBarProps {
  activeFilterType: string;
  setActiveFilterType: (val: string) => void;
  activeFilterValue: string;
  setActiveFilterValue: (val: string) => void;
  filterOptions: string[];
  avgHoldingDays: number;
}

export default function FilterBar({ 
  activeFilterType, 
  setActiveFilterType, 
  activeFilterValue, 
  setActiveFilterValue, 
  filterOptions, 
  avgHoldingDays 
}: FilterBarProps) {
  return (
    <div className="flex justify-between items-center gap-4 bg-white/60 backdrop-blur-md p-2 rounded-2xl border border-slate-200/60 shadow-sm">
      <div className="flex items-center gap-1.5 p-1">
        {["All", "Category/Industry", "AMC/Issuer", "Tag"].map((filter) => (
          <button
            key={filter}
            onClick={() => { setActiveFilterType(filter); setActiveFilterValue("All"); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeFilterType === filter 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
            }`}
          >
            {filter}
          </button>
        ))}
        
        {activeFilterType !== "All" && filterOptions.length > 0 && (
          <div className="ml-2 pl-3 border-l border-slate-200 flex items-center animate-[fadeIn_0.2s_ease-out]">
            <select 
              value={activeFilterValue} 
              onChange={(e) => setActiveFilterValue(e.target.value)}
              className="bg-transparent border-none text-slate-900 text-sm font-bold focus:ring-0 cursor-pointer outline-none"
            >
              <option value="All">All {activeFilterType.replace('By ', '')}s</option>
              {filterOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        )}
      </div>
      <div className="pr-4 text-xs font-bold text-slate-400">
        Avg Holding: <span className="text-slate-800">{avgHoldingDays} Days</span>
      </div>
    </div>
  );
}