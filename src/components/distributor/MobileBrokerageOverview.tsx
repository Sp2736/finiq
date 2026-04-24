"use client";

import React from 'react';
import { formatCurrencyNoDecimals } from '@/lib/utils';
import LogoutButton from '@/components/investor/LogoutButton';
import Badge from '@/components/investor/Badge';

interface MobileBrokerageProps {
  distributor: any;
  filteredData: any[];
  activeFilterType: string;
  setActiveFilterType: (val: string) => void;
  activeFilterValue: string;
  setActiveFilterValue: (val: string) => void;
  filterOptions: string[];
}

export default function MobileBrokerageOverview({
  distributor,
  filteredData,
  activeFilterType,
  setActiveFilterType,
  activeFilterValue,
  setActiveFilterValue,
  filterOptions
}: MobileBrokerageProps) {

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 bg-white px-5 md:px-8 pt-8 pb-6 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] relative z-20">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 mb-1">
              Brokerage <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-600 to-primary/80">Hub</span>
            </h1>
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[9px]">
                {getInitials(distributor.name)}
              </span>
              <h2 className="text-xs md:text-sm font-bold text-indigo-700 tracking-wide uppercase truncate max-w-[200px]">{distributor.name}</h2>
            </div>
          </div>
          <LogoutButton />
        </div>

        <div className="flex flex-col items-center text-center">
          <p className="text-[11px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Earnings (YTD)</p>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">{formatCurrencyNoDecimals(distributor.totalEarnings)}</h1>
          
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-sm md:text-base font-bold text-emerald-600">
              +{distributor.ytdGrowth}%
            </span>
            <span className="text-[10px] md:text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase tracking-wider">
              VS LAST MONTH
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:gap-6 mt-6 md:mt-8 pt-6 border-t border-slate-100 text-center max-w-2xl mx-auto">
          <div className="flex flex-col items-center">
            <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pending</p>
            <p className="text-sm md:text-base font-bold text-amber-600">{formatCurrencyNoDecimals(distributor.pendingBrokerage)}</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Active Clients</p>
            <p className="text-sm md:text-base font-bold text-indigo-600">{distributor.activeClients}</p>
          </div>
        </div>
      </div>

      <div className="shrink-0 px-5 md:px-8 pt-6 pb-2 z-10 bg-slate-50 shadow-sm border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm md:text-base font-bold text-slate-900">Transactions</h3>
          <span className="text-[11px] md:text-xs font-bold text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded-full">{filteredData.length} Records</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 -mx-5 px-5 md:-mx-8 md:px-8">
          {["All", "Category", "Status"].map((filter) => (
            <button
              key={filter}
              onClick={() => { setActiveFilterType(filter); setActiveFilterValue("All"); }}
              className={`flex-shrink-0 px-4 md:px-5 py-2 rounded-full text-xs md:text-sm font-bold transition-all duration-200 border ${
                activeFilterType === filter 
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
        
        {activeFilterType !== "All" && filterOptions.length > 0 && (
          <div className="mb-3 animate-[fadeIn_0.2s_ease-out]">
            <select 
              value={activeFilterValue} 
              onChange={(e) => setActiveFilterValue(e.target.value)}
              className="w-full md:w-auto md:min-w-[300px] bg-white border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-3 font-bold shadow-sm appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em`, paddingRight: `2.5rem` }}
            >
              <option value="All">All {activeFilterType}s</option>
              {filterOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-5 md:px-8 py-4 pb-20">
        <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4 lg:grid-cols-3">
          {filteredData.map((item) => (
            <div key={item.id} className="bg-white p-4 md:p-5 rounded-[1.25rem] border border-slate-200 shadow-sm">
              <div className="mb-4 flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-slate-900 text-[13px] md:text-sm leading-tight mb-2">{item.clientName}</h4>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[9px] md:text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      {item.folioNo}
                    </span>
                    <span className="text-[9px] md:text-[10px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                      {item.category}
                    </span>
                  </div>
                </div>
                <Badge intent={item.status === 'Paid' ? 'success' : item.status === 'Pending' ? 'warning' : 'neutral'}>
                  {item.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div>
                  <p className="text-[10px] md:text-[11px] text-slate-400 font-bold uppercase mb-0.5">Transaction Type</p>
                  <p className="text-xs md:text-sm font-bold text-slate-700">{item.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] md:text-[11px] text-slate-400 font-bold uppercase mb-0.5">Amount</p>
                  <p className="text-xs md:text-sm font-black text-slate-900">{formatCurrencyNoDecimals(item.amount)}</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <span className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase">Date</span>
                <span className="text-xs md:text-sm font-bold text-slate-600">{item.date}</span>
              </div>
            </div>
          ))}
          {filteredData.length === 0 && (
            <div className="text-center md:col-span-2 py-10 text-slate-500 text-sm font-medium">No transactions found.</div>
          )}
        </div>
      </div>
    </div>
  );
}