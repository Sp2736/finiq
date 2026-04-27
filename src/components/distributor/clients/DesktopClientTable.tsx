"use client";

import React from 'react';
import { formatCurrency } from '@/lib/utils';
import { Investor } from '@/services/distributor.service';

interface Props {
  clients: Investor[];
  onClientClick: (id: string) => void;
}

export default function DesktopClientTable({ clients, onClientClick }: Props) {
  if (!clients || clients.length === 0) {
    return <div className="p-8 text-center text-slate-500 font-medium">No investors found.</div>;
  }

  return (
    <table className="w-full text-left border-separate border-spacing-0 min-w-[800px]">
      <thead className="sticky top-0 z-20">
        <tr className="bg-slate-50/90 backdrop-blur-sm shadow-sm ring-1 ring-slate-200/50">
          <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Investor Name</th>
          <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">PAN</th>
          <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Tax Status</th>
          <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right border-b border-slate-100 pr-6">Exact AUM</th>
        </tr>
      </thead>
      <tbody className="text-sm">
        {clients.map((client) => (
          <tr 
            key={client.id}
            onClick={() => onClientClick(client.id)}
            className="cursor-pointer transition-colors duration-200 group border-b border-slate-100 hover:bg-emerald-50/50"
          >
            <td className="px-6 py-4 border-b border-slate-100"><p className="font-bold text-slate-900 group-hover:text-emerald-700">{client.name}</p></td>
            <td className="px-6 py-4 border-b border-slate-100"><span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-bold font-mono group-hover:bg-white">{client.pan}</span></td>
            <td className="px-6 py-4 border-b border-slate-100"><p className="font-medium text-slate-600 text-xs">{client.tax_status}</p></td>
            <td className="px-6 py-4 text-right border-b border-slate-100 pr-6"><p className="font-black text-slate-900 tabular-nums">{formatCurrency(client.total_aum)}</p></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}