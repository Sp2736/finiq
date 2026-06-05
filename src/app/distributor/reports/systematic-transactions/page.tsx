"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, AlertCircle, Download, Loader2, X } from "lucide-react";
import { distributorService, SystematicReportItem } from "@/services/distributor.service";
import { generateSystematicPDF, toTitleCase } from "@/lib/systematicReportExport";

const TRANSACTION_TYPES = [
  { id: "SIP", label: "Systematic Investment Plan (SIP)" },
  { id: "STP", label: "Systematic Transfer Plan (STP)" },
  { id: "SWP", label: "Systematic Withdrawal Plan (SWP)" },
];

export default function SystematicTransactionsReport() {
  const [reportData, setReportData] = useState<SystematicReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Global Investors State
  const [allInvestors, setAllInvestors] = useState<{ id: string; name: string }[]>([]);
  const [isInvestorsLoading, setIsInvestorsLoading] = useState(false);

  // Investor Dropdown State
  const [isInvestorOpen, setIsInvestorOpen] = useState(false);
  const [investorSearch, setInvestorSearch] = useState("");
  const [selectedInvestorId, setSelectedInvestorId] = useState<string>("ALL");
  const investorDropdownRef = useRef<HTMLDivElement>(null);

  // Type Dropdown State
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(TRANSACTION_TYPES[0]);
  const typeDropdownRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Global Investor List (Independent of Report Data)
  useEffect(() => {
    const fetchAllInvestors = async () => {
      setIsInvestorsLoading(true);
      try {
        // Fetch up to 5000 to cover the full client list
        const response = await distributorService.downloadInvestorList(1, 5000, 5000);
        if (response.success && response.data && response.data.data) {
          // We use the TitleCased name as the ID so we can match it against the reportData
          const mapped = response.data.data.map(inv => ({
            id: toTitleCase(inv.name), 
            name: toTitleCase(inv.name)
          }));
          // Remove potential duplicates
          const unique = Array.from(new Map(mapped.map(item => [item.name, item])).values());
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

  // 2. Fetch Systematic Report Data
  useEffect(() => {
    const fetchReportData = async () => {
      setIsLoading(true);
      try {
        const response = await distributorService.getSystematicReport({
          types: [selectedType.id]
        });
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

    fetchReportData();
    // Reset selections when transaction type changes
    setSelectedInvestorId("ALL");
    setInvestorSearch("");
  }, [selectedType.id]);

  // Handle Outside Clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (investorDropdownRef.current && !investorDropdownRef.current.contains(event.target as Node)) {
        setIsInvestorOpen(false);
      }
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
        setIsTypeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Format dynamic dropdown list containing all investors
  const dynamicInvestors = useMemo(() => {
    return [
      { id: "ALL", name: "All Investors" }, 
      ...allInvestors.sort((a, b) => a.name.localeCompare(b.name))
    ];
  }, [allInvestors]);

  // Filter dropdown options based on search text
  const filteredInvestors = dynamicInvestors.filter((inv) =>
    inv.name.toLowerCase().includes(investorSearch.toLowerCase())
  );

  // Filter final table data based on selection
  const filteredReportData = useMemo(() => {
    if (selectedInvestorId === "ALL") return reportData;
    return reportData.filter(item => toTitleCase(item.investor_name) === selectedInvestorId);
  }, [reportData, selectedInvestorId]);

  const selectedInvestorName = dynamicInvestors.find(inv => inv.id === selectedInvestorId)?.name || "All Investors";

  // Handle PDF Export
  const handleExportPDF = () => {
    if (filteredReportData.length === 0) return;
    generateSystematicPDF(filteredReportData, selectedType.id, selectedInvestorName);
  };

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
          disabled={filteredReportData.length === 0 || isLoading}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-distributor-600 hover:bg-distributor-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-md shadow-sm transition-all"
        >
          <Download className="w-4 h-4" />
          Export PDF
        </button>
      </div>

      {/* Control Panel */}
      <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm flex flex-col sm:flex-row gap-5 items-start sm:items-center relative z-20 shrink-0">
        
        {/* Dropdown with Inner Search */}
        <div className="relative w-full sm:max-w-sm" ref={investorDropdownRef}>
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
                        setInvestorSearch(""); // Clear search on select
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

        {/* Transaction Type Dropdown */}
        <div className="relative w-full sm:max-w-xs" ref={typeDropdownRef}>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
            Transaction Type
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
      </div>

      {/* Report Table */}
      <div className="bg-white border border-slate-200 rounded-md shadow-sm flex flex-col flex-1 min-h-0 w-full overflow-hidden relative z-10">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <Loader2 className="w-8 h-8 text-distributor-600 animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Fetching {selectedType.id} data...</p>
          </div>
        ) : filteredReportData.length > 0 ? (
          <div className="overflow-x-auto w-full h-full">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold sticky top-0 shadow-[0_1px_0_0_#e2e8f0]">
                <tr>
                  <th className="px-6 py-4">Trxn No.</th>
                  <th className="px-6 py-4">Folio</th>
                  <th className="px-6 py-4">Investor</th>
                  <th className="px-6 py-4">Scheme Name</th>
                  <th className="px-6 py-4 text-right">Amount (₹)</th>
                  <th className="px-6 py-4">Start Date</th>
                  <th className="px-6 py-4">End Date</th>
                  <th className="px-6 py-4">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReportData.map((item, index) => {
                  const sDate = new Date(item.start_date).toLocaleDateString("en-GB");
                  const eDate = item.end_date.startsWith('2999') ? '—' : new Date(item.end_date).toLocaleDateString("en-GB");
                  return (
                    <tr key={index} className="hover:bg-slate-50/50 transition-colors text-slate-700">
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{item.trxn_no}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{item.folio_number}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{toTitleCase(item.investor_name)}</td>
                      <td className="px-6 py-4 max-w-[280px] truncate" title={item.scheme_name}>{item.scheme_name}</td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900">
                        {Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-slate-500">{sDate}</td>
                      <td className="px-6 py-4 text-slate-500">{eDate}</td>
                      <td className="px-6 py-4 text-xs font-bold uppercase text-slate-400">{item.source}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2">No Records Found</h3>
            <p className="text-slate-500 text-sm max-w-md">
              There are currently no active systematic mandates of type <strong>{selectedType.id}</strong> matching your criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}