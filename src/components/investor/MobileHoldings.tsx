"use client";

import React from 'react';
import { ClientPortfolio, UnifiedFund } from '@/types/investor';
import { formatCurrencyNoDecimals, getColorClass } from '@/lib/utils';
import LogoutButton from './LogoutButton';

interface MobileHoldingsProps {
  client: ClientPortfolio;
  filteredFunds: UnifiedFund[];
  activeFilterType: string;
  setActiveFilterType: (val: string) => void;
  activeFilterValue: string;
  setActiveFilterValue: (val: string) => void;
  filterOptions: string[];
  onNavigateToFund: (fund: UnifiedFund) => void;
}

export default function MobileHoldings({
  client,
  filteredFunds,
  activeFilterType,
  setActiveFilterType,
  activeFilterValue,
  setActiveFilterValue,
  filterOptions,
  onNavigateToFund
}: MobileHoldingsProps) {
  return (
    <div className="pb-20">
      {/* Portfolio Summary Section */}
      <div className="bg-white px-5 pt-8 pb-6 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] relative z-10">
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-1">
              Portfolio <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-600 to-primary/80">Overview</span>
            </h1>
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[9px]">BM</span>
              <h2 className="text-xs font-bold text-indigo-700 tracking-wide uppercase truncate max-w-[200px]">{client.clientName}</h2>
            </div>
          </div>
          
          <LogoutButton />
        </div>

        {/* Center-aligned KPIs */}
        <div className="flex flex-col items-center text-center">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Value</p>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">{formatCurrencyNoDecimals(client.currentValue)}</h1>
          
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className={`text-sm font-bold ${getColorClass(client.todaysGain)}`}>
              {client.todaysGain > 0 ? '+' : ''}{formatCurrencyNoDecimals(client.todaysGain)} ({client.todaysGainPercent}%)
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase tracking-wider">
              1 Day P&L
            </span>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-100 text-center">
          <div className="flex flex-col items-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Invested</p>
            <p className="text-sm font-bold text-slate-900">{formatCurrencyNoDecimals(client.investedCapital)}</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Gain</p>
            <p className={`text-sm font-bold ${getColorClass(client.unrealisedGain)}`}>{formatCurrencyNoDecimals(client.unrealisedGain)}</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">XIRR</p>
            <p className="text-sm font-bold text-indigo-600">{client.xirr}%</p>
          </div>
        </div>
      </div>

      <div className="px-5 mt-6">
        {/* Fund List (Mobile) */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900">Your Holdings</h3>
          <span className="text-[11px] font-bold text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded-full">{filteredFunds.length} Funds</span>
        </div>

        {/* Mobile Filters */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-4 -mx-5 px-5">
          {["All", "Category/Industry", "AMC/Issuer", "Tag"].map((filter) => (
            <button
              key={filter}
              onClick={() => { setActiveFilterType(filter); setActiveFilterValue("All"); }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 border ${
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
          <div className="mb-4 animate-[fadeIn_0.2s_ease-out]">
            <select 
              value={activeFilterValue} 
              onChange={(e) => setActiveFilterValue(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-3 font-bold shadow-sm appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em`, paddingRight: `2.5rem` }}
            >
              <option value="All">All {activeFilterType.replace('By ', '')}s</option>
              {filterOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        )}

        <div className="space-y-4">
          {filteredFunds.map((fund) => (
            <div 
              key={fund.folioNo}
              onClick={() => onNavigateToFund(fund)}
              className="bg-white p-4 rounded-[1.25rem] border border-slate-200 shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
            >
              <div className="mb-4">
                <h4 className="font-bold text-slate-900 text-[13px] leading-tight mb-2">{fund.fundName}</h4>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[9px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    {fund.folioNo}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border ${fund.sipStatus.includes('Active') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                    {fund.sipStatus}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Invested</p>
                  <p className="text-xs font-bold text-slate-700">{formatCurrencyNoDecimals(fund.investedCapital)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Current</p>
                  <p className="text-xs font-black text-slate-900">{formatCurrencyNoDecimals(fund.currentValue)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">XIRR</p>
                  <p className="text-xs font-bold text-indigo-600">{fund.xirr}%</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Gain</span>
                  <span className={`text-xs font-bold ${getColorClass(fund.unrealisedGain)}`}>{formatCurrencyNoDecimals(fund.unrealisedGain)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">1D</span>
                  <span className={`text-xs font-bold ${getColorClass(fund.oneDayChange)}`}>
                    {fund.oneDayChange > 0 ? '+' : ''}{formatCurrencyNoDecimals(fund.oneDayChange)}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {filteredFunds.length === 0 && (
            <div className="text-center py-10 text-slate-500 text-sm font-medium">No funds found matching this filter.</div>
          )}
        </div>
      </div>
    </div>
  );
}