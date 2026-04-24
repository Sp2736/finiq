"use client";

import React, { useState, useEffect } from 'react';
import { distributorService, TopContributor } from '@/services/distributor.service';
import {
  TrendingUp,
  Users,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Search,
  Filter
} from 'lucide-react';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function DistributorDashboard() {
  const [topInvestors, setTopInvestors] = useState<TopContributor[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [contributorsRes, summaryRes] = await Promise.all([
          distributorService.getTopContributors(),
          distributorService.getCompanySummary()
        ]);

        if (contributorsRes.success) {
          setTopInvestors(contributorsRes.data);
        }
        if (summaryRes.success) {
          setSummary(summaryRes.data);
        }
        
        if (!contributorsRes.success || !summaryRes.success) {
          setError(contributorsRes.message || summaryRes.message || "Partial data load failure");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const kpis = summary ? [
    { 
      name: 'Total AUM', 
      value: formatCurrency(summary.total_current), 
      change: `${((summary.total_current - summary.total_invested) / summary.total_invested * 100).toFixed(1)}%`, 
      isPositive: summary.total_current >= summary.total_invested, 
      icon: Briefcase,
      bgClass: 'bg-emerald-50',
      textClass: 'text-emerald-600'
    },
    { 
      name: 'Total Invested', 
      value: formatCurrency(summary.total_invested), 
      change: 'Capital', 
      isPositive: true, 
      icon: TrendingUp,
      bgClass: 'bg-blue-50',
      textClass: 'text-blue-600'
    },
    { 
      name: 'Total Clients', 
      value: summary.investor_count.toLocaleString(), 
      change: 'Active', 
      isPositive: true, 
      icon: Users,
      bgClass: 'bg-indigo-50',
      textClass: 'text-indigo-600'
    },
  ] : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-bold tracking-tight uppercase text-xs">Synchronizing Portfolio Data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-100 rounded-[2.5rem] text-rose-600 font-medium">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">
            Client and <span className="text-emerald-600">AUM Insights</span>
          </h1>
          <p className="text-slate-500 font-medium max-w-xl">
            Real-time synchronization of global AUM and high-net-worth contributor pipelines.
          </p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 font-bold text-sm hover:border-emerald-600 hover:text-emerald-600 transition-all shadow-sm">
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
          <button className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-950/20">
            Generate Report
          </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpis.map((kpi) => (
          <div key={kpi.name} className="bg-white p-7 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
            <div className={`w-14 h-14 ${kpi.bgClass} ${kpi.textClass} rounded-2xl mb-6 flex items-center justify-center relative z-10`}>
              <kpi.icon className="w-7 h-7" />
            </div>
            <div className="relative z-10">
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mb-1">{kpi.name}</p>
              <div className="flex items-end gap-3">
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{kpi.value}</h3>
                <div className={`flex items-center gap-0.5 text-xs font-black mb-1.5 ${kpi.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {kpi.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {kpi.change}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Top Contributors Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-1">Top 10 Contributors</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Global Portfolio Ranking</p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search investors..."
              className="pl-11 pr-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all w-64"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Rank/Investor</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Invested Value</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Current Value</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Notional P&L</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">ABS Return</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topInvestors.map((investor, idx) => (
                <tr key={investor.pan} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-600 text-xs font-black">
                        #{idx + 1}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 leading-tight">{investor.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{investor.pan}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right font-bold text-slate-600 whitespace-nowrap">
                    {formatCurrency(investor.total_invested)}
                  </td>
                  <td className="px-8 py-5 text-right font-black text-slate-900 whitespace-nowrap">
                    {formatCurrency(investor.total_current)}
                  </td>
                  <td className={`px-8 py-5 text-right font-bold whitespace-nowrap ${investor.notional_pl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    <div className="flex items-center justify-end gap-1">
                      {investor.notional_pl >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {formatCurrency(investor.notional_pl)}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-black ${investor.abs_pct >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {investor.abs_pct > 0 ? '+' : ''}{investor.abs_pct}%
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200">
                      <MoreVertical className="w-4 h-4 text-slate-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-6 bg-slate-50/30 border-t border-slate-100 flex justify-center">
          <button className="text-xs font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-700 transition-colors">
            View All Contributors
          </button>
        </div>
      </div>
    </div>
  );
}