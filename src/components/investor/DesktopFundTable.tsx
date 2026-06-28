"use client";

import React, { useState } from 'react';
import { UnifiedFund } from '@/types/investor';
import { formatCurrency, formatPercent, getStatusColor } from '@/lib/utils';
import Badge from './Badge';
import { BarChart2 } from 'lucide-react';

export default function DesktopFundTable({ funds, onOpenAnalytics }: { funds: UnifiedFund[], onOpenAnalytics?: (fund: UnifiedFund) => void }) {
  const [expandedFund, setExpandedFund] = useState<string | null>(null);

  const toggleFund = (id: string) => {
    if (expandedFund === id) {
      setExpandedFund(null);
    } else {
      setExpandedFund(id);
    }
  };

  return (
    <div
      className="rounded-md border relative h-full flex flex-col overflow-hidden"
      style={{ backgroundColor: 'var(--fin-table-bg)', borderColor: 'var(--fin-table-border)', boxShadow: '0 8px 30px var(--fin-table-shadow)' }}
    >
      <div className="flex-1 overflow-auto table-scrollbar">
        <table className="w-full text-left border-collapse min-w-[1400px]">
          <thead className="sticky top-0 z-30 shadow-sm ring-1 ring-[var(--fin-input-ring-focus)]/50">
            <tr className="text-[10px] uppercase tracking-widest font-bold" style={{ backgroundColor: 'var(--fin-table-header-bg)', color: 'var(--fin-table-header-text)' }}>
              <th className="px-3 py-4 w-12 sticky left-0 z-40 border-r bg-[var(--fin-table-header-bg)]" style={{ borderColor: 'var(--fin-table-header-border)' }}></th>
              <th className="px-3 py-4 w-[280px] sticky left-12 z-40 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] bg-[var(--fin-table-header-bg)]" style={{ borderColor: 'var(--fin-table-header-border)' }}>Fund Details</th>
              <th className="px-3 py-4">Purch. Date</th>
              <th className="px-3 py-4 text-right">Inv. Capital</th>
              <th className="px-3 py-4 text-right">Current Val</th>
              <th className="px-3 py-4 text-right">Units</th>
              <th className="px-3 py-4 text-right">NAV (Cur/Avg)</th>
              <th className="px-3 py-4 text-right">Dividend</th>
              <th className="px-3 py-4 text-right">Unrealised Gain</th>
              <th className="px-4 py-4 text-center w-28">Action</th>
            </tr>
          </thead>
          <tbody className="text-[13px]">
            {(!funds || funds.length === 0) ? (
              <tr>
                <td colSpan={10} className="p-12 text-center bg-[var(--fin-table-bg)]">
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-16 h-16 bg-[var(--fin-page-bg)] rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-[var(--fin-aux-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-[var(--fin-heading-primary)] mb-1">No Funds Found</h3>
                    <p className="text-[var(--fin-muted-text)] text-sm max-w-sm">
                      We couldn't find any funds matching your current filters. Try clearing your filters or selecting a different category.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              funds.map((fund) => {
                const isFundExpanded = expandedFund === fund.folioNo;
                
                return (
                  <React.Fragment key={fund.folioNo}>
                    <tr 
                      className={`group border-b cursor-pointer transition-colors duration-200 ${isFundExpanded ? 'bg-[var(--fin-table-expanded-bg)]' : 'hover:bg-[var(--fin-table-row-hover-bg)]'}`}
                      style={{ borderColor: 'var(--fin-table-row-border)' }}
                      onClick={() => toggleFund(fund.folioNo)}
                    >
                      <td className={`px-3 py-4 text-center sticky left-0 z-10 border-r transition-colors ${isFundExpanded ? 'bg-[var(--fin-table-expanded-bg)]' : 'bg-[var(--fin-table-bg)] group-hover:bg-[var(--fin-table-row-hover-bg)]'}`} style={{ borderColor: 'var(--fin-table-sticky-border)' }}>
                        <button className="text-[var(--fin-aux-text)] hover:text-[var(--fin-brand-600)] outline-none">
                          <svg className={`w-4 h-4 transition-transform duration-300 ${isFundExpanded ? 'rotate-90 text-[var(--fin-brand-600)]' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </td>
                      <td className={`px-3 py-4 sticky left-12 z-10 border-r transition-colors ${isFundExpanded ? 'bg-[var(--fin-table-expanded-bg)]' : 'bg-[var(--fin-table-bg)] group-hover:bg-[var(--fin-table-row-hover-bg)]'}`} style={{ borderColor: 'var(--fin-table-sticky-border)' }}>
                        <span className="font-bold text-[var(--fin-heading-primary)] block mb-1.5 truncate w-[260px]">{fund.fundName}</span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge intent="neutral">Folio: {fund.folioNo}</Badge>
                          <Badge intent="neutral">{fund.category}</Badge>
                          {fund.statusTag && (
                            <Badge intent={fund.statusTag === 'Active' ? 'success' : 'danger'}>{fund.statusTag}</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-[var(--fin-muted-text)] font-medium tabular-nums">{fund.purchaseDate}</td>
                      <td className="px-3 py-4 text-right font-medium text-[var(--fin-body-text)] tabular-nums">{formatCurrency(fund.investedCapital)}</td>
                      <td className="px-3 py-4 text-right font-bold text-[var(--fin-heading-primary)] tabular-nums">{formatCurrency(fund.currentValue)}</td>
                      <td className="px-3 py-4 text-right text-[var(--fin-muted-text)] tabular-nums">{fund.availableUnits.toFixed(3)}</td>
                      <td className="px-3 py-4 text-right tabular-nums">
                        <span className="block text-[var(--fin-heading-primary)] font-bold">{fund.currentNAV}</span>
                        <span className="block text-[10px] text-[var(--fin-aux-text)] font-medium mt-0.5">Avg: {fund.avgNAV}</span>
                      </td>
                      <td className="px-3 py-4 text-right font-medium text-[var(--fin-muted-text)] tabular-nums">{formatCurrency(fund.dividendPayout)}</td>
                      <td className="px-3 py-4 text-right tabular-nums">
                        <span className={`font-bold block ${getStatusColor(fund.unrealisedGain)}`}>{formatCurrency(fund.unrealisedGain)}</span>
                        <span className={`text-[10px] font-bold mt-0.5 inline-block px-1.5 py-0.5 rounded ${fund.unrealisedGainPercent >= 0 ? 'bg-[var(--fin-badge-success-bg)] text-[var(--fin-badge-success-text)]' : 'bg-[var(--fin-badge-danger-bg)] text-[var(--fin-badge-danger-text)]'}`}>
                          {formatPercent(fund.unrealisedGainPercent)}
                        </span>
                      </td>
                      
                      {/* ─── NEW ANALYTICS COLUMN ─── */}
                      <td className="px-4 py-4 text-center">
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            onOpenAnalytics?.(fund); 
                          }} 
                          className="inline-flex items-center justify-center gap-1.5 text-[10px] font-bold text-[var(--fin-brand-700)] hover:text-[var(--fin-btn-primary-text)] hover:bg-[var(--fin-brand-600)] bg-[var(--fin-brand-50)] border border-[var(--fin-brand-200)]/60 px-2.5 py-1.5 rounded-md transition-all uppercase tracking-widest shadow-sm active:scale-95"
                        >
                          <BarChart2 className="w-3.5 h-3.5" /> Analytics
                        </button>
                      </td>
                    </tr>

                    {/* Desktop Expanded Transactions Row */}
                    <tr className="bg-[var(--fin-table-expanded-bg)]">
                      <td colSpan={10} className="p-0 border-b" style={{ borderColor: 'var(--fin-table-expanded-border)' }}>
                        <div className={`grid transition-all duration-300 ease-in-out ${isFundExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                          <div className="overflow-hidden">
                            <div className="p-5 pl-12 border-l-[3px] border-[var(--fin-brand-300)] ml-4 my-3">
                              
                              <div className="mb-3 flex items-center justify-between">
                                <h4 className="text-[11px] font-bold uppercase tracking-widest text-[var(--fin-brand-700)] flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  Transaction Ledger
                                </h4>
                              </div>

                              <div className="bg-[var(--fin-table-bg)] rounded-md border border-[var(--fin-border)] shadow-sm overflow-hidden flex flex-col">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-[var(--fin-page-bg)]/80 text-[9px] uppercase tracking-widest text-[var(--fin-muted-text)] font-bold border-b border-[var(--fin-border)]/80">
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
                                <div className="max-h-[240px] overflow-y-auto inner-scrollbar">
                                  <table className="w-full text-left text-xs">
                                    <tbody>
                                      {fund.transactions.map((txn, idx) => (
                                        <tr key={txn.id} className={`hover:bg-[var(--fin-table-row-hover-bg)] transition-colors ${idx !== fund.transactions.length - 1 ? "border-b" : ""}`} style={{ borderColor: 'var(--fin-table-row-border)' }}>
                                          <td className="p-3 w-[12%] font-medium text-[var(--fin-body-text)] tabular-nums">{txn.transactionDate}</td>
                                          <td className="p-3 w-[18%]">
                                            <Badge intent={txn.transactionType.includes('PURCHASE') || txn.transactionType.includes('ADDITIONAL') || txn.transactionType.includes('SIP') || txn.transactionType.includes('SIN') ? 'brand' : 'neutral'}>{txn.transactionType}</Badge>
                                          </td>
                                          <td className="p-3 w-[12%] text-right font-bold text-[var(--fin-heading-tertiary)] tabular-nums">{formatCurrency(Math.abs(txn.amount))}</td>
                                          <td className="p-3 w-[8%] text-right text-[var(--fin-aux-text)] tabular-nums">{txn.sttCharges}</td>
                                          <td className="p-3 w-[10%] text-right text-[var(--fin-body-text)] font-medium tabular-nums">{txn.nav}</td>
                                          <td className="p-3 w-[10%] text-right text-[var(--fin-body-text)] font-medium tabular-nums">{txn.units}</td>
                                          <td className="p-3 w-[10%] text-right text-[var(--fin-body-text)] font-medium tabular-nums">{txn.balanceUnits}</td>
                                          <td className="p-3 w-[8%] text-right text-[var(--fin-aux-text)] tabular-nums">{txn.holdingDays}</td>
                                          <td className={`p-3 w-[12%] text-right font-bold tabular-nums pr-4 ${getStatusColor(txn.capitalGain)}`}>{txn.capitalGain !== 0 ? formatCurrency(txn.capitalGain) : '-'}</td>
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
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}