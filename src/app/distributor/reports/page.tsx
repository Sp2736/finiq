"use client";

import React from 'react';
import { FileText, Download, PieChart, TrendingUp, Filter, Calendar } from 'lucide-react';

const REPORTS = [
  { id: 1, title: 'AUM Summary', description: 'Comprehensive view of assets under management across all active clients.', icon: PieChart, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 2, title: 'Brokerage & Payouts', description: 'Detailed breakdown of generated commissions and pending payouts.', icon: TrendingUp, color: 'text-teal-600', bg: 'bg-teal-50' },
  { id: 3, title: 'Client Activity', description: 'Log of recent SIPs, lumpsum investments, and portfolio redemptions.', icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
];

export default function DistributorReportsPage() {
  return (
    <div className="h-full flex flex-col relative z-10 animate-[fadeIn_0.5s_ease-out] overflow-hidden">
      
      <div className="shrink-0 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            Analytic <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800">Reports</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1 text-sm">Generate and export statements for your distribution network.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pb-6 flex flex-col gap-6 scrollbar-none">
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 md:p-8 shrink-0">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-1/3">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Report Type</label>
              <div className="relative">
                <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 appearance-none">
                  <option>All Clients</option>
                  <option>Top 10 Contributors</option>
                  <option>Inactive Clients</option>
                </select>
              </div>
            </div>
            <div className="w-full md:w-1/3">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Date Range</label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 appearance-none">
                  <option>Financial Year 2025-26</option>
                  <option>Last 30 Days</option>
                  <option>Custom Range</option>
                </select>
              </div>
            </div>
            <div className="w-full md:w-1/3">
              <button className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl font-medium text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20">
                <Download className="w-4 h-4" />
                <span>Export Master Data</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 shrink-0">
          {REPORTS.map((report) => (
            <div key={report.id} className="bg-white p-7 rounded-[2rem] border border-slate-200 shadow-sm hover:border-emerald-200 transition-all group flex flex-col h-full min-h-[300px]">
              <div className={`w-14 h-14 ${report.bg} ${report.color} rounded-2xl mb-6 flex items-center justify-center shrink-0`}>
                <report.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2 shrink-0">{report.title}</h3>
              <p className="text-sm text-slate-500 font-medium mb-8 flex-1">{report.description}</p>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-medium text-sm hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all shrink-0">
                <Download className="w-4 h-4" />
                <span>Generate PDF</span>
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}