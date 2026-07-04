"use client";

import React from 'react';
import { FileText, Download, PieChart, TrendingUp, Filter, Calendar } from 'lucide-react';

const REPORTS = [
  { id: 1, title: 'AUM Summary', description: 'Comprehensive view of assets under management across all active clients.', icon: PieChart, color: 'text-[var(--fin-brand-600)]', bg: 'bg-[var(--fin-brand-50)]' },
  { id: 2, title: 'Brokerage & Payouts', description: 'Detailed breakdown of generated commissions and pending payouts.', icon: TrendingUp, color: 'text-[var(--fin-badge-broker-text)]', bg: 'bg-[var(--fin-badge-broker-bg)]' },
  { id: 3, title: 'Client Activity', description: 'Log of recent SIPs, lumpsum investments, and portfolio redemptions.', icon: FileText, color: 'text-[var(--fin-badge-admin-text)]', bg: 'bg-[var(--fin-badge-admin-bg)]' },
];

export default function DistributorReportsPage() {
  return (
    <div className="h-full flex flex-col relative z-10 animate-[fadeIn_0.5s_ease-out] overflow-hidden">
      
      <div className="shrink-0 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--fin-heading-primary)]">
            Analytic <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--fin-brand-600)] via-[var(--fin-badge-broker-text)] to-[var(--fin-brand-800)]">Reports</span>
          </h1>
          <p className="text-[var(--fin-muted-text)] font-medium mt-1 text-sm">Generate and export statements for your distribution network.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pb-6 flex flex-col gap-6 scrollbar-none">
        <div className="bg-[var(--fin-table-bg)] rounded-[2rem] border border-[var(--fin-border)] shadow-sm p-6 md:p-8 shrink-0">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-1/3">
              <label className="block text-[10px] font-black text-[var(--fin-muted-text)] uppercase tracking-widest mb-2">Report Type</label>
              <div className="relative">
                <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fin-aux-text)]" />
                <select className="w-full pl-9 pr-4 py-3 bg-[var(--fin-page-bg)] border border-[var(--fin-border)] rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--fin-brand-600)]/20 focus:border-[var(--fin-brand-600)] appearance-none">
                  <option>All Clients</option>
                  <option>Top 10 Contributors</option>
                  <option>Inactive Clients</option>
                </select>
              </div>
            </div>
            <div className="w-full md:w-1/3">
              <label className="block text-[10px] font-black text-[var(--fin-muted-text)] uppercase tracking-widest mb-2">Date Range</label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fin-aux-text)]" />
                <select className="w-full pl-9 pr-4 py-3 bg-[var(--fin-page-bg)] border border-[var(--fin-border)] rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--fin-brand-600)]/20 focus:border-[var(--fin-brand-600)] appearance-none">
                  <option>Financial Year 2025-26</option>
                  <option>Last 30 Days</option>
                  <option>Custom Range</option>
                </select>
              </div>
            </div>
            <div className="w-full md:w-1/3">
              <button className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[var(--fin-heading-primary)] text-[var(--fin-btn-primary-text)] rounded-md font-medium text-sm hover:bg-[var(--fin-heading-primary)] transition-all shadow-lg shadow-[0_4px_16px_var(--fin-table-shadow)]">
                <Download className="w-4 h-4" />
                <span>Export Master Data</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 shrink-0">
          {REPORTS.map((report) => (
            <div key={report.id} className="bg-[var(--fin-table-bg)] p-7 rounded-[2rem] border border-[var(--fin-border)] shadow-sm hover:border-[var(--fin-brand-200)] transition-all group flex flex-col h-full min-h-[300px]">
              <div className={`w-14 h-14 ${report.bg} ${report.color} rounded-md mb-6 flex items-center justify-center shrink-0`}>
                <report.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-[var(--fin-heading-primary)] tracking-tight mb-2 shrink-0">{report.title}</h3>
              <p className="text-sm text-[var(--fin-muted-text)] font-medium mb-8 flex-1">{report.description}</p>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--fin-page-bg)] border border-[var(--fin-border)] text-[var(--fin-table-row-text)] rounded-md font-medium text-sm hover:bg-[var(--fin-brand-50)] hover:text-[var(--fin-brand-700)] hover:border-[var(--fin-brand-200)] transition-all shrink-0">
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