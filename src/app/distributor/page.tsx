"use client";

import React, { useState, useEffect } from 'react';
import { distributorService, TopContributor } from '@/services/distributor.service';
import DesktopContributorTable from '@/components/distributor/dashboard/DesktopContributorTable';
import MobileContributorList from '@/components/distributor/dashboard/MobileContributorList';
import {
  TrendingUp,
  Users,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
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
  const [summary, setSummary] = useState<CompanySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        // distributorService now returns Promise<ApiResponse<T>>
        const [contributorsRes, summaryRes] = await Promise.all([
          distributorService.getTopContributors(),
          distributorService.getCompanySummary()
        ]);

        if (contributorsRes.success) {
          setTopInvestors(contributorsRes.data); // Accessing .data from ApiResponse
        }
        if (summaryRes.success) {
          setSummary(summaryRes.data); // Accessing .data from ApiResponse
        }
        
        if (!contributorsRes.success || !summaryRes.success) {
          setError(contributorsRes.message || summaryRes.message || "Failed to load data");
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred");
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
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-bold tracking-widest uppercase text-[10px]">Syncing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative z-10 animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-hidden">
      
      {/* Header - Compact */}
      <div className="shrink-0 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-5">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 mb-1">
            Client and <span className="text-emerald-600">AUM Insights</span>
          </h1>
          <p className="text-slate-500 font-medium text-xs lg:text-sm max-w-xl">
            Real-time synchronization of contributor pipelines.
          </p>
        </div>
        <div className="flex gap-2.5">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-xs hover:border-emerald-600 hover:text-emerald-600 transition-all shadow-sm active:scale-95">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>
          <button className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all shadow-md active:scale-95">
            Generate Report
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-0.5 pb-4 flex flex-col gap-5 scrollbar-none">
        
        {/* KPI Section - Smaller Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
          {kpis.map((kpi) => (
            <div key={kpi.name} className="bg-white p-5 rounded-[1.75rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-400/50 hover:shadow-md transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-12 -mt-12 group-hover:scale-125 transition-transform duration-700 pointer-events-none opacity-50" />
              
              <div className="flex items-center gap-4 relative z-10">
                <div className={`w-11 h-11 ${kpi.bgClass} ${kpi.textClass} rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500`}>
                  <kpi.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest mb-0.5">{kpi.name}</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">{kpi.value}</h3>
                    <div className={`flex items-center gap-0.5 text-[10px] font-black ${kpi.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {kpi.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {kpi.change}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Table/List Area - Expanded Room */}
        <div className="hidden lg:flex flex-col flex-1 min-h-0">
          <DesktopContributorTable investors={topInvestors} />
        </div>

        <div className="lg:hidden flex flex-col flex-1 min-h-0 pb-10">
          <MobileContributorList investors={topInvestors} />
        </div>

      </div>
    </div>
  );
}