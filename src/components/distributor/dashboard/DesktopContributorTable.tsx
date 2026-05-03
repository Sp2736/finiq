"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCompactNumber } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils'; 
import { TopContributor } from '@/services/distributor.service';
import { handler } from 'next/dist/build/templates/app-route';

export default function DesktopContributorTable({ investors }: { investors: TopContributor[] }) {

  const router = useRouter();

  const handleRowClick = (investor: TopContributor) => {
    // Strictly enforcing ID usage
    if (!investor.id) {
      console.error("Missing Investor ID in Top Contributors API");
      return;
    }
    sessionStorage.setItem('viewClientId', investor.id);
    router.push('/distributor/clients');
  };

  return (
    <div className="bg-white rounded-md border border-slate-200 shadow-[0_4px_20px_rgb(0,0,0,0.03)] h-full flex flex-col overflow-hidden transition-all duration-500">
      
      {/* Header Area - Reduced padding from py-4 to py-3 */}
      <div className="px-6 py-3 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none">Top 10 Contributors</h2>
          </div>
        </div>

        {/* Search Bar code snippet */}

        {/* <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search investors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 pr-6 py-2.5 bg-white border border-slate-200 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all w-64"
          />
        </div> */}
        
        {/* Button moved to top right & linked to the Investors module */}
        <Link 
          href="/distributor/clients" 
          className="px-4 py-2 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-md hover:bg-emerald-100 transition-colors shadow-sm active:scale-95"
        >
          View All Contributors
        </Link>
      </div>
      
      {/* Compact Table Area */}
      <div className="flex-1 overflow-auto table-scrollbar">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead className="sticky top-0 z-20">
            <tr className="bg-slate-50/90 backdrop-blur-sm">
              {/* Reduced header padding to py-2 */}
              <th className="px-5 py-2 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Investor</th>
              <th className="px-5 py-2 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right border-b border-slate-100">Invested</th>
              <th className="px-5 py-2 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right border-b border-slate-100">Current Value</th>
              <th className="px-5 py-2 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right border-b border-slate-100">Notional P&L</th>
              <th className="px-5 py-2 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center border-b border-slate-100">ABS Return</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {investors.map((investor, idx) => {
              const isPositive = investor.notional_pl >= 0;
              return (
                <tr key={investor.pan} onClick={() => handleRowClick(investor)} className="hover:bg-emerald-50/30 transition-all cursor-pointer duration-200 group">
                  {/* Reduced row padding to py-1.5 to fit more rows in the view */}
                  <td className="px-5 py-1.5 border-b border-slate-50">
                    <div className="flex items-center gap-3">
                      {/* Slightly reduced rank badge (w-6 h-6) to keep row height compact */}
                      <div className="flex items-center justify-center w-6 h-6 rounded-md bg-slate-50 text-slate-400 text-[10px] font-black group-hover:bg-white group-hover:text-emerald-600 transition-colors shadow-sm shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 leading-tight group-hover:text-emerald-700 transition-colors">{investor.name}</p>
                        <p className="text-[11px] font-bold text-slate-400 uppercase mt-0.5">{investor.pan}</p>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-5 py-1.5 text-right font-medium text-slate-500 tabular-nums border-b border-slate-50">
                    <span title={formatCurrency(investor.total_invested)}>
                      {formatCompactNumber(investor.total_invested)}
                    </span>
                  </td>
                  
                  <td className="px-5 py-1.5 text-right font-black text-slate-900 tabular-nums border-b border-slate-50">
                    <span title={formatCurrency(investor.total_current)}>
                      {formatCompactNumber(investor.total_current)}
                    </span>
                  </td>
                  
                  <td className={`px-5 py-1.5 text-right font-bold tabular-nums border-b border-slate-50 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                    <div className="flex items-center justify-end gap-1" title={formatCurrency(investor.notional_pl)}>
                      <span className="hidden sm:inline">{formatCompactNumber(investor.notional_pl)}</span>
                    </div>
                  </td>
                  
                  <td className="px-5 py-1.5 text-center border-b border-slate-50">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-black ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {investor.abs_pct}%
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      
    </div>
  );
}