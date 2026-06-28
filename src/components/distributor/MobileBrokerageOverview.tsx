"use client";

import React, { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import Badge from '@/components/investor/Badge';
import { ChevronRight, Building2 } from 'lucide-react';

export default function MobileBrokerageOverview({ data, totals }: { data: any[], totals: any }) {
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const toggleUser = (id: string) => {
    if (expandedUser === id) {
      setExpandedUser(null);
    } else {
      setExpandedUser(id);
    }
  };

  // Flatten the hierarchy for mobile view
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

  const grandTotalPaid = totals.paid + totals.paidSub;
  const grandNetReceivable = totals.gross - grandTotalPaid;

  return (
    <div className="flex flex-col space-y-4 pb-16 px-1">
      
      {/* Light Theme Grand Totals Card */}
      <div className="bg-[var(--fin-table-bg)] p-5 rounded-md border border-[var(--fin-border)] shadow-sm relative overflow-hidden mb-2">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--fin-brand-50)] rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
        <h3 className="text-[10px] font-black text-[var(--fin-muted-text)] uppercase tracking-widest mb-4 relative z-10">Grand Totals</h3>
        
        <div className="grid grid-cols-2 gap-4 relative z-10 mb-4">
          <div>
            <p className="text-[10px] text-[var(--fin-muted-text)] uppercase font-bold tracking-wider mb-1">Gross</p>
            <p className="text-sm font-black text-[var(--fin-heading-primary)]">{formatCurrency(totals.gross)}</p>
          </div>
          <div>
            <p className="text-[10px] text-[var(--fin-brand-600)] uppercase font-bold tracking-wider mb-1">Total Paid</p>
            <p className="text-sm font-black text-[var(--fin-brand-700)]">{formatCurrency(grandTotalPaid)}</p>
          </div>
        </div>
        
        <div className="pt-3 border-t border-[var(--fin-border-subtle)] relative z-10 flex justify-between items-center">
          <p className="text-[10px] text-[var(--fin-badge-broker-text)] uppercase font-bold tracking-wider">Net Receivable</p>
          <p className="text-lg font-black text-[var(--fin-badge-broker-text)]">{formatCurrency(grandNetReceivable)}</p>
        </div>
      </div>

      {/* Hierarchy Cards */}
      {(!flatData || flatData.length === 0) ? (
        <div className="bg-[var(--fin-table-bg)] p-6 rounded-md border border-[var(--fin-border)] text-center shadow-sm">
          <h3 className="text-sm font-bold text-[var(--fin-heading-primary)] mb-1">No Hierarchy Found</h3>
          <p className="text-[var(--fin-muted-text)] text-xs">Adjust your search parameters.</p>
        </div>
      ) : (
        flatData.map((user) => {
          const isUserExpanded = expandedUser === user.id;
          const totalPaid = user.paid + user.paidSub;
          const netReceivable = user.gross - totalPaid;
          const hasAmc = user.amcBreakdown && user.amcBreakdown.length > 0;

          return (
            <div key={user.id} className="flex flex-col mb-1">
              <div 
                onClick={() => toggleUser(user.id)}
                className={`bg-[var(--fin-table-bg)] p-4 rounded-md border cursor-pointer ${isUserExpanded ? 'border-[var(--fin-brand-200)] shadow-md ring-1 ring-[var(--fin-brand-50)]' : 'border-[var(--fin-border)] shadow-sm'} relative overflow-hidden transition-all group`}
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${isUserExpanded ? 'bg-[var(--fin-brand-500)]' : 'bg-[var(--fin-skeleton-base)] group-hover:bg-[var(--fin-brand-300)]'}`} />
                
                {/* Collapsed/Header View */}
                <div className="flex justify-between items-start pl-2">
                  <div className="flex items-start gap-3">
                    <button className={`mt-0.5 text-[var(--fin-aux-text)] p-1 rounded-md transition-colors ${isUserExpanded ? 'bg-[var(--fin-brand-50)] text-[var(--fin-brand-600)]' : 'bg-[var(--fin-page-bg)] group-hover:bg-[var(--fin-brand-50)] group-hover:text-[var(--fin-brand-600)]'}`}>
                      <ChevronRight className={`w-4 h-4 transition-transform ${isUserExpanded ? 'rotate-90' : ''}`} />
                    </button>
                    <div>
                      <h3 className="text-[var(--fin-heading-primary)] font-bold text-sm leading-tight pr-2">{user.user}</h3>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <Badge intent="neutral">{user.type}</Badge>
                        <Badge intent="neutral">{user.template}</Badge>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Summary shown ONLY when collapsed */}
                  {!isUserExpanded && (
                    <div className="text-right pr-1 shrink-0 animate-[fadeIn_0.3s_ease-out]">
                      <p className="text-[9px] font-bold text-[var(--fin-aux-text)] uppercase tracking-widest mb-0.5">Net Rec.</p>
                      <p className="text-xs font-black text-[var(--fin-heading-tertiary)]">{formatCurrency(netReceivable)}</p>
                    </div>
                  )}
                </div>

                {/* Expanded Details View */}
                <div className={`grid transition-all duration-300 ease-in-out ${isUserExpanded ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                  <div className="overflow-hidden">
                    
                    {/* Financial Grid */}
                    <div className="grid grid-cols-2 gap-3 bg-[var(--fin-page-bg)] p-3.5 rounded-md ml-2 mb-3">
                      <div>
                        <p className="text-[10px] font-bold text-[var(--fin-muted-text)] uppercase tracking-widest mb-1">Gross Rec.</p>
                        <p className="text-sm font-black text-[var(--fin-table-row-text)]">{formatCurrency(user.gross)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[var(--fin-muted-text)] uppercase tracking-widest mb-1">Total Paid</p>
                        <p className="text-sm font-black text-[var(--fin-brand-600)]">{formatCurrency(totalPaid)}</p>
                      </div>
                      <div className="col-span-2 pt-2.5 border-t border-[var(--fin-border)] flex justify-between items-end">
                        <p className="text-[10px] font-bold text-[var(--fin-muted-text)] uppercase tracking-widest mb-1">Net Receivable</p>
                        <p className="text-base font-black text-[var(--fin-heading-primary)]">{formatCurrency(netReceivable)}</p>
                      </div>
                    </div>

                    {/* AMC Breakdown Section */}
                    {hasAmc && (
                      <div className="mt-2 mb-1 space-y-2 border-l-2 border-[var(--fin-brand-200)] pl-3 ml-3">
                        <div className="flex items-center gap-2 mb-2 pt-1">
                          <Building2 className="w-4 h-4 text-[var(--fin-brand-600)]" />
                          <h4 className="text-[10px] font-black text-[var(--fin-brand-700)] uppercase tracking-widest">AMC Breakdown</h4>
                        </div>
                        {user.amcBreakdown.map((amc: any) => {
                          const amcTotal = amc.paid + amc.paidSub;
                          const amcNet = amc.gross - amcTotal;
                          return (
                            <div key={amc.id} className="bg-[var(--fin-table-bg)] p-3 rounded-md border border-[var(--fin-border)] shadow-sm flex flex-col gap-2">
                              <h5 className="font-bold text-xs text-[var(--fin-heading-tertiary)]">{amc.amcName}</h5>
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-[var(--fin-muted-text)] uppercase tracking-widest">Gross: {formatCurrency(amc.gross)}</span>
                                <span className="text-[10px] font-bold text-[var(--fin-brand-600)] uppercase tracking-widest">Paid: {formatCurrency(amcTotal)}</span>
                              </div>
                              <div className="pt-2 border-t border-[var(--fin-border-subtle)] flex justify-between items-center">
                                <span className="text-[10px] font-black text-[var(--fin-table-row-text)] uppercase tracking-widest">Net Rec</span>
                                <span className="text-sm font-black text-[var(--fin-heading-primary)]">{formatCurrency(amcNet)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}