"use client";

import React, { useEffect, useState } from "react";
import { Loader2, ShieldAlert, Layers } from "lucide-react";
import { distributorService } from "@/services/distributor.service";

interface FundHoldingDetailProps {
  amfiCode: string;
}

export default function FundHoldingDetail({ amfiCode }: FundHoldingDetailProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [holdings, setHoldings] = useState<any[]>([]);

  useEffect(() => {
    if (!amfiCode || amfiCode === "N/A") {
      setError("No AMFI code available.");
      setIsLoading(false);
      return;
    }

    const fetchHoldings = async () => {
      setIsLoading(true);
      try {
        const res = await distributorService.getFundHoldings(amfiCode);
        
        let payload = res?.data || [];
        if (!Array.isArray(payload) && payload.data) {
          payload = payload.data;
        }

        setHoldings(res ?? []);
      } catch (err: any) {
        setError(err.message || "Failed to load fund holdings.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHoldings();
  }, [amfiCode]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 border border-slate-200 rounded-xl bg-white shadow-sm w-full h-[250px]">
        <Loader2 className="w-6 h-6 animate-spin text-distributor-500 mb-2" />
        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Loading Holdings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 border border-slate-200 rounded-xl bg-white shadow-sm w-full h-[250px]">
        <ShieldAlert className="w-8 h-8 text-rose-300 mb-2" />
        <p className="text-rose-600 font-bold text-xs">{error}</p>
      </div>
    );
  }

  if (holdings.length === 0) {
    return null;
  }

  const formatCurrency = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return "—";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white flex flex-col mt-5">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-distributor-600" />
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Portfolio Holdings</h3>
        </div>
        <span className="bg-distributor-50 text-distributor-700 font-black text-[10px] px-2 py-0.5 rounded uppercase tracking-widest">
          {holdings.length} Assets
        </span>
      </div>
      
      <div className="overflow-x-auto w-full table-scrollbar max-h-[400px]">
        <table className="w-full text-left text-xs border-collapse relative">
          <thead className="bg-slate-100 text-[10px] text-slate-500 uppercase tracking-wider sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-3 font-bold border-b border-slate-200 whitespace-nowrap">Company</th>
              <th className="p-3 font-bold border-b border-slate-200 whitespace-nowrap">Sector</th>
              <th className="p-3 font-bold border-b border-slate-200 whitespace-nowrap">Asset Class</th>
              <th className="p-3 font-bold text-right border-b border-slate-200 whitespace-nowrap">Shares / Count</th>
              <th className="p-3 font-bold text-right border-b border-slate-200 whitespace-nowrap">Value (₹)</th>
              <th className="p-3 font-bold text-right border-b border-slate-200 whitespace-nowrap border-l border-slate-200">Weight</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {holdings.map((holding, i) => (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-3">
                  <p className="font-semibold text-slate-800">{holding.company}</p>
                  {holding.isin_no && (
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">{holding.isin_no}</p>
                  )}
                </td>
                <td className="p-3 font-medium text-slate-600">{holding.sector}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${
                    holding.asset_type === "EQUITY" ? "bg-distributor-50 text-distributor-700" :
                    holding.asset_type === "DEBT" ? "bg-emerald-50 text-emerald-700" :
                    "bg-slate-100 text-slate-600"
                  }`}>
                    {holding.asset_type || "N/A"}
                  </span>
                </td>
                <td className="p-3 text-right text-slate-600 tabular-nums">
                  {holding.count ? parseInt(holding.count).toLocaleString("en-IN") : "—"}
                </td>
                <td className="p-3 text-right font-medium text-slate-800 tabular-nums">
                  {formatCurrency(holding.value)}
                </td>
                <td className="p-3 text-right font-black text-distributor-700 bg-distributor-50/30 border-l border-slate-100 whitespace-nowrap">
                  {parseFloat(holding.weightage).toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}