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
        <div className="flex flex-col items-center gap-3 text-[var(--fin-aux-text)]">
          <div className="w-8 h-8 border-4 border-[var(--fin-border)] border-t-[var(--fin-brand-600)] rounded-full animate-spin"></div>
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
        <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-[var(--fin-heading-primary)] mb-1">
          Active <span className="text-[var(--fin-brand-600)]">SIP Book</span>
        </h1>
        <p className="text-[var(--fin-muted-text)] font-medium text-sm mb-6">
          Real-time aggregation of active ongoing Systematic Investment Plans.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
          <div className="bg-[var(--fin-table-bg)] border border-[var(--fin-border)] rounded-md p-6 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 bg-[var(--fin-brand-50)] text-[var(--fin-brand-600)] rounded-full flex items-center justify-center shrink-0">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black text-[var(--fin-aux-text)] uppercase tracking-widest mb-1">
                Total Active SIPs
              </p>
              <h2 className="text-3xl font-black text-[var(--fin-heading-tertiary)]">
                {summary?.total_company_sips || 0}
              </h2>
            </div>
          </div>
          <div className="bg-[var(--fin-table-bg)] border border-[var(--fin-border)] rounded-md p-6 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 bg-[var(--fin-badge-success-bg)] text-[var(--fin-badge-success-text)] rounded-full flex items-center justify-center shrink-0">
              <IndianRupee className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black text-[var(--fin-aux-text)] uppercase tracking-widest mb-1">
                Monthly Inflow (Expected)
              </p>
              <h2 className="text-3xl font-black text-[var(--fin-heading-tertiary)]">
                {formatCompactNumber(summary?.total_company_value || 0)}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* ─── COMPANY INVESTOR LIST ─── */}
      <div className="bg-[var(--fin-table-bg)] border border-[var(--fin-border)] rounded-md shadow-sm flex flex-col flex-1 min-h-0 w-full overflow-hidden">
        {/* ─── SEARCH BAR HEADER ─── */}
        <div className="p-5 border-b border-[var(--fin-border-subtle)] bg-[var(--fin-table-bg)] flex flex-col sm:flex-row justify-between sm:items-center gap-4 rounded-t-2xl shrink-0">
          <h3 className="font-bold text-[var(--fin-heading-tertiary)]">
            Investors & their Active SIPs
          </h3>
          <div className="relative w-full sm:max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--fin-aux-text)]" />
            <input
              type="text"
              placeholder="Search investors by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-[var(--fin-page-bg)] border border-[var(--fin-border)] rounded-md text-sm font-semibold text-[var(--fin-table-row-text)] focus:bg-[var(--fin-table-bg)] focus:ring-2 focus:ring-[var(--fin-brand-500)]/20 focus:border-[var(--fin-brand-500)] transition-all outline-none"
            />
            {isSearching && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[var(--fin-border)] border-t-[var(--fin-brand-600)] rounded-full animate-spin" />
            )}
          </div>
        </div>

        <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-[var(--fin-border-subtle)] scrollbar-track-transparent">
          {/* DESKTOP VIEW (TABLE) - Hidden on mobile */}
          <table className="hidden md:table w-full text-left border-collapse relative">
            <thead className="sticky top-0 z-10 bg-[var(--fin-page-bg)]/95 backdrop-blur-sm border-b border-[var(--fin-border)] shadow-sm">
              <tr className="text-xs uppercase tracking-wider font-black text-[var(--fin-aux-text)]">
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
              className={`divide-y divide-[var(--fin-table-row-border)] ${isSearching && summary ? "opacity-50" : "opacity-100"} transition-opacity duration-200`}
            >
              {summary?.investor_breakdown.map((inv) => (
                <tr
                  key={inv.investor_id}
                  className="hover:bg-[var(--fin-page-bg)]/50 transition-colors group"
                >
                  <td className="p-4 sm:p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--fin-brand-100)] text-[var(--fin-brand-700)] flex items-center justify-center text-xs font-bold shrink-0">
                        {inv.investor_name.charAt(0)}
                      </div>
                      <span className="text-sm font-bold text-[var(--fin-heading-tertiary)]">
                        {inv.investor_name}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 sm:p-5 text-center">
                    <span className="inline-flex items-center justify-center px-2.5 py-1 bg-[var(--fin-skeleton-base)] text-[var(--fin-body-text)] rounded-md text-xs font-bold">
                      {inv.total_sips}
                    </span>
                  </td>
                  <td className="p-4 sm:p-5 text-right font-black text-[var(--fin-brand-700)]">
                    {formatCurrency(Number(inv.total_sip_value))}
                  </td>
                  <td className="p-4 sm:p-5 text-center">
                    <button
                      onClick={() =>
                        openInvestorSips(inv.investor_id, inv.investor_name)
                      }
                      className="text-sm font-bold text-[var(--fin-brand-600)] hover:text-[var(--fin-brand-800)] transition-colors flex items-center gap-1 mx-auto group-hover:translate-x-1"
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
                    className="p-8 text-center text-[var(--fin-aux-text)] font-medium text-sm"
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
            className={`flex md:hidden flex-col divide-y divide-[var(--fin-table-row-border)] ${isSearching && summary ? "opacity-50" : "opacity-100"} transition-opacity duration-200`}
          >
            {summary?.investor_breakdown.map((inv) => (
              <div
                key={inv.investor_id}
                className="p-4 flex flex-col gap-4 hover:bg-[var(--fin-page-bg)]/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--fin-brand-100)] text-[var(--fin-brand-700)] flex items-center justify-center text-sm font-bold shrink-0">
                      {inv.investor_name.charAt(0)}
                    </div>
                    <span className="text-base font-bold text-[var(--fin-heading-tertiary)]">
                      {inv.investor_name}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      openInvestorSips(inv.investor_id, inv.investor_name)
                    }
                    className="w-10 h-10 rounded-full bg-[var(--fin-page-bg)] flex items-center justify-center text-[var(--fin-brand-600)] hover:bg-[var(--fin-brand-50)] transition-colors shrink-0 border border-[var(--fin-border-subtle)]"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[var(--fin-page-bg)] rounded-md p-3 border border-[var(--fin-border-subtle)]">
                    <p className="text-[10px] font-black uppercase tracking-wider text-[var(--fin-aux-text)] mb-1">
                      Active SIPs
                    </p>
                    <p className="text-sm font-bold text-[var(--fin-table-row-text)]">
                      {inv.total_sips}
                    </p>
                  </div>
                  <div className="bg-[var(--fin-brand-50)]/50 rounded-md p-3 border border-[var(--fin-brand-100)]">
                    <p className="text-[10px] font-black uppercase tracking-wider text-[var(--fin-brand-600)]/70 mb-1">
                      Total Value
                    </p>
                    <p className="text-sm font-black text-[var(--fin-brand-700)]">
                      {formatCurrency(Number(inv.total_sip_value))}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {(!summary?.investor_breakdown ||
              summary.investor_breakdown.length === 0) && (
              <div className="p-8 text-center text-[var(--fin-aux-text)] font-medium text-sm">
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
            className="absolute inset-0 bg-[var(--fin-table-bg)]/60 backdrop-blur-sm"
            onClick={closeInvestorList}
          />

          <div className="relative w-full max-w-4xl bg-[var(--fin-table-bg)] rounded-md shadow-2xl flex flex-col max-h-full border border-[var(--fin-border)]/50 animate-in zoom-in-95 slide-in-from-bottom-4 duration-200">
            <div className="flex justify-between items-center bg-[var(--fin-table-bg)] border-b border-[var(--fin-border-subtle)] p-5 px-6 shrink-0 rounded-t-2xl">
              <div>
                <h3 className="text-lg lg:text-xl font-black text-[var(--fin-heading-tertiary)] tracking-tight">
                  {selectedInvestorName}&apos;s SIPs
                </h3>
                <p className="text-[var(--fin-muted-text)] text-xs mt-0.5">
                  Click any SIP row to view full mandate details.
                </p>
              </div>
              <button
                onClick={closeInvestorList}
                className="p-2 text-[var(--fin-aux-text)] hover:text-[var(--fin-table-row-text)] hover:bg-[var(--fin-skeleton-base)] rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--fin-border-subtle)] bg-[var(--fin-page-bg)]/50 flex-1 p-6 rounded-b-2xl">
              {isLoadingSips ? (
                <div className="flex flex-col items-center justify-center p-12 gap-3 text-[var(--fin-aux-text)]">
                  <div className="w-6 h-6 border-2 border-[var(--fin-border)] border-t-[var(--fin-brand-600)] rounded-full animate-spin" />
                  <p className="text-xs font-bold">Loading SIP data...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {investorSips.map((sip, idx) => (
                    <div
                      key={`${sip.id}-${idx}`}
                      onClick={() => openSipDetail(sip.id, sip.source)}
                      className="bg-[var(--fin-table-bg)] border border-[var(--fin-border)] rounded-md p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:border-[var(--fin-brand-300)] hover:shadow-md transition-all duration-200 group"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span
                            className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm ${sip.source === "CAMS" ? "bg-[var(--fin-badge-broker-bg)] text-[var(--fin-badge-broker-text)]" : "bg-[var(--fin-badge-admin-bg)] text-[var(--fin-badge-admin-text)]"}`}
                          >
                            {sip.source}
                          </span>
                          <span className="text-xs font-bold text-[var(--fin-badge-success-text)] bg-[var(--fin-badge-success-bg)] px-2 py-0.5 rounded-sm">
                            {sip.status || "ACTIVE"}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-[var(--fin-heading-tertiary)] line-clamp-2 pr-4 group-hover:text-[var(--fin-brand-700)] transition-colors">
                          {sip.product_name}
                        </h4>
                        <p className="text-sm text-[var(--fin-muted-text)] mt-1 font-mono">
                          Folio: {sip.folio_no}
                        </p>
                      </div>

                      <div className="flex items-center sm:items-end justify-between sm:flex-col shrink-0 sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-[var(--fin-border-subtle)]">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-[var(--fin-aux-text)] uppercase tracking-widest">
                            Installment
                          </span>
                          <span className="text-xl font-black text-[var(--fin-heading-primary)]">
                            {formatCurrency(Number(sip.installment_amount))}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-[var(--fin-muted-text)] capitalize">
                          {sip.frequency?.toLowerCase() || "Monthly"}
                        </p>
                      </div>
                    </div>
                  ))}
                  {investorSips.length === 0 && (
                    <div className="text-center p-8 text-[var(--fin-muted-text)] font-medium">
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
            className="absolute inset-0 bg-[var(--fin-table-bg)]/60 backdrop-blur-sm"
            onClick={closeSipDetail}
          />

          <div className="relative w-full max-w-2xl bg-[var(--fin-table-bg)] rounded-md shadow-2xl flex flex-col max-h-full border border-[var(--fin-border)]/50 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start bg-[var(--fin-page-bg)] border-b border-[var(--fin-border)] p-6 rounded-t-2xl shrink-0">
              <div className="pr-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--fin-table-bg)] border border-[var(--fin-border)] text-[var(--fin-body-text)]">
                    {sipDetail.rta} Data
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--fin-badge-success-bg)] text-[var(--fin-badge-success-text)]">
                    {sipDetail.status || "Active"}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-[var(--fin-heading-tertiary)] leading-tight">
                  {sipDetail.scheme_name}
                </h3>
              </div>
              <button
                onClick={closeSipDetail}
                className="p-2 bg-[var(--fin-table-bg)] border border-[var(--fin-border)] text-[var(--fin-aux-text)] hover:text-[var(--fin-table-row-text)] hover:bg-[var(--fin-skeleton-base)] rounded-full transition-all shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--fin-border-subtle)] space-y-6 rounded-b-2xl">
              {/* Highlight Amount Box */}
              <div className="bg-[var(--fin-brand-50)] border border-[var(--fin-brand-100)] rounded-md p-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-black text-[var(--fin-brand-600)]/70 uppercase tracking-widest mb-1">
                    Installment Amount
                  </p>
                  <p className="text-3xl font-black text-[var(--fin-brand-800)]">
                    {formatCurrency(Number(sipDetail.sip_amount))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-black text-[var(--fin-brand-600)]/70 uppercase tracking-widest mb-1">
                    Frequency
                  </p>
                  <p className="text-lg font-bold text-[var(--fin-brand-700)] capitalize">
                    {sipDetail.frequency?.toLowerCase() || "Monthly"}
                  </p>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[var(--fin-table-bg)] border border-[var(--fin-border)] rounded-md p-4 flex gap-3">
                  <User className="w-5 h-5 text-[var(--fin-aux-text)] shrink-0" />
                  <div>
                    <p className="text-[10px] font-black text-[var(--fin-aux-text)] uppercase tracking-widest mb-0.5">
                      Investor Name
                    </p>
                    <p className="text-sm font-bold text-[var(--fin-heading-tertiary)]">
                      {sipDetail.investor_name}
                    </p>
                  </div>
                </div>

                <div className="bg-[var(--fin-table-bg)] border border-[var(--fin-border)] rounded-md p-4 flex gap-3">
                  <Hash className="w-5 h-5 text-[var(--fin-aux-text)] shrink-0" />
                  <div>
                    <p className="text-[10px] font-black text-[var(--fin-aux-text)] uppercase tracking-widest mb-0.5">
                      Folio Number
                    </p>
                    <p className="text-sm font-mono font-bold text-[var(--fin-heading-tertiary)]">
                      {sipDetail.folio_no}
                    </p>
                  </div>
                </div>

                <div className="bg-[var(--fin-table-bg)] border border-[var(--fin-border)] rounded-md p-4 flex gap-3">
                  <CalendarClock className="w-5 h-5 text-[var(--fin-aux-text)] shrink-0" />
                  <div>
                    <p className="text-[10px] font-black text-[var(--fin-aux-text)] uppercase tracking-widest mb-0.5">
                      Start Date
                    </p>
                    <p className="text-sm font-bold text-[var(--fin-heading-tertiary)]">
                      {sipDetail.from_date
                        ? new Date(sipDetail.from_date).toLocaleDateString(
                            "en-IN",
                            { day: "numeric", month: "short", year: "numeric" },
                          )
                        : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="bg-[var(--fin-table-bg)] border border-[var(--fin-border)] rounded-md p-4 flex gap-3">
                  <CalendarRange className="w-5 h-5 text-[var(--fin-aux-text)] shrink-0" />
                  <div>
                    <p className="text-[10px] font-black text-[var(--fin-aux-text)] uppercase tracking-widest mb-0.5">
                      Termination Date
                    </p>
                    <p className="text-sm font-bold text-[var(--fin-heading-tertiary)]">
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
                <div className="bg-[var(--fin-badge-warning-bg)] border border-[var(--fin-badge-warning-border)] rounded-md p-4">
                  <p className="text-[10px] font-black text-[var(--fin-badge-warning-text)]/70 uppercase tracking-widest mb-1">
                    RTA Remarks
                  </p>
                  <p className="text-sm font-medium text-[var(--fin-badge-warning-text)]">
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
