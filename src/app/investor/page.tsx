"use client";

import React, { useState, useMemo } from 'react';

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

// --- Diverse Dummy Data ---
const MOCK_PORTFOLIOS: ClientPortfolio[] = [
  {
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
          { id: "t2", transactionDate: "26/09/2024", transactionType: "ADDITIONAL PURCHASE", amount: 200000, sttCharges: 0.10, nav: 171.68, units: 1165.183, balanceUnits: 2341.653, holdingDays: 170, capitalGain: 0 },
        ]
      },
      {
        folioNo: "HDFC-112233", fundName: "HDFC Corporate Bond Fund", purchaseDate: "15/01/2023", totalCapital: 1306000, investedCapital: 1306000, currentValue: 1302318, availableUnits: 45000.5, currentNAV: 28.94, avgNAV: 29.02, dividendPayout: 0, unrealisedGain: -3682, unrealisedGainPercent: -0.28, realisedGain: 0, statusTag: "Active", category: "Debt", amc: "HDFC", securityType: "Bond",
        transactions: [
          { id: "t3", transactionDate: "15/01/2023", transactionType: "PURCHASE", amount: 1306000, sttCharges: 0, nav: 29.02, units: 45000.5, balanceUnits: 45000.5, holdingDays: 780, capitalGain: 0 },
        ]
      }
    ]
  }
];

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
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set(["c1"]));
  const [expandedFunds, setExpandedFunds] = useState<Set<string>>(new Set());
  const [activeFundTabs, setActiveFundTabs] = useState<Record<string, 'portfolio' | 'transactions'>>({});
  
  const [activeFilterType, setActiveFilterType] = useState<string>("All");
  const [activeFilterValue, setActiveFilterValue] = useState<string>("All");

  const toggleClient = (id: string) => {
    const newSet = new Set(expandedClients);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setExpandedClients(newSet);
  };

  const toggleFund = (id: string) => {
    const newSet = new Set(expandedFunds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
      if (!activeFundTabs[id]) setActiveFundTabs(prev => ({ ...prev, [id]: 'transactions' }));
    }
    setExpandedFunds(newSet);
  };

  const filterOptions = useMemo(() => {
    const options = new Set<string>();
    MOCK_PORTFOLIOS.forEach(client => {
      client.funds.forEach(fund => {
        if (activeFilterType === "By Category/Industry") options.add(fund.category);
        if (activeFilterType === "By AMC/Issuer") options.add(fund.amc);
        if (activeFilterType === "By Asset" || activeFilterType === "By Security") options.add(fund.securityType);
        if (activeFilterType === "By Tag" && fund.statusTag) options.add(fund.statusTag);
      });
    });
    return Array.from(options);
  }, [activeFilterType]);

  const getColorClass = (val: number) => val > 0 ? 'text-emerald-600' : val < 0 ? 'text-rose-600' : 'text-slate-500';
  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  const formatPct = (val: number) => `${val > 0 ? '+' : ''}${val.toFixed(2)}%`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 font-sans relative selection:bg-primary/20 selection:text-primary pb-24">
      {/* Background matching Login Page */}
      <div className="absolute inset-0 z-0 opacity-[0.35] bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      
      <div className="relative z-10 px-4 sm:px-8 lg:px-12 py-8 max-w-[1800px] mx-auto space-y-8 animate-[fadeIn_0.5s_ease-out]">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              Portfolio <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-600 to-primary/80">Overview</span>
            </h1>
            <p className="text-slate-500 font-medium mt-1">Holistic view of your capital allocation and performance.</p>
          </div>
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200/60 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">Live Sync</span>
          </div>
        </div>

        {/* Global Stats Ribbon - Horizontal Scrollable */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-sm overflow-x-auto custom-scrollbar">
          <div className="flex w-max min-w-full divide-x divide-slate-100 p-2">
            {[
              { label: "Invested Capital", value: "₹25,56,000" },
              { label: "Current Value", value: "₹26,24,197", highlight: true },
              { label: "Unrealised Gains", value: "₹68,197", sub: "(+2.66%)", valNum: 68197 },
              { label: "Realised Gains", value: "₹25,000", valNum: 25000 },
              { label: "Dividend Payout", value: "₹12,000", valNum: 12000 },
              { label: "Net P&L", value: "₹93,197", valNum: 93197 },
              { label: "XIRR / ABS", value: "11.2%", valNum: 11.2 },
            ].map((stat, idx) => (
              <div key={idx} className="flex-1 px-6 py-4 min-w-[160px]">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <p className={`text-xl font-black tabular-nums tracking-tight ${stat.highlight ? 'text-primary' : (stat.valNum !== undefined ? getColorClass(stat.valNum) : 'text-slate-900')}`}>
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

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/60 backdrop-blur-md p-2 rounded-2xl border border-slate-200/60 shadow-sm">
          <div className="flex flex-wrap items-center gap-1.5 p-1">
            {["All", "By Asset", "By Category/Industry", "By AMC/Issuer", "By Tag"].map((filter) => (
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
            Avg Holding: <span className="text-slate-800">322 Days</span>
          </div>
        </div>

        {/* Main Data Table Area */}
        <div className="bg-white/95 backdrop-blur-3xl rounded-[1.5rem] border border-slate-200/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] overflow-hidden relative">
          
          {/* Horizontal Scroll Container */}
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1500px]">
              
              {/* Main Header */}
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                  {/* STICKY COLUMNS: These float above the scrolling content */}
                  <th className="p-4 w-12 sticky left-0 z-20 bg-slate-50 border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]"></th>
                  <th className="p-4 w-[300px] sticky left-12 z-20 bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Client Name</th>
                  
                  <th className="p-4 text-right">Total Capital</th>
                  <th className="p-4 text-right">Invested Capital</th>
                  <th className="p-4 text-right">Current Value</th>
                  <th className="p-4 text-right">Dividend</th>
                  <th className="p-4 text-right">Unrealised Gain</th>
                  <th className="p-4 text-right">Realised Gain</th>
                  <th className="p-4 text-right">Net P&L</th>
                  <th className="p-4 text-right">Today's Gain</th>
                  <th className="p-4 text-right">XIRR</th>
                </tr>
              </thead>
              
              <tbody className="text-[13px]">
                {MOCK_PORTFOLIOS.map((client) => {
                  const isClientExpanded = expandedClients.has(client.id);
                  const filteredFunds = client.funds.filter(fund => {
                    if (activeFilterType === "All" || activeFilterValue === "All") return true;
                    if (activeFilterType === "By Category/Industry") return fund.category === activeFilterValue;
                    if (activeFilterType === "By AMC/Issuer") return fund.amc === activeFilterValue;
                    if (activeFilterType === "By Asset") return fund.securityType === activeFilterValue;
                    if (activeFilterType === "By Tag") return fund.statusTag === activeFilterValue;
                    return true;
                  });

                  if (activeFilterType !== "All" && activeFilterValue !== "All" && filteredFunds.length === 0) return null;

                  return (
                    <React.Fragment key={client.id}>
                      {/* LEVEL 1 ROW: Portfolio */}
                      <tr 
                        className={`group border-b border-slate-100 cursor-pointer transition-all duration-200 ${isClientExpanded ? 'bg-indigo-50/20' : 'hover:bg-slate-50/80'}`}
                        onClick={() => toggleClient(client.id)}
                      >
                        {/* STICKY COLUMNS for Row */}
                        <td className={`p-4 text-center sticky left-0 z-10 border-r border-slate-100 transition-colors ${isClientExpanded ? 'bg-[#f4f6fb]' : 'bg-white group-hover:bg-[#f8fafc]'}`}>
                          <button className="text-slate-400 hover:text-primary transition-colors outline-none">
                            <svg className={`w-4 h-4 transition-transform duration-300 ${isClientExpanded ? 'rotate-90 text-primary' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </td>
                        <td className={`p-4 font-black text-slate-900 sticky left-12 z-10 transition-colors ${isClientExpanded ? 'bg-[#f4f6fb]' : 'bg-white group-hover:bg-[#f8fafc]'}`}>
                          <div className="truncate w-[280px]">{client.clientName}</div>
                        </td>
                        
                        <td className="p-4 text-right font-medium text-slate-500 tabular-nums">{formatCurrency(client.totalCapital)}</td>
                        <td className="p-4 text-right font-medium text-slate-500 tabular-nums">{formatCurrency(client.investedCapital)}</td>
                        <td className="p-4 text-right font-bold text-slate-900 tabular-nums">{formatCurrency(client.currentValue)}</td>
                        <td className="p-4 text-right font-medium text-slate-500 tabular-nums">{formatCurrency(client.dividendPayout)}</td>
                        <td className="p-4 text-right tabular-nums">
                          <span className={`font-bold block ${getColorClass(client.unrealisedGain)}`}>{formatCurrency(client.unrealisedGain)}</span>
                          <span className={`text-[10px] font-bold ${getColorClass(client.unrealisedGainPercent)}`}>{formatPct(client.unrealisedGainPercent)}</span>
                        </td>
                        <td className={`p-4 text-right font-bold tabular-nums ${getColorClass(client.realisedGain)}`}>{formatCurrency(client.realisedGain)}</td>
                        <td className={`p-4 text-right font-bold tabular-nums ${getColorClass(client.netPL)}`}>{formatCurrency(client.netPL)}</td>
                        <td className={`p-4 text-right font-bold tabular-nums ${getColorClass(client.todaysGain)}`}>{formatCurrency(client.todaysGain)}</td>
                        <td className={`p-4 text-right font-black tabular-nums ${getColorClass(client.xirr)}`}>{client.xirr}%</td>
                      </tr>

                      {/* LEVEL 2 & 3 CONTAINER */}
                      {isClientExpanded && (
                        <tr>
                          {/* Colspan spans entire table to keep scroll aligned */}
                          <td colSpan={11} className="p-0 bg-slate-50/50 shadow-inner">
                            <div className="pl-14 pr-6 py-4 border-l-[3px] border-indigo-400/40 ml-4 animate-[fadeIn_0.2s_ease-out]">
                              
                              <table className="w-full text-left bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
                                <thead>
                                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[9px] uppercase tracking-widest text-slate-400 font-bold">
                                    <th className="p-3 w-10 text-center"></th>
                                    <th className="p-3">Fund Details</th>
                                    <th className="p-3">Purch. Date</th>
                                    <th className="p-3 text-right">Inv. Capital</th>
                                    <th className="p-3 text-right">Current Val</th>
                                    <th className="p-3 text-right">Units</th>
                                    <th className="p-3 text-right">NAV (Cur/Avg)</th>
                                    <th className="p-3 text-right">Unrealised Gain</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {filteredFunds.map((fund) => {
                                    const isFundExpanded = expandedFunds.has(fund.folioNo);
                                    
                                    return (
                                      <React.Fragment key={fund.folioNo}>
                                        {/* LEVEL 2 ROW: Funds */}
                                        <tr 
                                          className={`border-b border-slate-50 cursor-pointer transition-colors hover:bg-slate-50/80 ${isFundExpanded ? 'bg-indigo-50/10' : ''}`}
                                          onClick={() => toggleFund(fund.folioNo)}
                                        >
                                          <td className="p-3 text-center align-top pt-4">
                                            <button className="text-slate-400 hover:text-primary outline-none">
                                              <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${isFundExpanded ? 'rotate-90 text-primary' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                              </svg>
                                            </button>
                                          </td>
                                          <td className="p-3">
                                            <span className="font-bold text-slate-800 block mb-1">{fund.fundName}</span>
                                            <div className="flex flex-wrap items-center gap-1.5">
                                              <Badge intent="neutral">Folio: {fund.folioNo}</Badge>
                                              <Badge intent="neutral">{fund.category}</Badge>
                                              {fund.statusTag && (
                                                <Badge intent={fund.statusTag === 'Active' ? 'success' : 'danger'}>{fund.statusTag}</Badge>
                                              )}
                                            </div>
                                          </td>
                                          <td className="p-3 text-slate-500 font-medium tabular-nums">{fund.purchaseDate}</td>
                                          <td className="p-3 text-right font-medium text-slate-600 tabular-nums">{formatCurrency(fund.investedCapital)}</td>
                                          <td className="p-3 text-right font-bold text-slate-800 tabular-nums">{formatCurrency(fund.currentValue)}</td>
                                          <td className="p-3 text-right text-slate-500 tabular-nums">{fund.availableUnits.toFixed(3)}</td>
                                          <td className="p-3 text-right tabular-nums">
                                            <span className="block text-slate-800 font-bold">{fund.currentNAV}</span>
                                            <span className="block text-[10px] text-slate-400 font-medium">Avg: {fund.avgNAV}</span>
                                          </td>
                                          <td className="p-3 text-right tabular-nums">
                                            <span className={`font-bold block ${getColorClass(fund.unrealisedGain)}`}>{formatCurrency(fund.unrealisedGain)}</span>
                                            <span className={`text-[10px] font-bold ${getColorClass(fund.unrealisedGainPercent)}`}>{formatPct(fund.unrealisedGainPercent)}</span>
                                          </td>
                                        </tr>

                                        {/* LEVEL 3: Transactions */}
                                        {isFundExpanded && (
                                          <tr className="bg-[#FAFAFA]">
                                            <td colSpan={8} className="p-0 border-b border-slate-200/60">
                                              <div className="p-5 pl-12 border-l-[3px] border-indigo-200 ml-4 my-2">
                                                
                                                <div className="flex border-b border-slate-200 mb-4 gap-6">
                                                  <button onClick={(e) => { e.stopPropagation(); setActiveFundTabs(prev => ({...prev, [fund.folioNo]: 'portfolio'})) }} className={`pb-2 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-colors ${activeFundTabs[fund.folioNo] === 'portfolio' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Portfolio Overview</button>
                                                  <button onClick={(e) => { e.stopPropagation(); setActiveFundTabs(prev => ({...prev, [fund.folioNo]: 'transactions'})) }} className={`pb-2 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-colors ${activeFundTabs[fund.folioNo] === 'transactions' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Transaction Ledger</button>
                                                </div>

                                                {activeFundTabs[fund.folioNo] === 'transactions' ? (
                                                  <div className="bg-white rounded-lg border border-slate-200/60 overflow-hidden shadow-sm">
                                                    <table className="w-full text-left text-xs">
                                                      <thead className="bg-slate-50 text-[9px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100">
                                                        <tr>
                                                          <th className="p-3">Date</th>
                                                          <th className="p-3">Type</th>
                                                          <th className="p-3 text-right">Amount</th>
                                                          <th className="p-3 text-right">STT & Chg</th>
                                                          <th className="p-3 text-right">NAV</th>
                                                          <th className="p-3 text-right">Units</th>
                                                          <th className="p-3 text-right">Bal. Units</th>
                                                          <th className="p-3 text-right">Days</th>
                                                          <th className="p-3 text-right">Cap Gain</th>
                                                        </tr>
                                                      </thead>
                                                      <tbody>
                                                        {fund.transactions.map((txn, idx) => (
                                                          <tr key={txn.id} className={`hover:bg-slate-50/50 transition-colors ${idx !== fund.transactions.length - 1 ? "border-b border-slate-50" : ""}`}>
                                                            <td className="p-3 font-medium text-slate-600 tabular-nums">{txn.transactionDate}</td>
                                                            <td className="p-3">
                                                              <Badge intent={txn.transactionType.includes('PURCHASE') ? 'brand' : 'neutral'}>{txn.transactionType}</Badge>
                                                            </td>
                                                            <td className="p-3 text-right font-bold text-slate-800 tabular-nums">{formatCurrency(txn.amount)}</td>
                                                            <td className="p-3 text-right text-slate-400 tabular-nums">{txn.sttCharges}</td>
                                                            <td className="p-3 text-right text-slate-600 font-medium tabular-nums">{txn.nav}</td>
                                                            <td className="p-3 text-right text-slate-600 font-medium tabular-nums">{txn.units}</td>
                                                            <td className="p-3 text-right text-slate-600 font-medium tabular-nums">{txn.balanceUnits}</td>
                                                            <td className="p-3 text-right text-slate-400 tabular-nums">{txn.holdingDays}</td>
                                                            <td className={`p-3 text-right font-bold tabular-nums ${getColorClass(txn.capitalGain)}`}>{txn.capitalGain !== 0 ? formatCurrency(txn.capitalGain) : '-'}</td>
                                                          </tr>
                                                        ))}
                                                      </tbody>
                                                    </table>
                                                  </div>
                                                ) : (
                                                  <div className="text-xs text-slate-400 py-6 font-medium text-center bg-white rounded-lg border border-slate-100 border-dashed">
                                                    Additional portfolio metrics for {fund.folioNo} will be displayed here.
                                                  </div>
                                                )}
                                              </div>
                                            </td>
                                          </tr>
                                        )}
                                      </React.Fragment>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Scrollbar overrides and Keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(241, 245, 249, 0.5); /* slate-100 */
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1; /* slate-300 */
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8; /* slate-400 */
        }
      `}} />
    </div>
  );
}