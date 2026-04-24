"use client";

import React from 'react';
import { formatCurrency } from '@/lib/utils';
import Badge from '@/components/investor/Badge';

export default function DesktopBrokerageTable({ data }: { data: any[] }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-slate-200/80 bg-slate-50/50 flex justify-between items-center">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Recent Transactions</h3>
      </div>
      <div className="flex-1 overflow-auto table-scrollbar">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead className="sticky top-0 z-30 shadow-sm ring-1 ring-slate-200/50">
            <tr className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              <th className="p-4 bg-slate-50 border-r border-slate-200/50">Client Name</th>
              <th className="p-4 bg-slate-50">Transaction Type</th>
              <th className="p-4 bg-slate-50">Date</th>
              <th className="p-4 text-right bg-slate-50">Amount</th>
              <th className="p-4 text-center bg-slate-50">Status</th>
            </tr>
          </thead>
          <tbody className="text-[13px]">
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center bg-white">
                  <div className="flex flex-col items-center justify-center py-8">
                    <h3 className="text-lg font-bold text-slate-900 mb-1">No Transactions Found</h3>
                    <p className="text-slate-500 text-sm">Try adjusting your filters.</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors duration-200">
                  <td className="p-4 border-r border-slate-50">
                    <span className="font-bold text-slate-900 block mb-1.5">{item.clientName}</span>
                    <div className="flex items-center gap-1.5">
                      <Badge intent="neutral">Folio: {item.folioNo}</Badge>
                      <Badge intent="neutral">{item.category}</Badge>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600 font-medium">{item.type}</td>
                  <td className="p-4 text-slate-500 font-medium tabular-nums">{item.date}</td>
                  <td className="p-4 text-right font-bold text-slate-900 tabular-nums">{formatCurrency(item.amount)}</td>
                  <td className="p-4 flex justify-center mt-2">
                    <Badge intent={item.status === 'Paid' ? 'success' : item.status === 'Pending' ? 'warning' : 'neutral'}>
                      {item.status}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}