"use client";

import React from 'react';
import { formatCurrency } from '@/lib/utils';
import { Investor } from '@/services/distributor.service';
import { ChevronRight } from 'lucide-react';

interface Props {
  clients: Investor[];
  onClientClick: (id: string) => void;
}

export default function MobileClientList({ clients, onClientClick }: Props) {
  if (!clients || clients.length === 0) return <div className="p-8 text-center text-slate-500 font-medium bg-white rounded-xl border border-slate-200">No investors found.</div>;

  return (
    <div className="flex flex-col gap-2 p-2">
      {clients.map((client) => (
        <div 
          key={client.id}
          onClick={() => onClientClick(client.id)}
          className="bg-white rounded-xl border border-slate-200 shadow-sm transition-all duration-200 active:scale-[0.98] active:bg-slate-50 cursor-pointer group hover:border-emerald-300"
        >
          <div className="p-3 md:p-4 flex items-center justify-between">
            <div className="flex flex-col min-w-0 flex-1">
              <p className="font-bold text-slate-900 text-sm md:text-base truncate pr-2 group-hover:text-emerald-700">{client.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] md:text-xs font-bold font-mono">{client.pan}</span>
                <span className="text-[10px] text-slate-400 font-medium truncate border-l border-slate-200 pl-2">{client.tax_status}</span>
              </div>
            </div>
            <div className="flex flex-col items-end mr-3 shrink-0">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Exact AUM</p>
              <p className="font-black text-slate-900 tabular-nums text-xs md:text-sm">{formatCurrency(client.total_aum)}</p>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}