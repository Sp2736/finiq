"use client";

import React, { useState, useMemo } from "react";
import { AlertCircle, Loader2, ArrowRight, Play, Download, Search } from "lucide-react";
import InvestorSidebar from "@/components/investor/InvestorSidebar";
import { investorService } from "@/services/investor.service";
import { generateSystematicPDF } from "@/lib/systematicReportExport";

const TRANSACTION_TYPES = ["All", "SIP", "STP", "SWP"];

const MODES = [
  "All",
  "Running",
  "Forthcoming",
  "Terminated",
  "Procured",
  "Matured",
  "Expired",
  "Deleted",
  "Status",
  "Analysis",
];

const REGISTRARS = ["All", "CAMS", "KARVY"];
const GROUP_BY_OPTIONS = ["None", "Scheme", "AMC", "Registrar"];

export default function InvestorSystematicTransactions() {
  // UI Selection State
  const [filterType, setFilterType] = useState(TRANSACTION_TYPES[0]);
  const [filterStatus, setFilterStatus] = useState(MODES[0]);
  const [filterRegistrar, setFilterRegistrar] = useState(REGISTRARS[0]);
  const [filterGroupBy, setFilterGroupBy] = useState(GROUP_BY_OPTIONS[0]);

  // Applied Filter State
  const [appliedType, setAppliedType] = useState(TRANSACTION_TYPES[0]);
  const [appliedStatus, setAppliedStatus] = useState(MODES[0]);
  const [appliedRegistrar, setAppliedRegistrar] = useState(REGISTRARS[0]);
  const [appliedGroupBy, setAppliedGroupBy] = useState(GROUP_BY_OPTIONS[0]);

  // Data State
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);

  // Main Submit Trigger
  const handleGenerateReport = async () => {
    setIsLoading(true);
    setHasSearched(true);

    setAppliedType(filterType);
    setAppliedStatus(filterStatus);
    setAppliedRegistrar(filterRegistrar);
    setAppliedGroupBy(filterGroupBy);

    try {
      // The investor API might map back to slightly different fields.
      const response = await investorService.getSystematicReport({
        type: filterType === "All" ? undefined : filterType,
        status: filterStatus === "All" ? undefined : filterStatus,
        registrar: filterRegistrar === "All" ? undefined : filterRegistrar,
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
  };

  const handleExportPDF = () => {
    let pdfGroupedData = null;

    if (appliedGroupBy !== "None") {
      const groups: Record<string, { count: number; totalAmount: number }> = {};
      
      reportData.forEach((item) => {
        let key = "Other";
        if (appliedGroupBy === "Scheme") key = item.scheme_name || "Unknown Scheme";
        else if (appliedGroupBy === "AMC") key = item.amc_code || "Unknown AMC";
        else if (appliedGroupBy === "Registrar") key = item.source || "Unknown Registrar";

        if (!groups[key]) groups[key] = { count: 0, totalAmount: 0 };
        groups[key].count += 1;
        groups[key].totalAmount += Number(item.amount) || 0;
      });

      pdfGroupedData = Object.entries(groups)
        .map(([name, data]) => ({
          groupName: name,
          count: data.count,
          totalAmount: data.totalAmount,
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount);
    }

    if (appliedGroupBy === "None" && reportData.length === 0) return;
    if (appliedGroupBy !== "None" && (!pdfGroupedData || pdfGroupedData.length === 0)) return;

    // Provide default string to prevent toTitleCase error since column is omitted visually
    const exportData = reportData.map(item => ({
      ...item,
      investor_name: item.investor_name || "My Portfolio"
    }));

    generateSystematicPDF(
      exportData,
      appliedType,
      "My Portfolio",
      pdfGroupedData,
      appliedGroupBy
    );
  };

  const groupedData = useMemo(() => {
    if (appliedGroupBy === "None") {
      return { "All Records": reportData };
    }

    const groups: Record<string, any[]> = {};
    reportData.forEach((item) => {
      let key = "Other";
      if (appliedGroupBy === "Scheme") key = item.scheme_name || "Unknown Scheme";
      else if (appliedGroupBy === "AMC") key = item.amc_code || "Unknown AMC";
      else if (appliedGroupBy === "Registrar") key = item.source || "Unknown Registrar";

      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    return groups;
  }, [reportData, appliedGroupBy]);

  const getStatusBadge = (item: any) => {
    const now = new Date();
    if (item.termination_date) {
      return <span className="px-2 py-1 bg-red-50 text-red-700 text-[10px] font-bold rounded border border-red-100 uppercase tracking-wider">Terminated</span>;
    }
    if (item.end_date && new Date(item.end_date) < now) {
      return <span className="px-2 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold rounded border border-slate-200 uppercase tracking-wider">Expired</span>;
    }
    return <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded border border-emerald-100 uppercase tracking-wider">Running</span>;
  };

  const hasData = reportData.length > 0;

  return (
    <div className="flex h-[100dvh] md:h-screen w-full bg-slate-50 overflow-hidden">
      
      {/* ─── INVESTOR SIDEBAR ─── */}
      <InvestorSidebar
        onExportHoldings={() => {}}
        onOpenCapitalGains={() => {}}
        isExporting={false}
        isPortfolioLoaded={true}
      />

      {/* ─── PAGE CONTENT CONTAINER ─── */}
      <div className="relative flex-1 flex flex-col w-full min-w-0 h-full overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out">
        
        {/* ─── HEADER (Always Fixed Top) ─── */}
        <div className="flex-none px-4 pt-4 sm:px-6 sm:pt-6 md:px-8 md:pt-8 shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900 mb-1 flex flex-wrap items-center gap-2 md:gap-3">
                My Systematic <span className="text-investor-600">Transactions</span>
              </h1>
              <p className="text-slate-500 font-medium text-sm">
                View your active and historical SIP, STP, and SWP mandates.
              </p>
            </div>
            <button
              onClick={handleExportPDF}
              disabled={!hasSearched || !hasData || isLoading}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-investor-600 hover:bg-investor-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-md shadow-sm transition-all shrink-0"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>

        {/* ─── SCROLLABLE AREA (Mobile) / FIXED AREA (Tablet & Desktop) ─── */}
        <div className="flex-1 flex flex-col overflow-y-auto md:overflow-hidden px-4 pb-4 sm:px-6 sm:pb-6 md:px-8 md:pb-8 pt-4 sm:pt-5 md:pt-6 gap-4 md:gap-6">
          
          {/* FILTER BAR */}
          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-end gap-4 z-20 shrink-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4 w-full">
              
              <div className="flex flex-col gap-1 w-full">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Type
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full h-[40px] bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-md px-3 outline-none focus:ring-2 focus:ring-investor-500/20 focus:border-investor-500 transition-all cursor-pointer"
                >
                  {TRANSACTION_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1 w-full">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full h-[40px] bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-md px-3 outline-none focus:ring-2 focus:ring-investor-500/20 focus:border-investor-500 transition-all cursor-pointer"
                >
                  {MODES.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1 w-full">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Registrar
                </label>
                <select
                  value={filterRegistrar}
                  onChange={(e) => setFilterRegistrar(e.target.value)}
                  className="w-full h-[40px] bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-md px-3 outline-none focus:ring-2 focus:ring-investor-500/20 focus:border-investor-500 transition-all cursor-pointer"
                >
                  {REGISTRARS.map((reg) => <option key={reg} value={reg}>{reg}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1 w-full">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Group By
                </label>
                <select
                  value={filterGroupBy}
                  onChange={(e) => setFilterGroupBy(e.target.value)}
                  className="w-full h-[40px] bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-md px-3 outline-none focus:ring-2 focus:ring-investor-500/20 focus:border-investor-500 transition-all cursor-pointer"
                >
                  {GROUP_BY_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              
            </div>
            
            <div className="w-full lg:w-48 shrink-0 mt-2 lg:mt-0">
              <button
                onClick={handleGenerateReport}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-8 h-[40px] bg-investor-600 hover:bg-investor-700 disabled:opacity-70 text-white text-sm font-semibold rounded-md shadow-sm transition-all"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                Generate
              </button>
            </div>
          </div>

          {/* ─── TABLE AREA ─── */}
          <div className="flex flex-col bg-white border border-slate-200 rounded-md shadow-sm z-10 md:flex-1 md:min-h-0">
            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[300px]">
                <Loader2 className="w-8 h-8 text-investor-500 animate-spin mb-4" />
                <p className="text-slate-500 font-medium text-sm">Fetching report data...</p>
              </div>
            ) : hasSearched && hasData ? (
              <div className="w-full overflow-x-auto overflow-y-visible md:overflow-y-auto md:h-full relative">
                {Object.entries(groupedData).map(([groupName, items]) => (
                  <div key={groupName} className="mb-4 md:mb-6 last:mb-0">
                    
                    {/* Group Header */}
                    {appliedGroupBy !== "None" && (
                      <div className="bg-slate-100/80 px-4 md:px-6 py-2.5 md:py-3 border-y border-slate-200 sticky top-0 z-20 backdrop-blur-sm flex justify-between items-center shadow-[0_1px_0_0_#e2e8f0]">
                        <h3 className="text-xs md:text-sm font-black text-slate-700 uppercase tracking-wider">
                          {groupName} <span className="text-slate-400 ml-1">({items.length})</span>
                        </h3>
                      </div>
                    )}

                    {/* Desktop/Tablet Table View */}
                    <table className="hidden md:table w-full text-left text-sm whitespace-nowrap">
                      {(appliedGroupBy === "None" || Object.keys(groupedData)[0] === groupName) && (
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 sticky top-0 z-10 shadow-[0_1px_0_0_#e2e8f0]">
                          <tr>
                            <th className="px-6 py-4 font-bold tracking-wide">Type & Trxn No</th>
                            <th className="px-6 py-4 font-bold tracking-wide">Scheme Details</th>
                            <th className="px-6 py-4 font-bold tracking-wide">Folio No</th>
                            <th className="px-6 py-4 font-bold tracking-wide text-right">Amount</th>
                            <th className="px-6 py-4 font-bold tracking-wide">Period</th>
                            <th className="px-6 py-4 font-bold tracking-wide">Status</th>
                          </tr>
                        </thead>
                      )}
                      <tbody className="divide-y divide-slate-100">
                        {items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors group text-slate-700">
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-1 bg-slate-100 text-slate-700 font-black rounded text-[10px] border border-slate-200">
                                    {item.systematic_type || "N/A"}
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.source}</span>
                                </div>
                                <div className="text-[10px] font-mono font-semibold text-slate-500 tracking-wide bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded w-max">
                                  {item.trxn_no || "N/A"}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-800 whitespace-normal min-w-[200px] max-w-sm leading-tight">
                                {item.scheme_name}
                              </div>
                              {item.systematic_type === "STP" && item.target_scheme && (
                                <div className="text-[11px] text-slate-500 mt-1.5 flex items-start gap-1.5 whitespace-normal">
                                  <ArrowRight className="w-3.5 h-3.5 mt-0.5 text-investor-500 shrink-0" />
                                  <span className="font-medium text-slate-600">{item.target_scheme}</span>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-slate-600 font-medium">
                              {item.folio_number}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="font-black text-slate-900">
                                {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(item.amount)}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-slate-800 font-bold text-xs">
                                {new Date(item.start_date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                              </div>
                              <div className="text-[10px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">
                                To {item.end_date?.startsWith('2999') || item.end_date?.startsWith('2099') ? '—' : new Date(item.end_date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                              </div>
                            </td>
                            <td className="px-6 py-4">{getStatusBadge(item)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Mobile Card View */}
                    <div className="block md:hidden divide-y divide-slate-100 bg-white w-full">
                      {items.map((item, idx) => (
                        <div key={idx} className="p-4 flex flex-col gap-3 hover:bg-slate-50 transition-colors">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="px-2 py-1 bg-slate-100 text-slate-700 font-black rounded text-[10px] border border-slate-200">
                                  {item.systematic_type || "N/A"}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.source}</span>
                                <span className="text-[10px] font-mono font-semibold text-slate-500 tracking-wide bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded w-max">
                                  {item.trxn_no || "N/A"}
                                </span>
                              </div>
                              <div className="font-bold text-slate-800 text-sm leading-snug">{item.scheme_name}</div>
                            </div>
                            <div>{getStatusBadge(item)}</div>
                          </div>

                          <div className="grid grid-cols-2 gap-y-3 gap-x-4 mt-1 border-t border-slate-50 pt-3">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Amount</p>
                              <div className="font-black text-slate-900 text-sm">
                                {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(item.amount)}
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Period</p>
                              <div className="text-xs font-semibold text-slate-700">
                                {new Date(item.start_date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short' })} <span className="font-normal text-slate-400 mx-0.5">to</span> {item.end_date?.startsWith('2999') ? '—' : new Date(item.end_date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short' })}
                              </div>
                            </div>
                            <div className="col-span-2">
                              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Folio No.</p>
                              <div className="text-slate-600 font-mono text-xs font-medium">{item.folio_number}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                ))}
              </div>
            ) : hasSearched ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
                <div className="w-16 h-16 bg-investor-50 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-investor-600" />
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-2">No Records Found</h3>
                <p className="text-slate-500 text-sm max-w-md text-center">
                  We couldn't find any mandates matching your selected filters.
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-2">Ready to Search</h3>
                <p className="text-slate-500 text-sm max-w-md">
                  Select your filters above and click &quot;Generate&quot; to view systematic transactions.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}