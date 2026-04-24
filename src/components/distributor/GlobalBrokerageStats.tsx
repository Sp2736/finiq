"use client";

import React from 'react';
import { formatCurrency } from '@/lib/utils';

interface StatsProps {
  stats: {
    totalEarnings: number;
    pendingBrokerage: number;
    activeClients: number;
    ytdGrowth: number;
  };
}

export default function GlobalBrokerageStats({ stats }: StatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform duration-500">
          <svg className="w-16 h-16 text-indigo-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
        </div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Earnings (YTD)</p>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(stats.totalEarnings)}</h2>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">+{stats.ytdGrowth}%</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">vs last month</span>
        </div>
      </div>

      <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm relative overflow-hidden group">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pending Brokerage</p>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(stats.pendingBrokerage)}</h2>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Action Required</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clearance by 1st</span>
        </div>
      </div>

      <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm relative overflow-hidden group">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Clients</p>
        <h2 className="text-3xl font-black text-indigo-600 tracking-tight">{stats.activeClients}</h2>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Generating brokerage this month</span>
        </div>
      </div>
    </div>
  );
}