"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { AlertCircle, Loader2, ArrowRight, Filter } from "lucide-react";
import InvestorSidebar from "@/components/investor/InvestorSidebar";
import { investorService } from "@/services/investor.service";

export default function InvestorSystematicTransactions() {
  // --- Filtering State ---
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterRegistrar, setFilterRegistrar] = useState("ALL");
  const [filterGroupBy, setFilterGroupBy] = useState("NONE");

  // --- Data State ---
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<any[]>([]);

  /**
   * Fetch Report Data whenever filters (except GroupBy) change
   */
  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await investorService.getSystematicReport({
        type: filterType === "ALL" ? undefined : filterType,
        status: filterStatus === "ALL" ? undefined : filterStatus,
        registrar: filterRegistrar === "ALL" ? undefined : filterRegistrar,
      });

      if (response.success && response.data) {
        setReportData(response.data);
      } else {
        setReportData([]);
      }
    } catch (error) {
      console.error("Failed to fetch systematic transactions:", error);
      setReportData([]);
    } finally {
      setIsLoading(false);
    }
  }, [filterType, filterStatus, filterRegistrar]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  /**
   * Group Data Logic
   */
  const groupedData = useMemo(() => {
    if (filterGroupBy === "NONE") {
      return { "All Records": reportData };
    }

    const groups: Record<string, any[]> = {};
    reportData.forEach((item) => {
      let key = "Other";
      if (filterGroupBy === "SCHEME") {
        key = item.scheme_name || "Unknown Scheme";
      } else if (filterGroupBy === "AMC") {
        key = item.amc_code || "Unknown AMC";
      } else if (filterGroupBy === "REGISTRAR") {
        key = item.source || "Unknown Registrar";
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    return groups;
  }, [reportData, filterGroupBy]);

  /**
   * Status Badge Logic
   */
  const getStatusBadge = (item: any) => {
    const now = new Date();
    if (item.termination_date) {
      return (
        <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-md border border-red-100">
          Terminated
        </span>
      );
    }
    if (item.end_date && new Date(item.end_date) < now) {
      return (
        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-md border border-slate-200">
          Matured
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-md border border-emerald-100">
        Active
      </span>
    );
  };

  /**
   * Date Formatter
   */
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    // MAIN WRAPPER
    <div className="flex min-h-screen w-full bg-slate-50">
      {/* ─── INVESTOR SIDEBAR ─── */}
      <InvestorSidebar
        onExportHoldings={() => {}}
        onOpenCapitalGains={() => {}}
        isExporting={false}
        isPortfolioLoaded={true}
      />

      {/* ─── PAGE CONTENT ─── */}
      <div className="relative flex-1 h-screen overflow-y-auto flex flex-col p-4 sm:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out gap-6">
        {/* HEADER */}
        <div className="shrink-0 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 mb-1 flex items-center gap-3">
              My Systematic{" "}
              <span className="text-investor-600">Transactions</span>
            </h1>
            <p className="text-slate-500 font-medium text-sm">
              View your active and historical SIP, STP, and SWP mandates.
            </p>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center gap-4 z-20">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-investor-500/20 focus:border-investor-500 transition-all cursor-pointer"
              >
                <option value="ALL">All Types</option>
                <option value="SIP">SIPs Only</option>
                <option value="STP">STPs Only</option>
                <option value="SWP">SWPs Only</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-investor-500/20 focus:border-investor-500 transition-all cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="CURRENTLY_RUNNING">Active & Running</option>
                <option value="FORTHCOMING">Forthcoming</option>
                <option value="PREMATURELY_TERMINATED">
                  Prematurely Terminated
                </option>
                <option value="DUE_TO_MATURITY">Matured</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Registrar
              </label>
              <select
                value={filterRegistrar}
                onChange={(e) => setFilterRegistrar(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-investor-500/20 focus:border-investor-500 transition-all cursor-pointer"
              >
                <option value="ALL">All Registrars</option>
                <option value="CAMS">CAMS</option>
                <option value="KARVY">KARVY</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Group By
              </label>
              <select
                value={filterGroupBy}
                onChange={(e) => setFilterGroupBy(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-investor-500/20 focus:border-investor-500 transition-all cursor-pointer"
              >
                <option value="NONE">No Grouping</option>
                <option value="SCHEME">Scheme Name</option>
                <option value="AMC">AMC Code</option>
                <option value="REGISTRAR">Registrar (CAMS/KARVY)</option>
              </select>
            </div>
          </div>
        </div>

        {/* DATA VIEW CONTAINER */}
        <div className="bg-white border border-slate-200 rounded-md shadow-sm flex flex-col flex-1 min-h-0 w-full overflow-hidden relative z-10">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <Loader2 className="w-8 h-8 text-investor-500 animate-spin mb-4" />
              <p className="text-slate-500 font-medium text-sm">
                Loading your mandates...
              </p>
            </div>
          ) : reportData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="w-16 h-16 bg-investor-50 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-investor-600" />
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-2">
                No Records Found
              </h3>
              <p className="text-slate-500 text-sm max-w-md text-center">
                We couldn't find any mandates matching your selected filters.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-y-auto flex-1 h-full">
              {Object.entries(groupedData).map(([groupName, items]) => (
                <div key={groupName} className="mb-6 last:mb-0">
                  {/* Group Header (Hidden if 'No Grouping' is selected) */}
                  {filterGroupBy !== "NONE" && (
                    <div className="bg-slate-100/80 px-6 py-3 border-y border-slate-200 sticky top-0 z-20 backdrop-blur-sm">
                      <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">
                        {groupName}{" "}
                        <span className="text-slate-400 ml-2">
                          ({items.length})
                        </span>
                      </h3>
                    </div>
                  )}

                  <table className="w-full text-left text-sm whitespace-nowrap">
                    {/* Table Header (Only show once if not grouped, or show under each group for context) */}
                    {(filterGroupBy === "NONE" ||
                      Object.keys(groupedData)[0] === groupName) && (
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 sticky top-0 z-10">
                        <tr>
                          <th className="px-6 py-4 font-bold tracking-wide">
                            Type
                          </th>
                          <th className="px-6 py-4 font-bold tracking-wide">
                            Scheme Details
                          </th>
                          <th className="px-6 py-4 font-bold tracking-wide">
                            Folio No
                          </th>
                          <th className="px-6 py-4 font-bold tracking-wide">
                            Amount
                          </th>
                          <th className="px-6 py-4 font-bold tracking-wide">
                            Period
                          </th>
                          <th className="px-6 py-4 font-bold tracking-wide">
                            Status
                          </th>
                        </tr>
                      </thead>
                    )}
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-slate-50/50 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-slate-100 text-slate-700 font-black rounded text-xs border border-slate-200">
                              {item.systematic_type || "N/A"}
                            </span>
                            <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                              {item.source}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-800 whitespace-normal min-w-[200px] max-w-sm">
                              {item.scheme_name}
                            </div>
                            {item.systematic_type === "STP" &&
                              item.target_scheme && (
                                <div className="text-xs text-slate-500 mt-2 flex items-start gap-1.5 whitespace-normal">
                                  <ArrowRight className="w-3.5 h-3.5 mt-0.5 text-investor-500 shrink-0" />
                                  <span className="font-medium text-slate-600">
                                    {item.target_scheme}
                                  </span>
                                </div>
                              )}
                          </td>
                          <td className="px-6 py-4 text-slate-600 font-medium">
                            {item.folio_number}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-black text-slate-900">
                              {new Intl.NumberFormat("en-IN", {
                                style: "currency",
                                currency: "INR",
                                maximumFractionDigits: 0,
                              }).format(item.amount)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-slate-800 font-bold">
                              {formatDate(item.start_date)}
                            </div>
                            <div className="text-xs font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">
                              To {formatDate(item.end_date)}
                            </div>
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(item)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
