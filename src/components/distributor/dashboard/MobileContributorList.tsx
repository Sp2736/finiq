"use client";

import React, { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, ChevronRight, Search } from 'lucide-react';
import { TopContributor } from '@/services/distributor.service';

export default function MobileContributorList({ investors }: { investors: TopContributor[] }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredInvestors = investors.filter(inv => 
    inv.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    inv.pan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col space-y-4">
      
      {/* Mobile Header / Search */}
      <div className="flex flex-col gap-3 mb-2 px-1">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-black text-slate-900 tracking-tight">Top Contributors</h2>
          <button className="text-xs font-bold text-emerald-600 uppercase tracking-widest">View All</button>
        </div>
        {/* <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search investors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all shadow-sm"
          />
        </div> */}
      </div>

      {filteredInvestors.length === 0 ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-1">No Contributors Found</h3>
          <p className="text-slate-500 text-xs">Adjust your search filters.</p>
        </div>
      ) : (
        filteredInvestors.map((investor, idx) => {
          const isPositive = investor.notional_pl >= 0;
          
          return (
            <div key={investor.pan || idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              
              <div className="flex justify-between items-start mb-3 pl-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 font-black text-xs shrink-0 shadow-sm">
                    #{idx + 1}
                  </div>
                  <div>
                    <h3 className="text-slate-900 font-bold text-sm leading-tight">{investor.name}</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{investor.pan}</p>
                  </div>
                </div>
                <button className="p-1 mt-1 text-slate-300 hover:text-emerald-600 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl ml-2">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Current Value</p>
                  <p className="text-sm font-black text-slate-900 tabular-nums">{formatCurrency(investor.total_current)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Returns</p>
                  <div className={`flex items-center gap-1 font-black text-sm tabular-nums ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    <span>{investor.abs_pct}%</span>
                  </div>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-200 flex justify-between items-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Invested: {formatCurrency(investor.total_invested)}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                    P&L: {formatCurrency(investor.notional_pl)}
                  </p>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}