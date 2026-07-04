"use client";

import React, { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import Badge from '@/components/investor/Badge';

export default function DesktopBrokerageTable({ data, totals }: { data: any[], totals: any }) {
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const toggleUser = (id: string) => {
    if (expandedUser === id) {
      setExpandedUser(null);
    } else {
      setExpandedUser(id);
    }
  };

  const flattenHierarchy = (nodes: any[]): any[] => {
    let flat: any[] = [];
    nodes.forEach(node => {
      flat.push(node);
      if (node.children && node.children.length > 0) {
        flat = flat.concat(flattenHierarchy(node.children));
      }
    });
    return flat;
  };

  const flatData = flattenHierarchy(data);

  return (
    <div className="bg-[var(--fin-table-bg)] rounded-md border border-[var(--fin-border)] shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto table-scrollbar">
        <table className="w-full text-left border-collapse min-w-[1000px] xl:min-w-[1200px]">
          <thead className="sticky top-0 z-30 shadow-sm ring-1 ring-[var(--fin-input-ring-focus)]/50">
            <tr className="bg-[var(--fin-page-bg)] text-[9px] xl:text-[10px] uppercase tracking-widest text-[var(--fin-muted-text)] font-bold">
              <th className="p-3 w-10 sticky left-0 z-40 bg-[var(--fin-page-bg)] border-r border-[var(--fin-border)]/80"></th>
              <th className="p-3 w-[250px] xl:w-[300px] sticky left-10 z-40 bg-[var(--fin-page-bg)] border-r border-[var(--fin-border)]/50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">User Details</th>
              <th className="p-3 text-right bg-[var(--fin-page-bg)]">Gross Rec.</th>
              <th className="p-3 text-right bg-[var(--fin-page-bg)]">Paid (Self)</th>
              <th className="p-3 text-right bg-[var(--fin-page-bg)]">Paid (Sub)</th>
              <th className="p-3 text-right bg-[var(--fin-page-bg)]">Total Paid</th>
              <th className="p-3 text-right bg-[var(--fin-page-bg)] pr-4">Net Rec.</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {(!flatData || flatData.length === 0) ? (
              <tr>
                <td colSpan={7} className="p-10 text-center bg-[var(--fin-table-bg)]">
                  <div className="flex flex-col items-center justify-center py-6">
                    <h3 className="text-base font-bold text-[var(--fin-heading-primary)] mb-1">No Hierarchy Found</h3>
                    <p className="text-[var(--fin-muted-text)] text-xs">Adjust your search parameters.</p>
                  </div>
                </td>
              </tr>
            ) : (
              flatData.map((user) => {
                const isUserExpanded = expandedUser === user.id;
                const totalPaid = user.paid + user.paidSub;
                const netReceivable = user.gross - totalPaid;
                const hasAmc = user.amcBreakdown && user.amcBreakdown.length > 0;
                
                return (
                  <React.Fragment key={user.id}>
                    <tr 
                      className={`group border-b border-[var(--fin-border-subtle)] cursor-pointer transition-colors duration-200 ${isUserExpanded ? 'bg-[var(--fin-brand-50)]/30' : 'hover:bg-[var(--fin-page-bg)]/80'}`}
                      onClick={() => { if(hasAmc) toggleUser(user.id); }}
                    >
                      <td className={`p-3 text-center sticky left-0 z-10 border-r border-[var(--fin-border-subtle)] transition-colors ${isUserExpanded ? 'bg-[var(--fin-table-expanded-cell-highlight)]' : 'bg-[var(--fin-table-bg)] group-hover:bg-[var(--fin-table-row-hover-bg)]'}`}>
                        {hasAmc ? (
                          <button className="text-[var(--fin-aux-text)] hover:text-[var(--fin-brand-600)] outline-none p-1 rounded-md hover:bg-[var(--fin-brand-100)]/50">
                            <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${isUserExpanded ? 'rotate-90 text-[var(--fin-brand-600)]' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        ) : (
                          <div className="w-3.5 h-3.5 mx-auto" />
                        )}
                      </td>
                      <td className={`p-3 sticky left-10 z-10 border-r border-[var(--fin-table-row-border)] transition-colors ${isUserExpanded ? 'bg-[var(--fin-table-expanded-cell-highlight)]' : 'bg-[var(--fin-table-bg)] group-hover:bg-[var(--fin-table-row-hover-bg)]'}`}>
                        <span className="font-bold text-[var(--fin-heading-primary)] block mb-1 truncate w-[220px] xl:w-[280px]">{user.user}</span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge intent="neutral">{user.type}</Badge>
                          <Badge intent="neutral">{user.template}</Badge>
                        </div>
                      </td>
                      <td className="p-3 text-right font-medium text-[var(--fin-body-text)] tabular-nums">{formatCurrency(user.gross)}</td>
                      <td className="p-3 text-right font-medium text-[var(--fin-muted-text)] tabular-nums">{formatCurrency(user.paid)}</td>
                      <td className="p-3 text-right font-medium text-[var(--fin-muted-text)] tabular-nums">{formatCurrency(user.paidSub)}</td>
                      <td className="p-3 text-right font-bold text-[var(--fin-brand-600)] tabular-nums">{formatCurrency(totalPaid)}</td>
                      <td className="p-3 text-right tabular-nums pr-4">
                        <span className="font-black block text-[var(--fin-heading-primary)]">{formatCurrency(netReceivable)}</span>
                      </td>
                    </tr>

                    {hasAmc && (
                      <tr className="bg-[var(--fin-page-bg)]/40">
                        <td colSpan={7} className="p-0 border-b border-[var(--fin-border)]/60">
                          <div className={`grid transition-all duration-300 ease-in-out ${isUserExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                            <div className="overflow-hidden">
                              <div className="p-4 pl-10 border-l-2 border-[var(--fin-brand-300)] ml-3 my-2">
                                
                                <div className="mb-2 flex items-center justify-between">
                                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--fin-brand-700)] flex items-center gap-2">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    AMC Commission Ledger
                                  </h4>
                                </div>

                                <div className="bg-[var(--fin-table-bg)] rounded-md border border-[var(--fin-border)] shadow-sm overflow-hidden flex flex-col">
                                  <table className="w-full text-left text-[11px]">
                                    <thead className="bg-[var(--fin-page-bg)]/80 text-[8px] uppercase tracking-widest text-[var(--fin-muted-text)] font-bold border-b border-[var(--fin-border)]/80">
                                      <tr>
                                        <th className="p-2 w-[25%] pl-4">AMC Name</th>
                                        <th className="p-2 w-[15%] text-right">Gross Rec.</th>
                                        <th className="p-2 w-[15%] text-right">Paid (Self)</th>
                                        <th className="p-2 w-[15%] text-right">Paid (Sub)</th>
                                        <th className="p-2 w-[15%] text-right">Total Paid</th>
                                        <th className="p-2 w-[15%] text-right pr-4">Net Rec.</th>
                                      </tr>
                                    </thead>
                                  </table>
                                  <div className="max-h-[200px] overflow-y-auto inner-scrollbar">
                                    <table className="w-full text-left text-[11px]">
                                      <tbody>
                                        {user.amcBreakdown.map((amc: any, idx: number) => {
                                          const amcTotal = amc.paid + amc.paidSub;
                                          const amcNet = amc.gross - amcTotal;
                                          return (
                                            <tr key={amc.id} className={`hover:bg-[var(--fin-page-bg)]/80 transition-colors ${idx !== user.amcBreakdown.length - 1 ? "border-b border-[var(--fin-border-subtle)]" : ""}`}>
                                              <td className="p-2 w-[25%] pl-4 font-bold text-[var(--fin-table-row-text)]">{amc.amcName}</td>
                                              <td className="p-2 w-[15%] text-right font-medium text-[var(--fin-body-text)] tabular-nums">{formatCurrency(amc.gross)}</td>
                                              <td className="p-2 w-[15%] text-right text-[var(--fin-muted-text)] font-medium tabular-nums">{formatCurrency(amc.paid)}</td>
                                              <td className="p-2 w-[15%] text-right text-[var(--fin-muted-text)] font-medium tabular-nums">{formatCurrency(amc.paidSub)}</td>
                                              <td className="p-2 w-[15%] text-right font-bold text-[var(--fin-brand-600)] tabular-nums">{formatCurrency(amcTotal)}</td>
                                              <td className="p-2 w-[15%] text-right font-black text-[var(--fin-heading-primary)] tabular-nums pr-4">{formatCurrency(amcNet)}</td>
                                            </tr>
                                          )
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
          <tfoot className="sticky bottom-0 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] text-xs bg-[var(--fin-brand-900)] text-[var(--fin-btn-primary-text)]">
            <tr>
              <td colSpan={2} className="px-3 py-3 text-[10px] font-black uppercase tracking-widest text-right sticky left-0 bg-[var(--fin-brand-900)] z-50">Grand Totals</td>
              <td className="px-3 py-3 text-right font-black tabular-nums">{formatCurrency(totals.gross)}</td>
              <td className="px-3 py-3 text-right font-black text-[var(--fin-aux-text)] tabular-nums">{formatCurrency(totals.paid)}</td>
              <td className="px-3 py-3 text-right font-black text-[var(--fin-aux-text)] tabular-nums">{formatCurrency(totals.paidSub)}</td>
              <td className="px-3 py-3 text-right font-black text-[var(--fin-brand-400)] tabular-nums">{formatCurrency(totals.paid + totals.paidSub)}</td>
              <td className="px-3 py-3 text-right font-black text-[var(--fin-badge-warning-text)] tabular-nums pr-4">{formatCurrency(totals.gross - (totals.paid + totals.paidSub))}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}