"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { distributorService } from '@/services/distributor.service';
import GlobalStatsRibbon from '@/components/investor/GlobalStatsRibbon';
import { ChevronLeft, ChevronRight, Loader2, PieChart, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency, formatCompactNumber } from '@/lib/utils';

// We import the types needed to normalize the data for the Ribbon
import { ClientPortfolio, UnifiedFund, Transaction } from '@/types/investor';

interface ClientHoldingsViewProps {
  clientId: string;
  onBack: () => void;
}

export default function ClientHoldingsView({ clientId, onBack }: ClientHoldingsViewProps) {
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // 1. Fetch Data
  useEffect(() => {
    const fetchHoldings = async () => {
      setIsLoading(true);
      try {
        const res = await distributorService.getClientPortfolio(clientId);
        if (res.success && res.data) {
          setPortfolioData(res.data);
        } else {
          setError(res.message || "Failed to fetch holdings.");
        }
      } catch (err: any) {
        console.error("Error fetching holdings:", err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHoldings();
  }, [clientId]);

  // 2. Normalize Data for the GlobalStatsRibbon
  const normalizedPortfolio = useMemo((): ClientPortfolio | null => {
    if (!portfolioData) return null;
    const d = portfolioData; 
    
    return {
      id: clientId,
      clientName: d.investor_name || "Investor",
      totalCapital: d.total_capital || 0,
      investedCapital: d.invested_capital || 0,
      currentValue: d.current_value || 0,
      dividendPayout: d.dividend_payout || 0,
      unrealisedGain: (d.unrealised_gains_lt || 0) + (d.unrealised_gains_st || 0) || 0,
      unrealisedGainPercent: d.abs_percent || 0,
      realisedGain: (d.realised_gains_lt || 0) + (d.realised_gains_st || 0) || 0,
      netPL: d.current_value - d.total_capital || 0,
      todaysGain: d.todays_pnl || 0,
      todaysGainPercent: d.todays_pnl_percent || 0,
      xirr: d.xirr_percent || 0,
      abs: d.abs_percent || 0,
      avgHoldingDays: 0,
      funds: [] // The Ribbon only uses top-level stats, so empty array is safe here
    } as unknown as ClientPortfolio;
  }, [portfolioData, clientId]);

  const funds = portfolioData?.funds || [];

  return (
    <div className="flex flex-col h-full relative z-10 animate-in slide-in-from-right-4 fade-in duration-300">
      
      {/* Header & Back Button */}
      <div className="shrink-0 mb-4 lg:mb-6">
        <button 
          onClick={onBack} 
          className="flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors mb-3 md:mb-4 w-fit"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Investors List
        </button>
        <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 mb-1">
          {portfolioData?.investor_name ? (
             <>{portfolioData.investor_name}'s <span className="text-emerald-600">Portfolio</span></>
          ) : (
             <>Client <span className="text-emerald-600">Portfolio</span></>
          )}
        </h1>
        <p className="text-slate-500 font-medium text-xs lg:text-sm truncate">
          View detailed mutual fund holdings and transaction history securely.
        </p>
      </div>

      {/* Global Stats Ribbon (KPIs) */}
      {normalizedPortfolio && (
        <div className="shrink-0 mb-4 lg:mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100 fill-both">
          <GlobalStatsRibbon client={normalizedPortfolio} />
        </div>
      )}

      {/* Main Table Area */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-both">
        {isLoading ? (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-50 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-sm font-bold text-slate-500">Loading portfolio securely...</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
             <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mb-3">
               <PieChart className="w-6 h-6 text-rose-300" />
             </div>
             <p className="text-rose-600 font-bold mb-1">Error Loading Portfolio</p>
             <p className="text-sm text-slate-500 max-w-sm">{error}</p>
          </div>
        ) : funds.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
              <PieChart className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-base font-bold text-slate-600">No Holdings Found</p>
            <p className="text-xs font-medium text-slate-400 max-w-sm mt-1">This investor does not currently have any active mutual fund holdings.</p>
          </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-auto table-scrollbar">
            <table className="w-full text-left text-sm min-w-[900px] border-separate border-spacing-0">
              <thead className="bg-slate-50/90 backdrop-blur-sm border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-500 font-black sticky top-0 z-20 shadow-sm ring-1 ring-slate-200/50">
                <tr>
                  <th className="p-3 w-10 border-b border-slate-200"></th>
                  <th className="py-4 border-b border-slate-200">Scheme Name & Folio</th>
                  <th className="p-4 text-right border-b border-slate-200">Units & NAV</th>
                  <th className="p-4 text-right border-b border-slate-200">Invested Value</th>
                  <th className="p-4 text-right border-b border-slate-200">Current Value</th>
                  <th className="p-4 text-right pr-6 border-b border-slate-200">Returns (XIRR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {funds.map((fund: any, i: number) => {
                  const isExpanded = expandedRow === i;
                  const schemeName = fund.fund_name || 'N/A';
                  const folio = fund.folio_number || 'N/A';
                  const invested = fund.total_capital || 0;
                  const current = fund.current_value || 0;
                  const netPnl = fund.net_pnl || 0;
                  const xirr = fund.xirr_percent || 0;
                  const isPositive = netPnl >= 0;
                  const transactions = fund.transactions || [];

                  return (
                    <React.Fragment key={i}>
                      {/* Main Fund Row */}
                      <tr 
                        onClick={() => setExpandedRow(isExpanded ? null : i)}
                        className={`cursor-pointer transition-colors duration-200 group border-b border-slate-100 ${isExpanded ? 'bg-emerald-50/30' : 'hover:bg-slate-50/80'}`}
                      >
                        <td className={`p-3 text-center border-b border-slate-100 transition-colors ${isExpanded ? 'bg-[#f0fdf4]' : 'bg-white group-hover:bg-[#f8fafc]'}`}>
                          <button className="text-slate-400 group-hover:text-emerald-600 outline-none p-1 rounded-md group-hover:bg-emerald-100/50 transition-colors">
                            <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-emerald-600' : 'rotate-0'}`} />
                          </button>
                        </td>
                        <td className="py-4 border-b border-slate-100 transition-colors pr-4">
                          <p className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors mb-0.5 text-xs max-w-[280px] leading-tight">
                            {schemeName}
                          </p>
                          <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold font-mono tracking-wide">
                            Folio: {folio}
                          </span>
                        </td>
                        <td className="p-4 text-right border-b border-slate-100 transition-colors">
                          <p className="font-bold text-slate-700 tabular-nums text-xs mb-0.5">{fund.available_units?.toFixed(3) || '0'}</p>
                          <p className="text-[10px] font-medium text-slate-400 tabular-nums">NAV: ₹{fund.current_nav || 0}</p>
                        </td>
                        <td className="p-4 text-right border-b border-slate-100 transition-colors">
                          <p className="font-medium text-slate-600 tabular-nums text-sm">
                            {formatCurrency(invested)}
                          </p>
                        </td>
                        <td className="p-4 text-right border-b border-slate-100 transition-colors">
                          <p className="font-black text-slate-900 tabular-nums text-sm">
                            {formatCurrency(current)}
                          </p>
                        </td>
                        <td className="p-4 text-right border-b border-slate-100 transition-colors pr-6">
                          <div className="flex flex-col items-end">
                            <div className={`flex items-center gap-0.5 text-xs font-black ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                              {xirr}%
                            </div>
                            <span className={`text-[10px] font-bold mt-0.5 tabular-nums ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {formatCurrency(netPnl)}
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Transactions Row */}
                      <tr className="bg-slate-50/40">
                        <td colSpan={6} className="p-0 border-b border-slate-200/60">
                          <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                            <div className="overflow-hidden">
                              <div className="p-4 pl-14 pr-6">
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Transaction History</h4>
                                    <p className="text-[10px] font-bold text-slate-400">{transactions.length} entries</p>
                                  </div>
                                  
                                  {transactions.length > 0 ? (
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-left text-xs">
                                        <thead className="bg-white border-b border-slate-100 text-[9px] uppercase tracking-widest text-slate-400 font-bold">
                                          <tr>
                                            <th className="p-3 pl-4">Date</th>
                                            <th className="p-3">Type</th>
                                            <th className="p-3 text-right">Amount</th>
                                            <th className="p-3 text-right">NAV</th>
                                            <th className="p-3 text-right pr-4">Units</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                          {transactions.map((t: any, tid: number) => (
                                            <tr key={tid} className="hover:bg-slate-50/50 transition-colors">
                                              <td className="p-3 pl-4 text-slate-600 font-medium whitespace-nowrap">
                                                {t.transaction_date ? new Date(t.transaction_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric'}) : 'N/A'}
                                              </td>
                                              <td className="p-3 text-slate-700 font-bold max-w-[200px] truncate" title={t.transaction_type}>
                                                {t.transaction_type || 'Unknown'}
                                              </td>
                                              <td className="p-3 text-right font-black text-slate-900 tabular-nums whitespace-nowrap">
                                                {formatCurrency(t.amount || 0)}
                                              </td>
                                              <td className="p-3 text-right text-slate-500 font-medium tabular-nums">
                                                ₹{t.nav || 0}
                                              </td>
                                              <td className="p-3 text-right text-emerald-600 font-bold tabular-nums pr-4">
                                                +{t.units?.toFixed(3) || '0'}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    <div className="p-6 text-center text-slate-400 text-xs font-medium">
                                      No transactions recorded for this fund.
                                    </div>
                                  )}
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
        )}
      </div>
    </div>
  );
}