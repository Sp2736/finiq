"use client";

import React from 'react';
import { Users, TrendingUp, IndianRupee, PieChart, ArrowUpRight, Activity } from 'lucide-react';

export default function DistributorOverviewPage() {
  const kpis = [
    { label: 'Total AUM', value: '₹45.2 Cr', change: '+2.4%', isPositive: true, icon: PieChart },
    { label: 'Active Clients', value: '284', change: '+12', isPositive: true, icon: Users },
    { label: 'Monthly SIP Book', value: '₹12.5 L', change: '+5.1%', isPositive: true, icon: Activity },
    { label: 'Pending Brokerage', value: '₹1.4 L', change: 'Current Month', isPositive: null, icon: IndianRupee },
  ];

  return (
    <div className="h-full flex flex-col relative z-10 animate-[fadeIn_0.5s_ease-out] overflow-hidden">
      
      {/* Fixed Header */}
      <div className="shrink-0 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            Distributor <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800">Overview</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1 text-sm">Welcome back. Here is the summary of your distribution business.</p>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pr-2 pb-6 flex flex-col gap-6 scrollbar-none">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, idx) => (
            <div key={idx} className="bg-white p-6 rounded-md border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-md flex items-center justify-center group-hover:scale-110 transition-transform">
                  <kpi.icon className="w-6 h-6" />
                </div>
                {kpi.isPositive !== null && (
                  <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${kpi.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {kpi.isPositive ? <ArrowUpRight className="w-3 h-3" /> : null}
                    {kpi.change}
                  </span>
                )}
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{kpi.label}</p>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{kpi.value}</h3>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-md border border-slate-200 shadow-sm p-6 flex flex-col min-h-[400px]">
            <h3 className="text-lg font-black text-slate-900 mb-6 shrink-0">AUM Growth Trend</h3>
            <div className="flex-1 bg-slate-50/50 rounded-md border border-slate-100 flex items-center justify-center">
              <p className="text-sm font-bold text-slate-400 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> Chart Component Placeholder
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-md border border-slate-200 shadow-sm p-6 flex flex-col min-h-[400px]">
            <h3 className="text-lg font-black text-slate-900 mb-6 shrink-0">Recent Onboardings</h3>
            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-md transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-black text-xs shrink-0">
                    CL
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate">New Client {i}</h4>
                    <p className="text-xs text-slate-500 font-medium truncate">KYC Completed</p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 shrink-0">Today</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}