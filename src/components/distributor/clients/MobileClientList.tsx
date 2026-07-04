"use client";

import React from 'react';
import { formatCurrency, toTitleCase } from '@/lib/utils';
import { Investor } from '@/services/distributor.service';
import { ChevronRight } from 'lucide-react';

interface Props {
  clients: Investor[];
  onClientClick: (id: string) => void;
}

export default function MobileClientList({ clients, onClientClick }: Props) {
  if (!clients || clients.length === 0) return <div className="p-8 text-center text-[var(--fin-muted-text)] font-medium bg-[var(--fin-table-bg)] rounded-md border border-[var(--fin-border)]">No investors found.</div>;

  return (
    <div className="flex flex-col gap-2 p-2">
      {clients.map((client) => (
        <div
          key={client.id}
          onClick={() => onClientClick(client.id)}
          className="bg-[var(--fin-table-bg)] rounded-md border border-[var(--fin-border)] shadow-sm transition-all duration-200 active:scale-[0.98] active:bg-[var(--fin-page-bg)] cursor-pointer group hover:border-[var(--fin-brand-300)]"
        >
          <div className="p-3 md:p-4 flex items-center justify-between">
            <div className="flex flex-col min-w-0 flex-1">
              <p className="font-bold text-[var(--fin-heading-primary)] text-sm md:text-base truncate pr-2 group-hover:text-[var(--fin-brand-700)]">{toTitleCase(client.name)}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-[var(--fin-skeleton-base)] text-[var(--fin-body-text)] rounded text-[10px] md:text-xs font-bold font-mono">{client.pan}</span>
                <span className="text-[10px] text-[var(--fin-aux-text)] font-medium truncate border-l border-[var(--fin-border)] pl-2">{client.tax_status}</span>
              </div>
            </div>
            <div className="flex flex-col items-end mr-3 shrink-0">
              <p className="text-[9px] font-bold text-[var(--fin-aux-text)] uppercase tracking-widest mb-0.5">AUM</p>
              <p className="font-black text-[var(--fin-heading-primary)] tabular-nums text-xs md:text-sm">{formatCurrency(client.total_aum)}</p>
            </div>
            <div className="p-1.5 rounded-md bg-[var(--fin-page-bg)] text-[var(--fin-aux-text)] group-hover:bg-[var(--fin-brand-100)] group-hover:text-[var(--fin-brand-600)] transition-colors">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}