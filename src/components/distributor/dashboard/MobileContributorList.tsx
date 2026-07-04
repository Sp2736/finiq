"use client";

import React from 'react';
import { formatCompactNumber, formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { TopContributor } from '@/services/distributor.service';

export default function MobileContributorList({ investors }: { investors: TopContributor[] }) {
  if (!investors || investors.length === 0) return null;

  const router = useRouter();
  
    const handleCardClick = (investor: TopContributor) => {
      // Strictly enforcing ID usage
      if (!investor.id) {
        console.error("Missing Investor ID in Top Contributors API");
        return;
      }
      sessionStorage.setItem('viewClientId', investor.id);
      router.push('/distributor/clients');
    };

  return (
    <div className="flex flex-col gap-2 p-2">
      {investors.map((investor, idx) => {
        const isPositive = investor.notional_pl >= 0;
        
        return (
          <div key={investor.id || investor.pan} onClick={() => handleCardClick(investor)} className="bg-[var(--fin-table-bg)] cursor-pointer p-3 rounded-md border border-[var(--fin-border)] shadow-sm flex flex-col gap-3 relative overflow-hidden group">
            {/* Rank Badge Background */}
            <div className="absolute -right-2 -top-4 text-[60px] font-black text-[var(--fin-badge-neutral-bg)] opacity-50 pointer-events-none select-none">
              #{idx + 1}
            </div>

             {/* <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fin-aux-text)]" />
          <input
            type="text"
            placeholder="Search investors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[var(--fin-table-bg)] border border-[var(--fin-border)] rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--fin-brand-600)]/20 focus:border-[var(--fin-brand-600)] transition-all shadow-sm"
          />
        </div> */}
            
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <h3 className="font-bold text-[var(--fin-heading-primary)] text-sm leading-tight max-w-[200px] truncate">{investor.name}</h3>
                <p className="text-[10px] font-bold text-[var(--fin-aux-text)] uppercase mt-0.5">{investor.pan}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-[var(--fin-muted-text)] uppercase tracking-widest mb-0.5">Current</p>
                <p className="font-black text-[var(--fin-heading-primary)] tabular-nums text-sm" title={formatCurrency(investor.total_current)}>
                  {formatCompactNumber(investor.total_current)}
                </p>
              </div>
            </div>

            <div className="relative z-10 grid grid-cols-3 gap-2 pt-3 border-t border-[var(--fin-table-row-border)]">
              <div>
                <p className="text-[9px] font-bold text-[var(--fin-aux-text)] uppercase tracking-widest mb-0.5">Invested</p>
                <p className="font-bold text-[var(--fin-body-text)] tabular-nums text-xs" title={formatCurrency(investor.total_invested)}>
                  {formatCompactNumber(investor.total_invested)}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-[var(--fin-aux-text)] uppercase tracking-widest mb-0.5">Notional P&L</p>
                <p className={`font-bold tabular-nums text-xs flex items-center gap-0.5 ${isPositive ? 'text-[var(--fin-badge-success-text)]' : 'text-[var(--fin-badge-danger-text)]'}`} title={formatCurrency(investor.notional_pl)}>
                  {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {formatCompactNumber(Math.abs(investor.notional_pl))}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold text-[var(--fin-aux-text)] uppercase tracking-widest mb-0.5">Return</p>
                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-black ${isPositive ? 'bg-[var(--fin-brand-50)] text-[var(--fin-badge-success-text)]' : 'bg-[var(--fin-badge-danger-bg)] text-[var(--fin-badge-danger-text)]'}`}>
                  {investor.abs_pct}%
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}