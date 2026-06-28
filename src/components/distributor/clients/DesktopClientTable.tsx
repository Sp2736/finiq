"use client";

import React from 'react';
import { formatCurrency, toTitleCase } from '@/lib/utils';
import { Investor } from '@/services/distributor.service';

interface Props {
  clients: Investor[];
  onClientClick: (id: string) => void;
}

export default function DesktopClientTable({ clients, onClientClick }: Props) {
  if (!clients || clients.length === 0) {
    return <div className="p-8 text-center text-[var(--fin-muted-text)] font-medium">No investors found.</div>;
  }

  return (
    <table className="w-full text-left border-separate border-spacing-0 min-w-[800px]">
      <thead className="sticky top-0 z-20">
        <tr className="bg-[var(--fin-page-bg)]/90 backdrop-blur-sm shadow-sm ring-1 ring-[var(--fin-input-ring-focus)]/50">
          <th className="px-6 py-3 text-[10px] font-black text-[var(--fin-aux-text)] uppercase tracking-widest border-b border-[var(--fin-border-subtle)]">Investor Name</th>
          <th className="px-6 py-3 text-[10px] font-black text-[var(--fin-aux-text)] uppercase tracking-widest border-b border-[var(--fin-border-subtle)]">PAN</th>
          <th className="px-6 py-3 text-[10px] font-black text-[var(--fin-aux-text)] uppercase tracking-widest border-b border-[var(--fin-border-subtle)]">Tax Status</th>
          <th className="px-6 py-3 text-[10px] font-black text-[var(--fin-aux-text)] uppercase tracking-widest text-right border-b border-[var(--fin-border-subtle)] pr-6">AUM</th>
        </tr>
      </thead>
      <tbody className="text-sm">
        {clients.map((client) => (
          <tr
            key={client.id}
            onClick={() => onClientClick(client.id)}
            className="cursor-pointer transition-colors duration-200 group border-b border-[var(--fin-border-subtle)] hover:bg-[var(--fin-brand-50)]/50"
          >
            <td className="px-6 py-4 border-b border-[var(--fin-border-subtle)]"><p className="font-bold text-[var(--fin-heading-primary)] group-hover:text-[var(--fin-brand-700)]">{toTitleCase(client.name)}</p></td>
            <td className="px-6 py-4 border-b border-[var(--fin-border-subtle)]"><span className="px-2.5 py-1 bg-[var(--fin-skeleton-base)] text-[var(--fin-body-text)] rounded-md text-xs font-bold font-mono group-hover:bg-[var(--fin-table-bg)]">{client.pan}</span></td>
            <td className="px-6 py-4 border-b border-[var(--fin-border-subtle)]"><p className="font-medium text-[var(--fin-body-text)] text-xs">{client.tax_status}</p></td>
            <td className="px-6 py-4 text-right border-b border-[var(--fin-border-subtle)] pr-6"><p className="font-black text-[var(--fin-heading-primary)] tabular-nums">{formatCurrency(client.total_aum)}</p></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}