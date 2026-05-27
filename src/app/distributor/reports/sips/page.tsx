"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  User,
  IndianRupee,
  FileText,
  X,
  ArrowRight,
  CalendarClock,
  Briefcase,
  Hash,
  CalendarRange,
  Clock,
  Search,
} from "lucide-react";
import { formatCompactNumber, formatCurrency } from "@/lib/utils";
import {
  distributorService,
  SipSummary,
  InvestorSip,
  SipDetail,
} from "@/services/distributor.service";

export default function ActiveSipsDashboard() {
  // --- States ---
  const [summary, setSummary] = useState<SipSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // --- Search States ---
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Modal 1: Investor SIP List
  const [selectedInvestorId, setSelectedInvestorId] = useState<string | null>(
    null,
  );
  const [selectedInvestorName, setSelectedInvestorName] = useState<string>("");
  const [investorSips, setInvestorSips] = useState<InvestorSip[]>([]);
  const [isLoadingSips, setIsLoadingSips] = useState(false);

  // Modal 2: SIP Detail
  const [selectedSipInfo, setSelectedSipInfo] = useState<{
    id: string;
    source: string;
  } | null>(null);
  const [sipDetail, setSipDetail] = useState<SipDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // ─── DEBOUNCE EFFECT FOR SEARCH ───
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // --- Data Fetching ---
  useEffect(() => {
    let isMounted = true;
    const fetchSummary = async () => {
      try {
        setIsSearching(true);
        const res =
          await distributorService.getCompanySipSummary(debouncedSearch);
        if (isMounted && res.success) setSummary(res.data);
      } catch (error) {
        console.error("Failed to load SIP summary", error);
      } finally {
        if (isMounted) {
          setIsLoadingSummary(false);
          setIsSearching(false);
        }
      }
    };
    fetchSummary();

    return () => {
      isMounted = false;
    };
  }, [debouncedSearch]);

  const openInvestorSips = async (investorId: string, investorName: string) => {
    setSelectedInvestorId(investorId);
    setSelectedInvestorName(investorName);
    setIsLoadingSips(true);
    try {
      const res = await distributorService.getInvestorSips(investorId);
      if (res.success) setInvestorSips(res.data);
    } catch (error) {
      console.error("Failed to load investor SIPs", error);
    } finally {
      setIsLoadingSips(false);
    }
  };

  const openSipDetail = async (id: string, source: string) => {
    setSelectedSipInfo({ id, source });
    setIsLoadingDetail(true);
    try {
      const res = await distributorService.getSipDetail(source, id);
      if (res.success) setSipDetail(res.data);
    } catch (error) {
      console.error("Failed to load SIP details", error);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const closeInvestorList = () => {
    setSelectedInvestorId(null);
    setInvestorSips([]);
  };

  const closeSipDetail = () => {
    setSelectedSipInfo(null);
    setSipDetail(null);
  };

  if (isLoadingSummary) {
    return (
      <div className="flex-1 w-full min-h-[calc(100vh-5rem)] flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-distributor-600 rounded-full animate-spin"></div>
          <p className="text-sm font-bold animate-pulse">
            Loading Active SIP Book...
          </p>
        </div>
      </div>
    );
  }

  return (
    // RELATIVE CONTAINER: Contains the absolute modals so they respect the sidebar
    <div className="relative flex-1 w-full h-[calc(100vh-5rem)] flex flex-col p-4 sm:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out gap-6 lg:gap-8">
      {/* ─── PAGE HEADER & STATS ─── */}
      <div className="shrink-0">
        <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 mb-1">
          Active <span className="text-distributor-600">SIP Book</span>
        </h1>
        <p className="text-slate-500 font-medium text-sm mb-6">
          Real-time aggregation of active ongoing Systematic Investment Plans.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
          <div className="bg-white border border-slate-200 rounded-md p-6 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 bg-distributor-50 text-distributor-600 rounded-full flex items-center justify-center shrink-0">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                Total Active SIPs
              </p>
              <h2 className="text-3xl font-black text-slate-800">
                {summary?.total_company_sips || 0}
              </h2>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-md p-6 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
              <IndianRupee className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                Monthly Inflow (Expected)
              </p>
              <h2 className="text-3xl font-black text-slate-800">
                {formatCompactNumber(summary?.total_company_value || 0)}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* ─── COMPANY INVESTOR LIST ─── */}
      <div className="bg-white border border-slate-200 rounded-md shadow-sm flex flex-col flex-1 min-h-0 w-full overflow-hidden">
        {/* ─── SEARCH BAR HEADER ─── */}
        <div className="p-5 border-b border-slate-100 bg-white flex flex-col sm:flex-row justify-between sm:items-center gap-4 rounded-t-2xl shrink-0">
          <h3 className="font-bold text-slate-800">
            Investors & their Active SIPs
          </h3>
          <div className="relative w-full sm:max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search investors by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-distributor-500/20 focus:border-distributor-500 transition-all outline-none"
            />
            {isSearching && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-slate-300 border-t-distributor-600 rounded-full animate-spin" />
            )}
          </div>
        </div>

        <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          {/* DESKTOP VIEW (TABLE) - Hidden on mobile */}
          <table className="hidden md:table w-full text-left border-collapse relative">
            <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
              <tr className="text-xs uppercase tracking-wider font-black text-slate-400">
                <th className="p-4 sm:p-5 font-semibold">Investor Name</th>
                <th className="p-4 sm:p-5 font-semibold text-center">
                  Active SIP Count
                </th>
                <th className="p-4 sm:p-5 font-semibold text-right">
                  Total SIP Value (₹)
                </th>
                <th className="p-4 sm:p-5 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody
              className={`divide-y divide-slate-100 ${isSearching && summary ? "opacity-50" : "opacity-100"} transition-opacity duration-200`}
            >
              {summary?.investor_breakdown.map((inv) => (
                <tr
                  key={inv.investor_id}
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="p-4 sm:p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-distributor-100 text-distributor-700 flex items-center justify-center text-xs font-bold shrink-0">
                        {inv.investor_name.charAt(0)}
                      </div>
                      <span className="text-sm font-bold text-slate-800">
                        {inv.investor_name}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 sm:p-5 text-center">
                    <span className="inline-flex items-center justify-center px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-bold">
                      {inv.total_sips}
                    </span>
                  </td>
                  <td className="p-4 sm:p-5 text-right font-black text-distributor-700">
                    {formatCurrency(Number(inv.total_sip_value))}
                  </td>
                  <td className="p-4 sm:p-5 text-center">
                    <button
                      onClick={() =>
                        openInvestorSips(inv.investor_id, inv.investor_name)
                      }
                      className="text-sm font-bold text-distributor-600 hover:text-distributor-800 transition-colors flex items-center gap-1 mx-auto group-hover:translate-x-1"
                    >
                      View SIPs <ArrowRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {(!summary?.investor_breakdown ||
                summary.investor_breakdown.length === 0) && (
                <tr>
                  <td
                    colSpan={4}
                    className="p-8 text-center text-slate-400 font-medium text-sm"
                  >
                    {searchTerm
                      ? "No active SIPs found matching your search."
                      : "No active SIPs found in the system."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* MOBILE VIEW (CARDS) - Hidden on desktop */}
          <div
            className={`flex md:hidden flex-col divide-y divide-slate-100 ${isSearching && summary ? "opacity-50" : "opacity-100"} transition-opacity duration-200`}
          >
            {summary?.investor_breakdown.map((inv) => (
              <div
                key={inv.investor_id}
                className="p-4 flex flex-col gap-4 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-distributor-100 text-distributor-700 flex items-center justify-center text-sm font-bold shrink-0">
                      {inv.investor_name.charAt(0)}
                    </div>
                    <span className="text-base font-bold text-slate-800">
                      {inv.investor_name}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      openInvestorSips(inv.investor_id, inv.investor_name)
                    }
                    className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-distributor-600 hover:bg-distributor-50 transition-colors shrink-0 border border-slate-100"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                      Active SIPs
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                      {inv.total_sips}
                    </p>
                  </div>
                  <div className="bg-distributor-50/50 rounded-xl p-3 border border-distributor-100">
                    <p className="text-[10px] font-black uppercase tracking-wider text-distributor-600/70 mb-1">
                      Total Value
                    </p>
                    <p className="text-sm font-black text-distributor-700">
                      {formatCurrency(Number(inv.total_sip_value))}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {(!summary?.investor_breakdown ||
              summary.investor_breakdown.length === 0) && (
              <div className="p-8 text-center text-slate-400 font-medium text-sm">
                {searchTerm
                  ? "No active SIPs found matching your search."
                  : "No active SIPs found in the system."}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── MODAL 1: INVESTOR SIP LIST ─── */}
      {selectedInvestorId && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-in fade-in duration-200 overflow-hidden">
          <div
            className="absolute inset-0 bg-white/60 backdrop-blur-sm"
            onClick={closeInvestorList}
          />

          <div className="relative w-full max-w-4xl bg-white rounded-md shadow-2xl flex flex-col max-h-full border border-slate-200/50 animate-in zoom-in-95 slide-in-from-bottom-4 duration-200">
            <div className="flex justify-between items-center bg-white border-b border-slate-100 p-5 px-6 shrink-0 rounded-t-2xl">
              <div>
                <h3 className="text-lg lg:text-xl font-black text-slate-800 tracking-tight">
                  {selectedInvestorName}&apos;s SIPs
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Click any SIP row to view full mandate details.
                </p>
              </div>
              <button
                onClick={closeInvestorList}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 bg-slate-50/50 flex-1 p-6 rounded-b-2xl">
              {isLoadingSips ? (
                <div className="flex flex-col items-center justify-center p-12 gap-3 text-slate-400">
                  <div className="w-6 h-6 border-2 border-slate-200 border-t-distributor-600 rounded-full animate-spin" />
                  <p className="text-xs font-bold">Loading SIP data...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {investorSips.map((sip, idx) => (
                    <div
                      key={`${sip.id}-${idx}`}
                      onClick={() => openSipDetail(sip.id, sip.source)}
                      className="bg-white border border-slate-200 rounded-md p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:border-distributor-300 hover:shadow-md transition-all duration-200 group"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span
                            className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm ${sip.source === "CAMS" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}
                          >
                            {sip.source}
                          </span>
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-sm">
                            {sip.status || "ACTIVE"}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-800 line-clamp-2 pr-4 group-hover:text-distributor-700 transition-colors">
                          {sip.product_name}
                        </h4>
                        <p className="text-sm text-slate-500 mt-1 font-mono">
                          Folio: {sip.folio_no}
                        </p>
                      </div>

                      <div className="flex items-center sm:items-end justify-between sm:flex-col shrink-0 sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Installment
                          </span>
                          <span className="text-xl font-black text-slate-900">
                            {formatCurrency(Number(sip.installment_amount))}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-500 capitalize">
                          {sip.frequency?.toLowerCase() || "Monthly"}
                        </p>
                      </div>
                    </div>
                  ))}
                  {investorSips.length === 0 && (
                    <div className="text-center p-8 text-slate-500 font-medium">
                      No active SIPs found for this investor.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: SIP DETAILS (Detailed Drill-down) ─── */}
      {selectedSipInfo && sipDetail && !isLoadingDetail && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-in fade-in duration-200 overflow-hidden">
          <div
            className="absolute inset-0 bg-white/60 backdrop-blur-sm"
            onClick={closeSipDetail}
          />

          <div className="relative w-full max-w-2xl bg-white rounded-md shadow-2xl flex flex-col max-h-full border border-slate-200/50 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start bg-slate-50 border-b border-slate-200 p-6 rounded-t-2xl shrink-0">
              <div className="pr-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                    {sipDetail.rta} Data
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                    {sipDetail.status || "Active"}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-800 leading-tight">
                  {sipDetail.scheme_name}
                </h3>
              </div>
              <button
                onClick={closeSipDetail}
                className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 space-y-6 rounded-b-2xl">
              {/* Highlight Amount Box */}
              <div className="bg-distributor-50 border border-distributor-100 rounded-md p-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-black text-distributor-600/70 uppercase tracking-widest mb-1">
                    Installment Amount
                  </p>
                  <p className="text-3xl font-black text-distributor-800">
                    {formatCurrency(Number(sipDetail.sip_amount))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-black text-distributor-600/70 uppercase tracking-widest mb-1">
                    Frequency
                  </p>
                  <p className="text-lg font-bold text-distributor-700 capitalize">
                    {sipDetail.frequency?.toLowerCase() || "Monthly"}
                  </p>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-md p-4 flex gap-3">
                  <User className="w-5 h-5 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                      Investor Name
                    </p>
                    <p className="text-sm font-bold text-slate-800">
                      {sipDetail.investor_name}
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-md p-4 flex gap-3">
                  <Hash className="w-5 h-5 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                      Folio Number
                    </p>
                    <p className="text-sm font-mono font-bold text-slate-800">
                      {sipDetail.folio_no}
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-md p-4 flex gap-3">
                  <CalendarClock className="w-5 h-5 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                      Start Date
                    </p>
                    <p className="text-sm font-bold text-slate-800">
                      {sipDetail.from_date
                        ? new Date(sipDetail.from_date).toLocaleDateString(
                            "en-IN",
                            { day: "numeric", month: "short", year: "numeric" },
                          )
                        : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-md p-4 flex gap-3">
                  <CalendarRange className="w-5 h-5 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                      Termination Date
                    </p>
                    <p className="text-sm font-bold text-slate-800">
                      {sipDetail.to_date
                        ? new Date(sipDetail.to_date).toLocaleDateString(
                            "en-IN",
                            { day: "numeric", month: "short", year: "numeric" },
                          )
                        : "Perpetual (No End Date)"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Remarks/Notes (If any exist) */}
              {sipDetail.remarks && (
                <div className="bg-amber-50 border border-amber-100 rounded-md p-4">
                  <p className="text-[10px] font-black text-amber-600/70 uppercase tracking-widest mb-1">
                    RTA Remarks
                  </p>
                  <p className="text-sm font-medium text-amber-900">
                    {sipDetail.remarks}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
