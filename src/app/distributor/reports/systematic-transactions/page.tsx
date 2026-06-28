"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Search,
  ChevronDown,
  Check,
  AlertCircle,
  Download,
  Loader2,
  Play,
  ArrowRight,
} from "lucide-react";
import Sidebar from "@/components/distributor/Sidebar";
import { distributorService } from "@/services/distributor.service";
import {
  generateSystematicPDF,
  toTitleCase,
} from "@/lib/systematicReportExport";

// Single-word default selections
const TRANSACTION_TYPES = ["All", "SIP", "STP", "SWP"];

// Restored all essential status modes
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
const GROUP_BY_OPTIONS = ["None", "Client", "AMC", "Scheme", "Registrar"];

export default function SystematicTransactionsReport() {
  const [reportData, setReportData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Global Investors State
  const [allInvestors, setAllInvestors] = useState<
    { id: string; name: string }[]
  >([]);
  const [isInvestorsLoading, setIsInvestorsLoading] = useState(false);

  // UI Selection States
  const [isInvestorOpen, setIsInvestorOpen] = useState(false);
  const [investorSearch, setInvestorSearch] = useState("");
  const [selectedInvestorId, setSelectedInvestorId] = useState<string>("ALL");
  const investorDropdownRef = useRef<HTMLDivElement>(null);

  const [selectedType, setSelectedType] = useState(TRANSACTION_TYPES[0]);
  const [selectedMode, setSelectedMode] = useState<string>(MODES[0]);
  const [selectedRegistrar, setSelectedRegistrar] = useState(REGISTRARS[0]);
  const [selectedGroupBy, setSelectedGroupBy] = useState<string>(
    GROUP_BY_OPTIONS[0],
  );

  // Applied Filter States
  const [appliedInvestorId, setAppliedInvestorId] = useState<string>("ALL");
  const [appliedMode, setAppliedMode] = useState<string>(MODES[0]);
  const [appliedType, setAppliedType] = useState(TRANSACTION_TYPES[0]);
  const [appliedGroupBy, setAppliedGroupBy] = useState<string>(
    GROUP_BY_OPTIONS[0],
  );

  // Fetch Global Investor List on Mount
  useEffect(() => {
    const fetchAllInvestors = async () => {
      setIsInvestorsLoading(true);
      try {
        const response = await distributorService.downloadInvestorList(
          1,
          5000,
          5000,
        );
        if (response.success && response.data && response.data.data) {
          const mapped = response.data.data.map((inv: any) => ({
            id: toTitleCase(inv.name),
            name: toTitleCase(inv.name),
          }));
          const unique = Array.from(
            new Map(mapped.map((item: any) => [item.name, item])).values(),
          );
          setAllInvestors(unique);
        }
      } catch (error) {
        console.error("Failed to fetch global investor list", error);
      } finally {
        setIsInvestorsLoading(false);
      }
    };

    fetchAllInvestors();
  }, []);

  // Handle Outside Click for Custom Searchable Investor Dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        investorDropdownRef.current &&
        !investorDropdownRef.current.contains(event.target as Node)
      ) {
        setIsInvestorOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const dynamicInvestors = useMemo(() => {
    return [
      { id: "ALL", name: "All" },
      ...allInvestors.sort((a, b) => a.name.localeCompare(b.name)),
    ];
  }, [allInvestors]);

  const filteredInvestors = dynamicInvestors.filter((inv) =>
    inv.name.toLowerCase().includes(investorSearch.toLowerCase()),
  );

  const selectedInvestorName =
    dynamicInvestors.find((inv) => inv.id === selectedInvestorId)?.name ||
    "All";

  // Main Submit Trigger
  const handleGenerateReport = async () => {
    setIsLoading(true);
    setHasSearched(true);

    setAppliedInvestorId(selectedInvestorId);
    setAppliedMode(selectedMode);
    setAppliedType(selectedType);
    setAppliedGroupBy(selectedGroupBy);

    try {
      const payload: any = {};
      if (selectedType !== "All") payload.types = [selectedType];
      if (selectedRegistrar !== "All") payload.registrar = selectedRegistrar;

      const response = await distributorService.getSystematicReport(payload);
      if (response.success && response.data) {
        setReportData(response.data);
      } else {
        setReportData([]);
      }
    } catch (error) {
      console.error("Failed to fetch systematic reports", error);
      setReportData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Local filtering mapping original complex statuses
  const filteredReportData = useMemo(() => {
    return reportData.filter((item) => {
      const matchInvestor =
        appliedInvestorId === "ALL" ||
        toTitleCase(item.investor_name) === appliedInvestorId;
      const matchType =
        appliedType === "All" || item.systematic_type === appliedType;

      let status = "Running";
      if (item.termination_date) {
        status = "Terminated";
      } else if (new Date(item.end_date) < new Date()) {
        status = "Expired";
      }
      // Expand matching here based on custom statuses if API provides distinct flags
      const matchMode = appliedMode === "All" || status === appliedMode;

      return matchInvestor && matchType && matchMode;
    });
  }, [reportData, appliedInvestorId, appliedType, appliedMode]);

  // Local Grouping Aggregation
  const groupedReportData = useMemo(() => {
    if (appliedGroupBy === "None") return null;

    const groups: Record<string, { count: number; totalAmount: number }> = {};

    filteredReportData.forEach((item) => {
      let key = "Unknown";
      if (appliedGroupBy === "Client")
        key = toTitleCase(item.investor_name || "Unknown Client");
      else if (appliedGroupBy === "AMC") key = item.amc_code || "Unknown AMC";
      else if (appliedGroupBy === "Scheme")
        key = item.scheme_name || "Unknown Scheme";
      else if (appliedGroupBy === "Registrar")
        key = item.source || "Unknown Registrar";

      if (!groups[key]) groups[key] = { count: 0, totalAmount: 0 };
      groups[key].count += 1;
      groups[key].totalAmount += Number(item.amount) || 0;
    });

    return Object.entries(groups)
      .map(([name, data]) => ({
        groupName: name,
        count: data.count,
        totalAmount: data.totalAmount,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredReportData, appliedGroupBy]);

  const handleExportPDF = () => {
    if (appliedGroupBy === "None" && filteredReportData.length === 0) return;
    if (
      appliedGroupBy !== "None" &&
      (!groupedReportData || groupedReportData.length === 0)
    )
      return;

    const nameToExport =
      appliedInvestorId === "ALL" ? "All Investors" : appliedInvestorId;
    generateSystematicPDF(
      filteredReportData,
      appliedType,
      nameToExport,
      groupedReportData,
      appliedGroupBy,
    );
  };

  const getStatusBadge = (item: any) => {
    const now = new Date();
    if (item.termination_date) {
      return (
        <span className="px-2 py-1 bg-red-50 text-red-700 text-[10px] font-bold rounded border border-red-100 uppercase tracking-wider">
          Terminated
        </span>
      );
    }
    if (item.end_date && new Date(item.end_date) < now) {
      return (
        <span className="px-2 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold rounded border border-slate-200 uppercase tracking-wider">
          Expired
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded border border-emerald-100 uppercase tracking-wider">
        Running
      </span>
    );
  };

  const hasData =
    appliedGroupBy === "None"
      ? filteredReportData.length > 0
      : groupedReportData && groupedReportData.length > 0;

  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-[100dvh] md:h-screen w-full bg-slate-50 overflow-hidden">
      {/* ─── SIDEBAR ─── */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      {/* ─── PAGE CONTENT CONTAINER ─── */}
      <div className="relative flex-1 flex flex-col w-full min-w-0 h-full overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out">
        {/* ─── HEADER (Always Fixed Top) ─── */}
        <div className="flex-none px-4 pt-4 sm:px-6 sm:pt-6 md:px-8 md:pt-8 shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900 mb-1 flex flex-wrap items-center gap-2 md:gap-3">
                Systematic Transaction{" "}
                <span className="text-distributor-600">Report</span>
              </h1>
              <p className="text-slate-500 font-medium text-sm">
                Track and manage SIP, STP, and SWP mandates across your client
                portfolio.
              </p>
            </div>
            <button
              onClick={handleExportPDF}
              disabled={!hasSearched || !hasData || isLoading}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-distributor-600 hover:bg-distributor-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-md shadow-sm transition-all shrink-0"
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4 w-full">
              {/* Searchable Investor Dropdown */}
              <div
                className="relative w-full col-span-2 md:col-span-1"
                ref={investorDropdownRef}
              >
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Investor
                </label>
                <button
                  onClick={() => setIsInvestorOpen(!isInvestorOpen)}
                  className="w-full h-[40px] flex items-center justify-between px-3 bg-slate-50 border border-slate-200 rounded-md text-sm font-semibold text-slate-700 hover:bg-white focus:bg-white focus:ring-2 focus:ring-distributor-500/20 focus:border-distributor-500 transition-all outline-none"
                >
                  <span className="truncate">
                    {isInvestorsLoading ? "Loading..." : selectedInvestorName}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200 ${isInvestorOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isInvestorOpen && (
                  <div className="absolute top-full left-0 w-full min-w-[200px] mt-1 bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                    <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search..."
                          value={investorSearch}
                          onChange={(e) => setInvestorSearch(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:border-distributor-500 focus:ring-1 focus:ring-distributor-500/20 transition-all"
                        />
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                      {isInvestorsLoading ? (
                        <div className="p-4 flex items-center justify-center text-sm text-slate-400">
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />{" "}
                          Loading...
                        </div>
                      ) : filteredInvestors.length > 0 ? (
                        filteredInvestors.map((inv) => (
                          <button
                            key={inv.id}
                            onClick={() => {
                              setSelectedInvestorId(inv.id);
                              setIsInvestorOpen(false);
                              setInvestorSearch("");
                            }}
                            className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-distributor-50 hover:text-distributor-700 transition-colors flex items-center justify-between"
                          >
                            <span className="truncate pr-4">{inv.name}</span>
                            {selectedInvestorId === inv.id && (
                              <Check className="w-4 h-4 shrink-0 text-distributor-600" />
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-slate-400 font-medium">
                          No records.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Native Select */}
              <div className="flex flex-col gap-1 w-full">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Status
                </label>
                <select
                  value={selectedMode}
                  onChange={(e) => setSelectedMode(e.target.value)}
                  className="w-full h-[40px] bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-md px-3 outline-none focus:ring-2 focus:ring-distributor-500/20 focus:border-distributor-500 transition-all cursor-pointer"
                >
                  {MODES.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type Native Select */}
              <div className="flex flex-col gap-1 w-full">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full h-[40px] bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-md px-3 outline-none focus:ring-2 focus:ring-distributor-500/20 focus:border-distributor-500 transition-all cursor-pointer"
                >
                  {TRANSACTION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Registrar Native Select */}
              <div className="flex flex-col gap-1 w-full">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Registrar
                </label>
                <select
                  value={selectedRegistrar}
                  onChange={(e) => setSelectedRegistrar(e.target.value)}
                  className="w-full h-[40px] bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-md px-3 outline-none focus:ring-2 focus:ring-distributor-500/20 focus:border-distributor-500 transition-all cursor-pointer"
                >
                  {REGISTRARS.map((reg) => (
                    <option key={reg} value={reg}>
                      {reg}
                    </option>
                  ))}
                </select>
              </div>

              {/* Group By Native Select */}
              <div className="flex flex-col gap-1 w-full">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Group By
                </label>
                <select
                  value={selectedGroupBy}
                  onChange={(e) => setSelectedGroupBy(e.target.value)}
                  className="w-full h-[40px] bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-md px-3 outline-none focus:ring-2 focus:ring-distributor-500/20 focus:border-distributor-500 transition-all cursor-pointer"
                >
                  {GROUP_BY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="w-full lg:w-48 shrink-0 mt-2 lg:mt-0">
              <button
                onClick={handleGenerateReport}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-8 h-[40px] bg-distributor-600 hover:bg-distributor-700 disabled:opacity-70 text-white text-sm font-semibold rounded-md shadow-sm transition-all"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
                Generate
              </button>
            </div>
          </div>

          {/* ─── TABLE AREA ─── */}
          <div className="flex flex-col bg-white border border-slate-200 rounded-md shadow-sm z-10 md:flex-1 md:min-h-0">
            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[300px]">
                <Loader2 className="w-8 h-8 text-distributor-500 animate-spin mb-4" />
                <p className="text-slate-500 font-medium text-sm">
                  Fetching report data...
                </p>
              </div>
            ) : hasSearched && hasData ? (
              <div className="w-full overflow-x-auto overflow-y-visible md:overflow-y-auto md:h-full relative">
                {/* Desktop/Tablet Table View */}
                <table className="hidden md:table w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 sticky top-0 z-10 shadow-[0_1px_0_0_#e2e8f0]">
                    {appliedGroupBy !== "None" ? (
                      <tr>
                        <th className="px-6 py-4 font-bold tracking-wide">
                          {appliedGroupBy}
                        </th>
                        <th className="px-6 py-4 font-bold tracking-wide text-right">
                          No. of Mandates
                        </th>
                        <th className="px-6 py-4 font-bold tracking-wide text-right">
                          Total Amount
                        </th>
                      </tr>
                    ) : (
                      <tr>
                        <th className="px-6 py-4 font-bold tracking-wide">
                          Type & Trxn No
                        </th>
                        <th className="px-6 py-4 font-bold tracking-wide">
                          Scheme Details
                        </th>
                        <th className="px-6 py-4 font-bold tracking-wide">
                          Folio No
                        </th>
                        <th className="px-6 py-4 font-bold tracking-wide text-right">
                          Amount
                        </th>
                        <th className="px-6 py-4 font-bold tracking-wide">
                          Period
                        </th>
                        <th className="px-6 py-4 font-bold tracking-wide">
                          Status
                        </th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {appliedGroupBy !== "None" && groupedReportData
                      ? groupedReportData.map((row, index) => (
                          <tr
                            key={index}
                            className="hover:bg-slate-50/50 transition-colors text-slate-700"
                          >
                            <td className="px-6 py-4 font-semibold text-slate-900">
                              {row.groupName}
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-slate-700">
                              {row.count}
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-slate-900">
                              {row.totalAmount.toLocaleString("en-IN", {
                                style: "currency",
                                currency: "INR",
                                maximumFractionDigits: 0,
                              })}
                            </td>
                          </tr>
                        ))
                      : filteredReportData.map((item, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-slate-50/50 transition-colors group"
                          >
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-1 bg-slate-100 text-slate-700 font-black rounded text-[10px] border border-slate-200">
                                    {item.systematic_type || "N/A"}
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    {item.source}
                                  </span>
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
                              {item.systematic_type === "STP" &&
                                item.target_scheme && (
                                  <div className="text-[11px] text-slate-500 mt-1.5 flex items-start gap-1.5 whitespace-normal">
                                    <ArrowRight className="w-3.5 h-3.5 mt-0.5 text-distributor-500 shrink-0" />
                                    <span className="font-medium text-slate-600">
                                      {item.target_scheme}
                                    </span>
                                  </div>
                                )}
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-slate-600 font-medium">
                              {item.folio_number}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="font-black text-slate-900">
                                {new Intl.NumberFormat("en-IN", {
                                  style: "currency",
                                  currency: "INR",
                                  maximumFractionDigits: 0,
                                }).format(item.amount)}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-slate-800 font-bold text-xs">
                                {new Date(item.start_date).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )}
                              </div>
                              <div className="text-[10px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">
                                To{" "}
                                {item.end_date?.startsWith("2999") ||
                                item.end_date?.startsWith("2099")
                                  ? "—"
                                  : new Date(item.end_date).toLocaleDateString(
                                      "en-IN",
                                      {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                      },
                                    )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {getStatusBadge(item)}
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>

                {/* Mobile Card View */}
                <div className="block md:hidden divide-y divide-slate-100 bg-white w-full">
                  {appliedGroupBy !== "None" && groupedReportData
                    ? groupedReportData.map((row, index) => (
                        <div
                          key={index}
                          className="p-4 hover:bg-slate-50 transition-colors"
                        >
                          <div className="font-semibold text-slate-900 text-sm mb-2">
                            {row.groupName}
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 text-xs">
                              Mandates:{" "}
                              <span className="font-bold text-slate-700">
                                {row.count}
                              </span>
                            </span>
                            <span className="font-bold text-slate-900">
                              {row.totalAmount.toLocaleString("en-IN", {
                                style: "currency",
                                currency: "INR",
                                maximumFractionDigits: 0,
                              })}
                            </span>
                          </div>
                        </div>
                      ))
                    : filteredReportData.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-4 flex flex-col gap-3 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="px-2 py-1 bg-slate-100 text-slate-700 font-black rounded text-[10px] border border-slate-200">
                                  {item.systematic_type || "N/A"}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  {item.source}
                                </span>
                                <span className="text-[10px] font-mono font-semibold text-slate-500 tracking-wide bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded w-max">
                                  {item.trxn_no || "N/A"}
                                </span>
                              </div>
                              <div className="font-bold text-slate-800 text-sm leading-snug">
                                {item.scheme_name}
                              </div>
                            </div>
                            <div>{getStatusBadge(item)}</div>
                          </div>

                          <div className="grid grid-cols-2 gap-y-3 gap-x-4 mt-1 border-t border-slate-50 pt-3">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">
                                Amount
                              </p>
                              <div className="font-black text-slate-900 text-sm">
                                {new Intl.NumberFormat("en-IN", {
                                  style: "currency",
                                  currency: "INR",
                                  maximumFractionDigits: 0,
                                }).format(item.amount)}
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">
                                Period
                              </p>
                              <div className="text-xs font-semibold text-slate-700">
                                {new Date(item.start_date).toLocaleDateString(
                                  "en-IN",
                                  { day: "2-digit", month: "short" },
                                )}{" "}
                                <span className="font-normal text-slate-400 mx-0.5">
                                  to
                                </span>{" "}
                                {item.end_date?.startsWith("2999")
                                  ? "—"
                                  : new Date(item.end_date).toLocaleDateString(
                                      "en-IN",
                                      { day: "2-digit", month: "short" },
                                    )}
                              </div>
                            </div>
                            <div className="col-span-2">
                              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">
                                Folio No.
                              </p>
                              <div className="text-slate-600 font-mono text-xs font-medium">
                                {item.folio_number}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                </div>
              </div>
            ) : hasSearched ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
                <div className="w-16 h-16 bg-distributor-50 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-distributor-600" />
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-2">
                  No Records Found
                </h3>
                <p className="text-slate-500 text-sm max-w-md text-center">
                  We couldn't find any mandates matching your selected filters.
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-2">
                  Ready to Search
                </h3>
                <p className="text-slate-500 text-sm max-w-md">
                  Select your filters above and click &quot;Generate&quot; to
                  view systematic transactions.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
