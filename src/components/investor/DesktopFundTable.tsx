"use client";

import React, { useState } from 'react';
import { UnifiedFund } from '@/types/investor';
import { formatCurrency, formatPct, getColorClass } from '@/lib/utils';
import Badge from './Badge';

export default function DesktopFundTable({ funds }: { funds: UnifiedFund[] }) {
  const [expandedFund, setExpandedFund] = useState<string | null>(null);

  const toggleFund = (id: string) => {
    if (expandedFund === id) {
      setExpandedFund(null);
    } else {
      setExpandedFund(id);
    }
  };

  return (
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
            {funds.map((fund) => {
              const isFundExpanded = expandedFund === fund.folioNo;
              
              return (
                <React.Fragment key={fund.folioNo}>
                  <tr 
                    className={`group border-b border-slate-100 cursor-pointer transition-all duration-200 ${isFundExpanded ? 'bg-indigo-50/20' : 'hover:bg-slate-50/80'}`}
                    onClick={() => toggleFund(fund.folioNo)}
                  >
                    <td className={`p-4 text-center sticky left-0 z-10 border-r border-slate-100 transition-colors ${isFundExpanded ? 'bg-[#f4f6fb]' : 'bg-white group-hover:bg-[#f8fafc]'}`}>
                      <button className="text-slate-400 hover:text-primary outline-none">
                        <svg className={`w-4 h-4 transition-transform duration-300 ${isFundExpanded ? 'rotate-90 text-primary' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                            
                            <div className="mb-4 flex items-center justify-between">
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
                                          <Badge intent={txn.transactionType.includes('PURCHASE') || txn.transactionType.includes('ADDITIONAL') || txn.transactionType.includes('SIP') ? 'brand' : 'neutral'}>{txn.transactionType}</Badge>
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
  );
}