import React from 'react';
import { ArrowUpRight, ArrowDownRight, MoreVertical, Eye } from 'lucide-react';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function DesktopClientTable({ clients }: { clients: any[] }) {
  if (clients.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-slate-900">No Clients Found</h3>
        <p className="text-slate-500 text-sm mt-1">Try adjusting your search filters.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-md z-10 shadow-sm">
          <tr>
            <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">Client Info</th>
            <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 text-right">Invested Capital</th>
            <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 text-right">Current Value</th>
            <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 text-right">Notional P&L</th>
            <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 text-center">XIRR / ABS</th>
            <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {clients.map((client, idx) => {
            const isPositive = client.notional_pl >= 0;
            return (
              <tr key={client.pan || idx} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 font-black text-sm border border-emerald-100">
                      {client.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 leading-tight group-hover:text-emerald-700 transition-colors">{client.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{client.pan}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5 text-right font-bold text-slate-600">
                  {formatCurrency(client.total_invested)}
                </td>
                <td className="px-8 py-5 text-right font-black text-slate-900 text-lg tracking-tight">
                  {formatCurrency(client.total_current)}
                </td>
                <td className="px-8 py-5 text-right">
                  <div className={`flex items-center justify-end gap-1.5 font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {formatCurrency(client.notional_pl)}
                  </div>
                </td>
                <td className="px-8 py-5 text-center">
                  <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-black ${isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {isPositive ? '+' : ''}{client.abs_pct}%
                  </div>
                </td>
                <td className="px-8 py-5 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="View Portfolio">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}