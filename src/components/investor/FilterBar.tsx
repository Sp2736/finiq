"use client";

import React from 'react';

interface FilterBarProps {
  activeFilterType: string;
  setActiveFilterType: (val: string) => void;
  activeFilterValue: string;
  setActiveFilterValue: (val: string) => void;
  filterOptions: string[];
  avgHoldingDays: number;
  role?: 'investor' | 'distributor';
}

export default function FilterBar({ 
  activeFilterType, 
  setActiveFilterType, 
  activeFilterValue, 
  setActiveFilterValue, 
  filterOptions, 
  avgHoldingDays,
  role = 'investor'
}: FilterBarProps) {
  
  // CSS variables handle theming; active/inactive defined via inline style in the button

  return (
    <div
      className="flex justify-between items-center gap-4 backdrop-blur-md p-2 rounded-md shadow-sm border"
      style={{ backgroundColor: 'var(--fin-filter-bg)', borderColor: 'var(--fin-filter-border)' }}
    >
      <div className="flex items-center gap-1.5 p-1">
        {["All", "Category/Industry", "AMC/Issuer", "Tag"].map((filter) => {
          const isActive = activeFilterType === filter;
          return (
            <button
              key={filter}
              onClick={() => { setActiveFilterType(filter); setActiveFilterValue("All"); }}
              className="px-4 py-2 rounded-md text-xs font-bold transition-all duration-200"
              style={isActive
                ? { backgroundColor: 'var(--fin-filter-option-active-bg)', color: 'var(--fin-filter-option-active-text)' }
                : { backgroundColor: 'var(--fin-filter-option-idle-bg)', color: 'var(--fin-filter-option-idle-text)' }
              }
            >
              {filter}
            </button>
          );
        })}
        
        {activeFilterType !== "All" && filterOptions.length > 0 && (
          <div
            className="ml-2 pl-3 flex items-center animate-[fadeIn_0.2s_ease-out] border-l"
            style={{ borderColor: 'var(--fin-filter-border)' }}
          >
            <select 
              value={activeFilterValue} 
              onChange={(e) => setActiveFilterValue(e.target.value)}
              style={{ color: 'var(--fin-input-text)' }}
              className="bg-transparent border-none text-sm font-bold focus:ring-0 cursor-pointer outline-none"
            >
              <option value="All">All {activeFilterType.replace('By ', '')}s</option>
              {filterOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        )}
      </div>
      <div className="pr-4 text-xs font-bold" style={{ color: 'var(--fin-ribbon-label)' }}>
        Avg Holding: <span style={{ color: 'var(--fin-ribbon-value)' }}>{avgHoldingDays} Days</span>
      </div>
    </div>
  );
}