"use client";

import React, { useState, useEffect } from "react";
import { formatCompactNumber } from "@/lib/utils";
import {
  distributorService,
  TopContributor,
} from "@/services/distributor.service";
import DesktopContributorTable from "@/components/distributor/dashboard/DesktopContributorTable";
import MobileContributorList from "@/components/distributor/dashboard/MobileContributorList";
import {
  TrendingUp,
  Users,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
} from "lucide-react";

// ─── GLOBAL CACHE TO SURVIVE TAB SWITCHES ───
let globalTopInvestorsCache: TopContributor[] | null = null;
let globalSummaryCache: any | null = null;
let globalDashboardPromise: Promise<void> | null = null;

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function DistributorDashboard() {
  const [topInvestors, setTopInvestors] = useState<TopContributor[]>(globalTopInvestorsCache || []);
  const [summary, setSummary] = useState<any | null>(globalSummaryCache);
  // Default to loading ONLY if cache is empty
  const [isLoading, setIsLoading] = useState(!globalTopInvestorsCache || !globalSummaryCache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // 1. INSTANT RETURN: If data is already cached, bypass network entirely
      if (globalTopInvestorsCache && globalSummaryCache) {
        setTopInvestors(globalTopInvestorsCache);
        setSummary(globalSummaryCache);
        setIsLoading(false);
        return;
      }

      // 2. PROMISE HOOKING: If another component already started the fetch, wait for it
      if (globalDashboardPromise) {
        setIsLoading(true);
        await globalDashboardPromise;
        setTopInvestors(globalTopInvestorsCache || []);
        setSummary(globalSummaryCache);
        setIsLoading(false);
        return;
      }

      // 3. FIRST LOAD: Fetch from API and save to Global Cache
      setIsLoading(true);
      globalDashboardPromise = (async () => {
        try {
          const [contributorsRes, summaryRes] = await Promise.all([
            distributorService.getTopContributors(),
            distributorService.getCompanySummary(),
          ]);

          if (contributorsRes.success) {
            globalTopInvestorsCache = contributorsRes.data;
          }
          if (summaryRes.success) {
            globalSummaryCache = summaryRes.data;
          }

          if (!contributorsRes.success || !summaryRes.success) {
            setError(
              contributorsRes.message ||
                summaryRes.message ||
                "Failed to load data",
            );
          }
        } catch (err: any) {
          setError(err.message || "An unexpected error occurred");
        }
      })();

      await globalDashboardPromise;
      setTopInvestors(globalTopInvestorsCache || []);
      setSummary(globalSummaryCache);
      setIsLoading(false);
    };

    fetchDashboardData();
  }, []);

  const kpis = summary
    ? [
        {
          name: "Total AUM",
          value: formatCompactNumber(summary.total_current),
          fullValue: `₹${summary.total_current.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
          change: `${(((summary.total_current - summary.total_invested) / summary.total_invested) * 100).toFixed(1)}%`,
          isPositive: summary.total_current >= summary.total_invested,
          icon: Briefcase,
          bgClass: "bg-[var(--fin-brand-50)]",
          textClass: "text-[var(--fin-brand-600)]",
        },
        {
          name: "Total Invested",
          value: formatCompactNumber(summary.total_invested),
          fullValue: `₹${summary.total_invested.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
          change: "Capital",
          isPositive: true,
          icon: TrendingUp,
          bgClass: "bg-[var(--fin-brand-50)]",
          textClass: "text-[var(--fin-brand-600)]",
        },
        {
          name: "Total Clients",
          value: summary.investor_count.toLocaleString(),
          fullValue: summary.investor_count.toLocaleString("en-IN"),
          change: "Active",
          isPositive: true,
          icon: Users,
          bgClass: "bg-[var(--fin-brand-50)]",
          textClass: "text-[var(--fin-brand-600)]",
        },
      ]
    : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[var(--fin-brand-600)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--fin-aux-text)] font-bold tracking-widest uppercase text-[10px]">
            Syncing...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative z-10 animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-hidden">
      {/* Header - Compact */}
      <div className="shrink-0 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-5">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-[var(--fin-heading-primary)] mb-1">
            Client and <span className="text-[var(--fin-brand-600)]">AUM Insights</span>
          </h1>
          <p className="text-[var(--fin-muted-text)] font-medium text-xs lg:text-sm max-w-xl">
            Synchronization of contributor pipelines.
          </p>
        </div>
      </div>

      {/* KPI Section - Smaller Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0 mb-6">
          {kpis.map((kpi) => (
            <div
              key={kpi.name}
              className="bg-[var(--fin-table-bg)] p-5 rounded-md border relative overflow-hidden group hover:bg-[var(--fin-brand-600)] hover:border-[var(--fin-brand-600)] hover:shadow-md transition-all duration-300 cursor-default"
              style={{ borderColor: 'var(--fin-kpi-border)', boxShadow: '0 4px 15px var(--fin-kpi-shadow)' }}
            >
              {/* --- KPI (fades out on hover) --- */}
              <div className="group-hover:opacity-0 transition-opacity duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--fin-brand-50)] rounded-full -mr-12 -mt-12 group-hover:scale-125 transition-transform duration-700 pointer-events-none opacity-50" />

                <div className="flex items-center gap-4 relative z-10">
                  <div
                    className={`w-11 h-11 ${kpi.bgClass} ${kpi.textClass} rounded-md flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500`}
                  >
                    <kpi.icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[var(--fin-aux-text)] font-bold uppercase text-[9px] tracking-widest mb-0.5">
                      {kpi.name}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-xl lg:text-2xl font-black text-[var(--fin-heading-primary)] tracking-tight">
                        {kpi.value}
                      </h3>
                      <div
                        className={`flex items-center gap-0.5 text-[10px] font-black ${kpi.isPositive ? "text-[var(--fin-brand-600)]" : "text-[var(--fin-badge-danger-text)]"}`}
                      >
                        {kpi.isPositive ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        {kpi.change}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- HOVER STATE (Full Value only, fades in on hover) --- */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                <h3 className="text-lg lg:text-xl font-black text-[var(--fin-btn-primary-text)] tracking-tight">
                  {kpi.fullValue}
                </h3>
              </div>
            </div>
          ))}
        </div>

      <div className="flex-1 overflow-y-auto pr-0.5 pb-4 flex flex-col gap-5 scrollbar-none">
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