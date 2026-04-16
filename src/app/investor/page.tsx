"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// --- Exact Data Structure ---

type Transaction = {
  id: string;
  transactionDate: string;
  transactionType: string;
  amount: number;
  sttCharges: number;
  nav: number;
  units: number;
  balanceUnits: number;
  holdingDays: number;
  capitalGain: number;
};

type Fund = {
  folioNo: string;
  fundName: string;
  purchaseDate: string;
  totalCapital: number;
  investedCapital: number;
  currentValue: number;
  availableUnits: number;
  currentNAV: number;
  avgNAV: number;
  dividendPayout: number;
  unrealisedGain: number;
  unrealisedGainPercent: number;
  realisedGain: number;
  statusTag: string;
  category: string;
  amc: string;
  securityType: string;
  transactions: Transaction[];
};

type ClientPortfolio = {
  id: string;
  clientName: string;
  totalCapital: number;
  investedCapital: number;
  currentValue: number;
  dividendPayout: number;
  unrealisedGain: number;
  unrealisedGainPercent: number;
  realisedGain: number;
  netPL: number;
  todaysGain: number;
  xirr: number;
  absReturn: number;
  avgHoldingDays: number;
  funds: Fund[];
};

// --- Single Client Dummy Data ---
const CURRENT_CLIENT: ClientPortfolio = {
  id: "c1",
  clientName: "BHAISAHEB MURTAZA ZULFIQAR - (NRI/PNRI)",
  totalCapital: 1706000,
  investedCapital: 1706000,
  currentValue: 1709197,
  dividendPayout: 0,
  unrealisedGain: 3197,
  unrealisedGainPercent: 0.19,
  realisedGain: 0,
  netPL: 3197,
  todaysGain: 2738,
  xirr: 0.21,
  absReturn: 0.19,
  avgHoldingDays: 322,
  funds: [
    {
      folioNo: "AXIS-827364", fundName: "Axis Bluechip Direct Plan - Growth", purchaseDate: "26/04/2024", totalCapital: 400000, investedCapital: 400000, currentValue: 406879, availableUnits: 2341.653, currentNAV: 173.65, avgNAV: 170.85, dividendPayout: 0, unrealisedGain: 6879, unrealisedGainPercent: 1.71, realisedGain: 0, statusTag: "Active", category: "Equity", amc: "Axis", securityType: "Mutual Fund",
      transactions: [
        { id: "t1", transactionDate: "26/04/2024", transactionType: "PURCHASE", amount: 200000, sttCharges: 0.10, nav: 170.0, units: 1176.47, balanceUnits: 1176.47, holdingDays: 322, capitalGain: 0 },
        { id: "t2", transactionDate: "18/05/2024", transactionType: "ADDITIONAL(SIP)", amount: 50000, sttCharges: 0.10, nav: 170.50, units: 293.255, balanceUnits: 1469.725, holdingDays: 300, capitalGain: 0 },
        { id: "t3", transactionDate: "18/06/2024", transactionType: "ADDITIONAL(SIP)", amount: 50000, sttCharges: 0.10, nav: 171.00, units: 292.397, balanceUnits: 1762.122, holdingDays: 270, capitalGain: 0 },
        { id: "t4", transactionDate: "18/07/2024", transactionType: "ADDITIONAL(SIP)", amount: 50000, sttCharges: 0.10, nav: 170.80, units: 292.740, balanceUnits: 2054.862, holdingDays: 240, capitalGain: 0 },
        { id: "t5", transactionDate: "18/08/2024", transactionType: "ADDITIONAL(SIP)", amount: 50000, sttCharges: 0.10, nav: 172.10, units: 290.528, balanceUnits: 2345.390, holdingDays: 210, capitalGain: 0 },
        { id: "t6", transactionDate: "26/09/2024", transactionType: "ADDITIONAL PURCHASE", amount: 200000, sttCharges: 0.10, nav: 171.68, units: 1165.183, balanceUnits: 3510.573, holdingDays: 170, capitalGain: 0 },
      ]
    },
    {
      folioNo: "HDFC-112233", fundName: "HDFC Corporate Bond Fund", purchaseDate: "15/01/2023", totalCapital: 1306000, investedCapital: 1306000, currentValue: 1302318, availableUnits: 45000.5, currentNAV: 28.94, avgNAV: 29.02, dividendPayout: 0, unrealisedGain: -3682, unrealisedGainPercent: -0.28, realisedGain: 0, statusTag: "Active", category: "Debt", amc: "HDFC", securityType: "Bond",
      transactions: [
        { id: "t7", transactionDate: "15/01/2023", transactionType: "PURCHASE", amount: 1306000, sttCharges: 0, nav: 29.02, units: 45000.5, balanceUnits: 45000.5, holdingDays: 780, capitalGain: 0 },
      ]
    },
    {
      folioNo: "ICICI-998877", fundName: "ICICI Prudential Balanced Advantage", purchaseDate: "10/02/2022", totalCapital: 500000, investedCapital: 500000, currentValue: 585000, availableUnits: 15000.0, currentNAV: 39.0, avgNAV: 33.33, dividendPayout: 12000, unrealisedGain: 85000, unrealisedGainPercent: 17.0, realisedGain: 25000, statusTag: "Expired or Terminated", category: "Hybrid", amc: "ICICI", securityType: "Mutual Fund",
      transactions: [
        { id: "t8", transactionDate: "10/02/2022", transactionType: "PURCHASE", amount: 600000, sttCharges: 1.5, nav: 30.0, units: 20000.0, balanceUnits: 20000.0, holdingDays: 1100, capitalGain: 0 },
        { id: "t9", transactionDate: "15/12/2023", transactionType: "REDEMPTION", amount: -100000, sttCharges: 0.5, nav: 35.0, units: -5000.0, balanceUnits: 15000.0, holdingDays: 600, capitalGain: 25000 },
      ]
    }
  ]
};

