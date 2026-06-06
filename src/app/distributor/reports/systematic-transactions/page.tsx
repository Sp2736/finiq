"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, AlertCircle, Download, Loader2, Play } from "lucide-react";
import { distributorService, SystematicReportItem } from "@/services/distributor.service";
import { generateSystematicPDF, toTitleCase } from "@/lib/systematicReportExport";

const TRANSACTION_TYPES = [
  { id: "SIP", label: "Systematic Investment Plan (SIP)" },
  { id: "STP", label: "Systematic Transfer Plan (STP)" },
  { id: "SWP", label: "Systematic Withdrawal Plan (SWP)" },
];

const MODES = [
  "No Filter",
  "Currently Running",
  "Forthcoming",
  "Prematurely Terminated",
  "Procured",
  "Due of Maturity",
  "Expired",
  "Deleted",
  "SIP Installment Status",
  "SIP Analysis",
];

const REGISTRARS = [
  { id: "ALL", label: "All Registrars" },
  { id: "CAMS", label: "CAMS" },
  { id: "KARVY", label: "Karvy" }
];

const GROUP_BY_OPTIONS = [
  "None",
  "Client",
  "AMC",
  "Scheme",
  "Registrar"
];

export default function SystematicTransactionsReport() {
  const [reportData, setReportData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Global Investors State
  const [allInvestors, setAllInvestors] = useState<{ id: string; name: string }[]>([]);
  const [isInvestorsLoading, setIsInvestorsLoading] = useState(false);

  // UI Dropdown States 
  const [isInvestorOpen, setIsInvestorOpen] = useState(false);
  const [investorSearch, setInvestorSearch] = useState("");
  const [selectedInvestorId, setSelectedInvestorId] = useState<string>("ALL");
  const investorDropdownRef = useRef<HTMLDivElement>(null);

  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(TRANSACTION_TYPES[0]);
  const typeDropdownRef = useRef<HTMLDivElement>(null);

  const [isModeOpen, setIsModeOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<string>(MODES[0]); 
  const modeDropdownRef = useRef<HTMLDivElement>(null);

  const [isRegistrarOpen, setIsRegistrarOpen] = useState(false);
  const [selectedRegistrar, setSelectedRegistrar] = useState(REGISTRARS[0]);
  const registrarDropdownRef = useRef<HTMLDivElement>(null);

  const [isGroupByOpen, setIsGroupByOpen] = useState(false);
  const [selectedGroupBy, setSelectedGroupBy] = useState<string>(GROUP_BY_OPTIONS[0]);
  const groupByDropdownRef = useRef<HTMLDivElement>(null);

  // Applied Filter States
  const [appliedInvestorId, setAppliedInvestorId] = useState<string>("ALL");
  const [appliedMode, setAppliedMode] = useState<string>(MODES[0]);
  const [appliedType, setAppliedType] = useState(TRANSACTION_TYPES[0]);
  const [appliedGroupBy, setAppliedGroupBy] = useState<string>(GROUP_BY_OPTIONS[0]);

  // 1. Fetch Global Investor List on Mount 
  useEffect(() => {
    const fetchAllInvestors = async () => {
      setIsInvestorsLoading(true);
      try {
        const response = await distributorService.downloadInvestorList(1, 5000, 5000);
        if (response.success && response.data && response.data.data) {
          const mapped = response.data.data.map((inv: any) => ({
            id: toTitleCase(inv.name), 
            name: toTitleCase(inv.name)
          }));
          const unique = Array.from(new Map(mapped.map((item: any) => [item.name, item])).values());
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

  // Handle Outside Clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (investorDropdownRef.current && !investorDropdownRef.current.contains(event.target as Node)) setIsInvestorOpen(false);
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) setIsTypeOpen(false);
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(event.target as Node)) setIsModeOpen(false);
      if (registrarDropdownRef.current && !registrarDropdownRef.current.contains(event.target as Node)) setIsRegistrarOpen(false);
      if (groupByDropdownRef.current && !groupByDropdownRef.current.contains(event.target as Node)) setIsGroupByOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const dynamicInvestors = useMemo(() => {
    return [
      { id: "ALL", name: "All Investors" }, 
      ...allInvestors.sort((a, b) => a.name.localeCompare(b.name))
    ];
  }, [allInvestors]);

  const filteredInvestors = dynamicInvestors.filter((inv) =>
    inv.name.toLowerCase().includes(investorSearch.toLowerCase())
  );

  const selectedInvestorName = dynamicInvestors.find(inv => inv.id === selectedInvestorId)?.name || "All Investors";

  // 2. Main Submit Trigger
  const handleGenerateReport = async () => {
    setIsLoading(true);
    setHasSearched(true);
    
    setAppliedInvestorId(selectedInvestorId);
    setAppliedMode(selectedMode);
    setAppliedType(selectedType);
    setAppliedGroupBy(selectedGroupBy);
    
    try {
      const payload: any = {
        types: [selectedType.id],
        registrar: selectedRegistrar.id
      };
      
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

  // 3. Local filtering
  const filteredReportData = useMemo(() => {
    return reportData.filter(item => {
      const matchInvestor = appliedInvestorId === "ALL" || toTitleCase(item.investor_name) === appliedInvestorId;
      const matchType = item.systematic_type === appliedType.id;
      
      let status = "Currently Running";
      if (item.termination_date) {
          status = "Prematurely Terminated";
      } else if (new Date(item.end_date) < new Date()) {
          status = "Expired"; 
      }
      const matchMode = appliedMode === "No Filter" || status === appliedMode;

      return matchInvestor && matchType && matchMode;
    });
  }, [reportData, appliedInvestorId, appliedType, appliedMode]);

  // 4. Local Grouping Aggregation
  const groupedReportData = useMemo(() => {
    if (appliedGroupBy === "None") return null;

    const groups: Record<string, { count: number, totalAmount: number }> = {};

    filteredReportData.forEach(item => {
        let key = 'Unknown';
        if (appliedGroupBy === 'Client') key = toTitleCase(item.investor_name || 'Unknown Client');
        else if (appliedGroupBy === 'AMC') key = item.amc_code || 'Unknown AMC';
        else if (appliedGroupBy === 'Scheme') key = item.scheme_name || 'Unknown Scheme';
        else if (appliedGroupBy === 'Registrar') key = item.source || 'Unknown Registrar';

        if (!groups[key]) {
            groups[key] = { count: 0, totalAmount: 0 };
        }
        groups[key].count += 1;
        groups[key].totalAmount += Number(item.amount) || 0;
    });

    return Object.entries(groups).map(([name, data]) => ({
        groupName: name,
        count: data.count,
        totalAmount: data.totalAmount
    })).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredReportData, appliedGroupBy]);

  const handleExportPDF = () => {
    if (appliedGroupBy === "None" && filteredReportData.length === 0) return;
    if (appliedGroupBy !== "None" && (!groupedReportData || groupedReportData.length === 0)) return;

    const nameToExport = appliedInvestorId === "ALL" ? "All Investors" : appliedInvestorId;
    generateSystematicPDF(filteredReportData, appliedType.id, nameToExport, groupedReportData, appliedGroupBy);
  };

  const hasData = appliedGroupBy === "None" 
    ? filteredReportData.length > 0 
    : (groupedReportData && groupedReportData.length > 0);

  return (
    <div className="relative flex-1 w-full h-[calc(100vh-5rem)] flex flex-col p-4 sm:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out gap-6 lg:gap-8">
      
      {/* Header & Export Action */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 mb-1 flex items-center gap-3">
            Systematic Transaction <span className="text-distributor-600">Report</span>
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            Track and manage SIP, STP, and SWP mandates across your client portfolio.
          </p>
        </div>
        <button
          onClick={handleExportPDF}
          disabled={!hasData || isLoading}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-distributor-600 hover:bg-distributor-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-md shadow-sm transition-all"
        >
          <Download className="w-4 h-4" />
          Export PDF
        </button>
      </div>

      {/* Control Panel */}
      <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm relative z-20 shrink-0 flex flex-col gap-5">
        
        {/* Top Row: Secondary Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 w-full">
          
          {/* Mode Dropdown */}
          <div className="relative w-full" ref={modeDropdownRef}>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
              Status Mode
            </label>
            <button
              onClick={() => setIsModeOpen(!isModeOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-sm font-semibold text-slate-700 hover:bg-white focus:bg-white focus:ring-2 focus:ring-distributor-500/20 focus:border-distributor-500 transition-all outline-none"
            >
              <span className="truncate">{selectedMode}</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isModeOpen ? "rotate-180" : ""}`} />
            </button>

            {isModeOpen && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50 py-1 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                {MODES.map((modeOption) => (
                  <button
                    key={modeOption}
                    onClick={() => {
                      setSelectedMode(modeOption);
                      setIsModeOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors flex items-center justify-between ${
                      selectedMode === modeOption 
                        ? "bg-distributor-50 text-distributor-700" 
                        : "text-slate-700 hover:bg-slate-50 hover:text-distributor-600"
                    }`}
                  >
                    {modeOption}
                    {selectedMode === modeOption && <Check className="w-4 h-4 text-distributor-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Transaction Type Dropdown */}
          <div className="relative w-full" ref={typeDropdownRef}>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
              Type
            </label>
            <button
              onClick={() => setIsTypeOpen(!isTypeOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-sm font-semibold text-slate-700 hover:bg-white focus:bg-white focus:ring-2 focus:ring-distributor-500/20 focus:border-distributor-500 transition-all outline-none"
            >
              <span className="truncate">{selectedType.label}</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isTypeOpen ? "rotate-180" : ""}`} />
            </button>

            {isTypeOpen && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50 py-1">
                {TRANSACTION_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      setSelectedType(type);
                      setIsTypeOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors flex items-center justify-between ${
                      selectedType.id === type.id 
                        ? "bg-distributor-50 text-distributor-700" 
                        : "text-slate-700 hover:bg-slate-50 hover:text-distributor-600"
                    }`}
                  >
                    {type.label}
                    {selectedType.id === type.id && <Check className="w-4 h-4 text-distributor-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Registrar Dropdown */}
          <div className="relative w-full" ref={registrarDropdownRef}>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
              Registrar
            </label>
            <button
              onClick={() => setIsRegistrarOpen(!isRegistrarOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-sm font-semibold text-slate-700 hover:bg-white focus:bg-white focus:ring-2 focus:ring-distributor-500/20 focus:border-distributor-500 transition-all outline-none"
            >
              <span className="truncate">{selectedRegistrar.label}</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isRegistrarOpen ? "rotate-180" : ""}`} />
            </button>

            {isRegistrarOpen && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50 py-1">
                {REGISTRARS.map((reg) => (
                  <button
                    key={reg.id}
                    onClick={() => {
                      setSelectedRegistrar(reg);
                      setIsRegistrarOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors flex items-center justify-between ${
                      selectedRegistrar.id === reg.id 
                        ? "bg-distributor-50 text-distributor-700" 
                        : "text-slate-700 hover:bg-slate-50 hover:text-distributor-600"
                    }`}
                  >
                    {reg.label}
                    {selectedRegistrar.id === reg.id && <Check className="w-4 h-4 text-distributor-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Group By Dropdown */}
          <div className="relative w-full" ref={groupByDropdownRef}>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
              Group By
            </label>
            <button
              onClick={() => setIsGroupByOpen(!isGroupByOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-sm font-semibold text-slate-700 hover:bg-white focus:bg-white focus:ring-2 focus:ring-distributor-500/20 focus:border-distributor-500 transition-all outline-none"
            >
              <span className="truncate">{selectedGroupBy}</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isGroupByOpen ? "rotate-180" : ""}`} />
            </button>

            {isGroupByOpen && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50 py-1">
                {GROUP_BY_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setSelectedGroupBy(opt);
                      setIsGroupByOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors flex items-center justify-between ${
                      selectedGroupBy === opt 
                        ? "bg-distributor-50 text-distributor-700" 
                        : "text-slate-700 hover:bg-slate-50 hover:text-distributor-600"
                    }`}
                  >
                    {opt}
                    {selectedGroupBy === opt && <Check className="w-4 h-4 text-distributor-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Bottom Row: Investor Search (2/3) & Generate Button (1/3) */}
        <div className="flex flex-col md:flex-row gap-4 lg:gap-5 items-end border-t border-slate-100 pt-5">
          
          {/* Investor Dropdown */}
          <div className="relative w-full md:w-2/3" ref={investorDropdownRef}>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
              Select Investor
            </label>
            <button
              onClick={() => setIsInvestorOpen(!isInvestorOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-sm font-semibold text-slate-700 hover:bg-white focus:bg-white focus:ring-2 focus:ring-distributor-500/20 focus:border-distributor-500 transition-all outline-none"
            >
              <span className="truncate">
                {isInvestorsLoading ? "Loading investors..." : selectedInvestorName}
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isInvestorOpen ? "rotate-180" : ""}`} />
            </button>

            {isInvestorOpen && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by name..."
                      value={investorSearch}
                      onChange={(e) => setInvestorSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:border-distributor-500 focus:ring-1 focus:ring-distributor-500/20 transition-all"
                    />
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                  {isInvestorsLoading ? (
                    <div className="p-4 flex items-center justify-center text-sm text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading...
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
                        {inv.name}
                        {selectedInvestorId === inv.id && <Check className="w-4 h-4 text-distributor-600" />}
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-slate-400 font-medium">No investors found.</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Generate Report Button */}
          <div className="w-full md:w-1/3">
            <button
              onClick={handleGenerateReport}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-8 py-2.5 bg-distributor-600 hover:bg-distributor-700 disabled:opacity-70 text-white text-sm font-semibold rounded-md shadow-sm transition-all h-[42px]"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
              Generate Report
            </button>
          </div>

        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white border border-slate-200 rounded-md shadow-sm flex flex-col flex-1 min-h-0 w-full overflow-hidden relative z-10">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <Loader2 className="w-8 h-8 text-distributor-600 animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Fetching report data...</p>
          </div>
        ) : hasSearched && hasData ? (
          <div className="overflow-x-auto w-full h-full">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold sticky top-0 shadow-[0_1px_0_0_#e2e8f0]">
                {appliedGroupBy !== "None" ? (
                  <tr>
                    <th className="px-6 py-4">{appliedGroupBy}</th>
                    <th className="px-6 py-4 text-right">No. of Mandates</th>
                    <th className="px-6 py-4 text-right">Total Amount (₹)</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="px-6 py-4">Trxn No.</th>
                    <th className="px-6 py-4">Folio</th>
                    <th className="px-6 py-4">Scheme Name</th>
                    <th className="px-6 py-4 text-right">Amount (₹)</th>
                    <th className="px-6 py-4">Start Date</th>
                    <th className="px-6 py-4">End Date</th>
                    <th className="px-6 py-4">Source</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appliedGroupBy !== "None" && groupedReportData ? (
                  groupedReportData.map((row, index) => (
                    <tr key={index} className="hover:bg-slate-50/50 transition-colors text-slate-700">
                      <td className="px-6 py-4 font-semibold text-slate-900">{row.groupName}</td>
                      <td className="px-6 py-4 text-right font-medium text-slate-700">{row.count}</td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900">
                        {row.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                ) : (
                  filteredReportData.map((item, index) => {
                    const sDate = new Date(item.start_date).toLocaleDateString("en-GB");
                    const eDate = item.end_date?.startsWith('2999') || item.end_date?.startsWith('2099') ? '—' : new Date(item.end_date).toLocaleDateString("en-GB");
                    return (
                      <tr key={index} className="hover:bg-slate-50/50 transition-colors text-slate-700">
                        <td className="px-6 py-4 font-mono text-xs text-slate-500">{item.trxn_no}</td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-500">{item.folio_number}</td>
                        <td className="px-6 py-4 max-w-[280px] truncate" title={item.scheme_name}>{item.scheme_name}</td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900">
                          {Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-slate-500">{sDate}</td>
                        <td className="px-6 py-4 text-slate-500">{eDate}</td>
                        <td className="px-6 py-4 text-xs font-bold uppercase text-slate-400">{item.source}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : hasSearched ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2">No Records Found</h3>
            <p className="text-slate-500 text-sm max-w-md">
              There are currently no mandates of type <strong>{appliedType.id}</strong> 
              {appliedMode !== "No Filter" ? ` matching your criteria for "${appliedMode}".` : " matching your criteria."}
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2">Ready to Search</h3>
            <p className="text-slate-500 text-sm max-w-md">
              Select your filters above and click &quot;Generate Report&quot; to view systematic transactions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}