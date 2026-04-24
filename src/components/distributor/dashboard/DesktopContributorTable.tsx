"use client";

import React, { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, MoreVertical, Search } from 'lucide-react';
import { TopContributor } from '@/services/distributor.service';

export default function DesktopContributorTable({ investors }: { investors: TopContributor[] }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredInvestors = investors.filter(inv => 
    inv.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    inv.pan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-full flex flex-col overflow-hidden">
      
      {/* Table Header / Search */}
      <div className="p-6 lg:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mb-1">Top 10 Contributors</h2>
        </div>
        {/* <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search investors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 pr-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all w-64"
          />
        </div> */}
      </div>
      
      {/* Scrollable Table Area */}
      <div className="flex-1 overflow-auto table-scrollbar">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-md z-10 shadow-sm border-b border-slate-200">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Rank/Investor</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Invested Value</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Current Value</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Notional P&L</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">ABS Return</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[13px]">
            {filteredInvestors.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center bg-white">
                   <h3 className="text-lg font-bold text-slate-900 mb-1">No Contributors Found</h3>
                   <p className="text-slate-500 text-sm">Adjust your search parameters.</p>
                </td>
              </tr>
            ) : (
              filteredInvestors.map((investor, idx) => (
                <tr key={investor.pan} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 text-slate-600 text-xs font-black">
                        #{idx + 1}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 leading-tight">{investor.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{investor.pan}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right font-bold text-slate-600 whitespace-nowrap tabular-nums">
                    {formatCurrency(investor.total_invested)}
                  </td>
                  <td className="px-8 py-5 text-right font-black text-slate-900 whitespace-nowrap tabular-nums text-lg">
                    {formatCurrency(investor.total_current)}
                  </td>
                  <td className={`px-8 py-5 text-right font-bold whitespace-nowrap tabular-nums ${investor.notional_pl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    <div className="flex items-center justify-end gap-1">
                      {investor.notional_pl >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {formatCurrency(investor.notional_pl)}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center tabular-nums">
                    <span className={`px-3 py-1.5 rounded-xl text-xs font-black ${investor.abs_pct >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {investor.abs_pct > 0 ? '+' : ''}{investor.abs_pct}%
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="p-2 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-slate-200">
                      <MoreVertical className="w-4 h-4 text-slate-400" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-5 bg-slate-50/30 border-t border-slate-100 flex justify-center shrink-0">
        <button className="text-xs font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-700 transition-colors">
          View All Contributors
        </button>
      </div>
    </div>
  );
}