// --- Reusable UI Badges ---
const Badge = ({ children, intent = 'neutral' }: { children: React.ReactNode, intent?: 'neutral'|'success'|'danger'|'brand' }) => {
  const styles = {
    neutral: 'bg-slate-100 text-slate-600 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    danger: 'bg-rose-50 text-rose-700 border-rose-200/60',
    brand: 'bg-indigo-50 text-indigo-700 border-indigo-200/60'
  };
  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border uppercase tracking-wider ${styles[intent]}`}>
      {children}
    </span>
  );
};

export default function InvestorDashboard() {
  const router = useRouter();

  // Desktop Enforce single active accordion row
  const [expandedFund, setExpandedFund] = useState<string | null>(null);
  
  const [activeFilterType, setActiveFilterType] = useState<string>("All");
  const [activeFilterValue, setActiveFilterValue] = useState<string>("All");

  const toggleFund = (id: string) => {
    if (expandedFund === id) {
      setExpandedFund(null);
    } else {
      setExpandedFund(id);
    }
  };

  const filterOptions = useMemo(() => {
    const options = new Set<string>();
    CURRENT_CLIENT.funds.forEach(fund => {
      if (activeFilterType === "By Category/Industry") options.add(fund.category);
      if (activeFilterType === "By AMC/Issuer") options.add(fund.amc);
      if (activeFilterType === "By Tag" && fund.statusTag) options.add(fund.statusTag);
    });
    return Array.from(options);
  }, [activeFilterType]);

  const getColorClass = (val: number) => val > 0 ? 'text-emerald-600' : val < 0 ? 'text-rose-600' : 'text-slate-500';
  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  const formatPct = (val: number) => `${val > 0 ? '+' : ''}${val.toFixed(2)}%`;

  const filteredFunds = CURRENT_CLIENT.funds.filter(fund => {
    if (activeFilterType === "All" || activeFilterValue === "All") return true;
    if (activeFilterType === "By Category/Industry") return fund.category === activeFilterValue;
    if (activeFilterType === "By AMC/Issuer") return fund.amc === activeFilterValue;
    if (activeFilterType === "By Tag") return fund.statusTag === activeFilterValue;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 font-sans relative selection:bg-indigo-500/20 selection:text-indigo-900 pb-24">
      {/* Background matching Login Page */}
      <div className="absolute inset-0 z-0 opacity-[0.35] bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      
      <div className="relative z-10 px-4 sm:px-8 lg:px-12 py-6 lg:py-8 max-w-[1800px] mx-auto space-y-6 lg:space-y-8 animate-[fadeIn_0.5s_ease-out]">
        
        {/* Header - Shared across Mobile & Desktop */}
        <div className="flex flex-col lg:flex-row lg:justify-between items-start lg:items-end gap-2 lg:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900">
              Portfolio <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400">Overview</span>
            </h1>
            <div className="mt-2 lg:mt-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[9px] lg:text-[10px]">BM</span>
              <h2 className="text-xs lg:text-sm font-bold text-indigo-700 tracking-wide uppercase">{CURRENT_CLIENT.clientName}</h2>
            </div>
          </div>
        </div>

        {/* ========================================= */}
        {/* MOBILE VIEW (< 1024px)                    */}
        {/* ========================================= */}
        <div className="block lg:hidden space-y-5">
          
          {/* Mobile Main KPI Card */}
          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-200/60 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[100px] -mr-8 -mt-8 pointer-events-none z-0" />
            
            <div className="relative z-10">
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Current Value</p>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">{formatCurrency(CURRENT_CLIENT.currentValue)}</h2>
              
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-sm font-black ${getColorClass(CURRENT_CLIENT.todaysGain)}`}>
                  {CURRENT_CLIENT.todaysGain > 0 ? '+' : ''}{formatCurrency(CURRENT_CLIENT.todaysGain)}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${CURRENT_CLIENT.todaysGain > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50' : 'bg-rose-50 text-rose-700 border border-rose-100/50'}`}>
                  1 Day P&L
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100 relative z-10">
              <div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Invested Capital</p>
                <p className="text-base font-bold text-slate-900">{formatCurrency(CURRENT_CLIENT.investedCapital)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Unrealised Gain</p>
                <p className={`text-base font-bold ${getColorClass(CURRENT_CLIENT.unrealisedGain)}`}>
                  {formatCurrency(CURRENT_CLIENT.unrealisedGain)}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Net P&L</p>
                <p className={`text-base font-bold ${getColorClass(CURRENT_CLIENT.netPL)}`}>{formatCurrency(CURRENT_CLIENT.netPL)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">XIRR</p>
                <p className="text-base font-bold text-indigo-600">{CURRENT_CLIENT.xirr}%</p>
              </div>
            </div>
          </div>

          {/* Mobile Filter Row (Horizontal Scroll) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 pt-1 -mx-4 px-4">
            {["All", "By Category/Industry", "By AMC/Issuer", "By Tag"].map((filter) => (
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
          
          {/* Mobile Dynamic Sub-Filter (if active) */}
          {activeFilterType !== "All" && filterOptions.length > 0 && (
            <div className="animate-[fadeIn_0.2s_ease-out]">
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

          {/* Mobile Fund Cards */}
          <div className="space-y-3">
            {filteredFunds.map((fund) => (
              <div 
                key={fund.folioNo}
                onClick={() => router.push(`/investor/fund/${fund.folioNo}`)}
                className="bg-white p-4 rounded-[1.25rem] border border-slate-200/80 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] active:scale-[0.98] transition-transform cursor-pointer"
              >
                <div className="flex justify-between items-start mb-3 gap-4">
                  <h3 className="font-bold text-slate-900 text-sm leading-tight">{fund.fundName}</h3>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Value</p>
                    <p className="font-black text-slate-900 text-base leading-none">{formatCurrency(fund.currentValue)}</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-end mt-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60 font-mono font-medium">
                      Folio: {fund.folioNo}
                    </span>
                    <p className="text-xs font-medium text-slate-500">Inv: <span className="font-bold text-slate-700">{formatCurrency(fund.investedCapital)}</span></p>
                  </div>
                  <div className="text-right">
                     <p className={`text-xs font-black ${getColorClass(fund.unrealisedGain)}`}>{formatCurrency(fund.unrealisedGain)}</p>
                     <p className={`text-[10px] font-bold mt-0.5 ${getColorClass(fund.unrealisedGainPercent)}`}>({formatPct(fund.unrealisedGainPercent)})</p>
                  </div>
                </div>
              </div>
            ))}
            {filteredFunds.length === 0 && (
              <div className="text-center py-10 text-slate-500 text-sm font-medium">No funds found matching this filter.</div>
            )}
          </div>
        </div>


        {/* ========================================= */}
        {/* DESKTOP VIEW (>= 1024px)                  */}
        {/* ========================================= */}
        <div className="hidden lg:block space-y-8">
          
          {/* Desktop Global Stats Ribbon */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-sm overflow-x-auto custom-scrollbar">
            <div className="flex w-max min-w-full divide-x divide-slate-100 p-2">
              {[
                { label: "Invested Capital", value: formatCurrency(CURRENT_CLIENT.investedCapital) },
                { label: "Current Value", value: formatCurrency(CURRENT_CLIENT.currentValue), highlight: true },
                { label: "Unrealised Gains", value: formatCurrency(CURRENT_CLIENT.unrealisedGain), sub: `(${formatPct(CURRENT_CLIENT.unrealisedGainPercent)})`, valNum: CURRENT_CLIENT.unrealisedGain },
                { label: "Realised Gains", value: formatCurrency(CURRENT_CLIENT.realisedGain), valNum: CURRENT_CLIENT.realisedGain },
                { label: "Dividend Payout", value: formatCurrency(CURRENT_CLIENT.dividendPayout), valNum: CURRENT_CLIENT.dividendPayout },
                { label: "Net P&L", value: formatCurrency(CURRENT_CLIENT.netPL), valNum: CURRENT_CLIENT.netPL },
                { label: "XIRR / ABS", value: `${CURRENT_CLIENT.xirr}% / ${CURRENT_CLIENT.absReturn}%`, valNum: CURRENT_CLIENT.xirr },
              ].map((stat, idx) => (
                <div key={idx} className="flex-1 px-6 py-4 min-w-[160px]">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{stat.label}</p>
                  <div className="flex items-baseline gap-2">
                    <p className={`text-xl font-black tabular-nums tracking-tight ${stat.highlight ? 'text-indigo-600' : (stat.valNum !== undefined ? getColorClass(stat.valNum) : 'text-slate-900')}`}>
                      {stat.value}
                    </p>
                    {stat.sub && (
                      <span className={`text-xs font-bold ${stat.valNum !== undefined ? getColorClass(stat.valNum) : ''}`}>{stat.sub}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Filter Bar */}
          <div className="flex justify-between items-center gap-4 bg-white/60 backdrop-blur-md p-2 rounded-2xl border border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-1.5 p-1">
              {["All", "By Category/Industry", "By AMC/Issuer", "By Tag"].map((filter) => (
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
              Avg Holding: <span className="text-slate-800">{CURRENT_CLIENT.avgHoldingDays} Days</span>
            </div>
          </div>

          {/* Desktop Main Data Table */}
          <div className="bg-white/95 backdrop-blur-3xl rounded-[1.5rem] border border-slate-200/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] overflow-hidden relative">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[1400px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                    <th className="p-4 w-12 sticky left-0 z-20 bg-slate-50 border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]"></th>
                    <th className="p-4 w-[350px] sticky left-12 z-20 bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Fund Details</th>
                    <th className="p-4">Purch. Date</th>
                    <th className="p-4 text-right">Inv. Capital</th>
                    <th className="p-4 text-right">Current Val</th>
                    <th className="p-4 text-right">Units</th>
                    <th className="p-4 text-right">NAV (Cur/Avg)</th>
                    <th className="p-4 text-right">Dividend</th>
                    <th className="p-4 text-right">Unrealised Gain</th>
                  </tr>
                </thead>
                
                <tbody className="text-[13px]">
                  {filteredFunds.map((fund) => {
                    const isFundExpanded = expandedFund === fund.folioNo;
                    
                    return (
                      <React.Fragment key={fund.folioNo}>
                        {/* Desktop Fund Row */}
                        <tr 
                          className={`group border-b border-slate-100 cursor-pointer transition-all duration-200 ${isFundExpanded ? 'bg-indigo-50/20' : 'hover:bg-slate-50/80'}`}
                          onClick={() => toggleFund(fund.folioNo)}
                        >
                          <td className={`p-4 text-center sticky left-0 z-10 border-r border-slate-100 transition-colors ${isFundExpanded ? 'bg-[#f4f6fb]' : 'bg-white group-hover:bg-[#f8fafc]'}`}>
                            <button className="text-slate-400 hover:text-indigo-600 outline-none">
                              <svg className={`w-4 h-4 transition-transform duration-300 ${isFundExpanded ? 'rotate-90 text-indigo-600' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </td>
                          <td className={`p-4 sticky left-12 z-10 transition-colors ${isFundExpanded ? 'bg-[#f4f6fb]' : 'bg-white group-hover:bg-[#f8fafc]'}`}>
                            <span className="font-bold text-slate-900 block mb-1 truncate w-[320px]">{fund.fundName}</span>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Badge intent="neutral">Folio: {fund.folioNo}</Badge>
                              <Badge intent="neutral">{fund.category}</Badge>
                              {fund.statusTag && (
                                <Badge intent={fund.statusTag === 'Active' ? 'success' : 'danger'}>{fund.statusTag}</Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-slate-500 font-medium tabular-nums">{fund.purchaseDate}</td>
                          <td className="p-4 text-right font-medium text-slate-600 tabular-nums">{formatCurrency(fund.investedCapital)}</td>
                          <td className="p-4 text-right font-bold text-slate-900 tabular-nums">{formatCurrency(fund.currentValue)}</td>
                          <td className="p-4 text-right text-slate-500 tabular-nums">{fund.availableUnits.toFixed(3)}</td>
                          <td className="p-4 text-right tabular-nums">
                            <span className="block text-slate-900 font-bold">{fund.currentNAV}</span>
                            <span className="block text-[10px] text-slate-400 font-medium">Avg: {fund.avgNAV}</span>
                          </td>
                          <td className="p-4 text-right font-medium text-slate-500 tabular-nums">{formatCurrency(fund.dividendPayout)}</td>
                          <td className="p-4 text-right tabular-nums">
                            <span className={`font-bold block ${getColorClass(fund.unrealisedGain)}`}>{formatCurrency(fund.unrealisedGain)}</span>
                            <span className={`text-[10px] font-bold ${getColorClass(fund.unrealisedGainPercent)}`}>{formatPct(fund.unrealisedGainPercent)}</span>
                          </td>
                        </tr>

                        {/* Desktop Expanded Transactions Row - CSS Grid Transition */}
                        <tr className="bg-[#FAFAFA]">
                          <td colSpan={9} className="p-0 border-b border-slate-200/60 shadow-inner">
                            <div className={`grid transition-all duration-300 ease-in-out ${isFundExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                              <div className="overflow-hidden">
                                <div className="p-5 pl-12 border-l-[3px] border-indigo-200 ml-4 my-2">
                                  
                                  <div className="mb-4">
                                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-indigo-700">Transaction Ledger</h4>
                                  </div>

                                  <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
                                    <table className="w-full text-left text-xs">
                                      <thead className="bg-slate-50 text-[9px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100">
                                        <tr>
                                          <th className="p-3 w-[12%]">Date</th>
                                          <th className="p-3 w-[18%]">Type</th>
                                          <th className="p-3 w-[12%] text-right">Amount</th>
                                          <th className="p-3 w-[8%] text-right">STT/Chg</th>
                                          <th className="p-3 w-[10%] text-right">NAV</th>
                                          <th className="p-3 w-[10%] text-right">Units</th>
                                          <th className="p-3 w-[10%] text-right">Bal. Units</th>
                                          <th className="p-3 w-[8%] text-right">Days</th>
                                          <th className="p-3 w-[12%] text-right pr-4">Cap Gain</th>
                                        </tr>
                                      </thead>
                                    </table>
                                    {/* Max 5 Lines scrollable container */}
                                    <div className="max-h-[240px] overflow-y-auto custom-scrollbar">
                                      <table className="w-full text-left text-xs">
                                        <tbody>
                                          {fund.transactions.map((txn, idx) => (
                                            <tr key={txn.id} className={`hover:bg-slate-50/50 transition-colors ${idx !== fund.transactions.length - 1 ? "border-b border-slate-50" : ""}`}>
                                              <td className="p-3 w-[12%] font-medium text-slate-600 tabular-nums">{txn.transactionDate}</td>
                                              <td className="p-3 w-[18%]">
                                                <Badge intent={txn.transactionType.includes('PURCHASE') || txn.transactionType.includes('ADDITIONAL') ? 'brand' : 'neutral'}>{txn.transactionType}</Badge>
                                              </td>
                                              <td className="p-3 w-[12%] text-right font-bold text-slate-800 tabular-nums">{formatCurrency(Math.abs(txn.amount))}</td>
                                              <td className="p-3 w-[8%] text-right text-slate-400 tabular-nums">{txn.sttCharges}</td>
                                              <td className="p-3 w-[10%] text-right text-slate-600 font-medium tabular-nums">{txn.nav}</td>
                                              <td className="p-3 w-[10%] text-right text-slate-600 font-medium tabular-nums">{txn.units}</td>
                                              <td className="p-3 w-[10%] text-right text-slate-600 font-medium tabular-nums">{txn.balanceUnits}</td>
                                              <td className="p-3 w-[8%] text-right text-slate-400 tabular-nums">{txn.holdingDays}</td>
                                              <td className={`p-3 w-[12%] text-right font-bold tabular-nums pr-4 ${getColorClass(txn.capitalGain)}`}>{txn.capitalGain !== 0 ? formatCurrency(txn.capitalGain) : '-'}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scrollbars and Keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(241, 245, 249, 0.5); 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8; 
        }

        /* Hide scrollbar for mobile horizontal scroll elements */
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
        }
      `}} />
    </div>
  );
}