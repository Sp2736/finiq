"use client";

import React, { useEffect, useState } from "react";
import { Loader2, ShieldAlert, Grid3X3, BarChart3 } from "lucide-react";
import { distributorService } from "@/services/distributor.service";

interface FundStyleBoxProps {
  amfiCode: string;
}

export default function FundStyleBox({ amfiCode }: FundStyleBoxProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [styleBoxData, setStyleBoxData] = useState<any>(null);

  useEffect(() => {
    if (!amfiCode || amfiCode === "N/A") {
      setError("No AMFI code available.");
      setIsLoading(false);
      return;
    }

    const fetchStyleBox = async () => {
      setIsLoading(true);
      try {
        const res = await distributorService.getFundStyleBox(amfiCode);
        
        // FIX: Extract data cleanly. The Stylebox API returns a direct object in res.data
        let payload = res?.data || res || {};
        
        // Just in case a future fund wraps it in an array, safely take the first element
        if (Array.isArray(payload)) {
          payload = payload[0] || {};
        }

        setStyleBoxData(payload);
      } catch (err: any) {
        setError(err.message || "Failed to load style box data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStyleBox();
  }, [amfiCode]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 border border-slate-200 rounded-md bg-white shadow-sm w-full h-[250px]">
        <Loader2 className="w-6 h-6 animate-spin text-distributor-500 mb-2" />
        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Loading Style Box...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 border border-slate-200 rounded-md bg-white shadow-sm w-full h-[250px]">
        <ShieldAlert className="w-8 h-8 text-rose-300 mb-2" />
        <p className="text-rose-600 font-bold text-xs">{error}</p>
      </div>
    );
  }

  // ─── DATA MAPPING ─────────────────────────────────────────────────────────
  const marketCapTable = [
    { size: "Large Cap", pct: parseFloat(styleBoxData?.large_percentage || "0") },
    { size: "Mid Cap", pct: parseFloat(styleBoxData?.mid_percentage || "0") },
    { size: "Small Cap", pct: parseFloat(styleBoxData?.small_percentage || "0") }
  ];

  // Determine active row and column for the 3x3 Grid
  const rank = String(styleBoxData?.rank || "").toLowerCase();
  const style = String(styleBoxData?.style || "").toLowerCase();

  const activeRow = rank.includes("large") ? 0 : rank.includes("mid") ? 1 : rank.includes("small") ? 2 : -1;
  const activeCol = style.includes("growth") ? 0 : (style.includes("blend") || style.includes("core")) ? 1 : style.includes("value") ? 2 : -1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full">
      
      {/* WIDGET 1: Equity Style Box Matrix */}
      <div className="border border-slate-200 rounded-md overflow-hidden shadow-sm bg-white flex flex-col">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
          <Grid3X3 className="w-4 h-4 text-distributor-600" />
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Equity Style Box</h3>
        </div>
        <div className="p-5 flex-1 flex flex-col items-center justify-center relative">
          
          {/* Column Headers (Style) */}
          <div className="grid grid-cols-3 w-full max-w-[240px] text-center mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Growth</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Blend</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Value</span>
          </div>

          <div className="flex items-center gap-2 w-full max-w-[280px]">
            {/* Row Headers (Size) */}
            <div className="flex flex-col justify-between h-[180px] text-right pr-2 pb-2 pt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Large</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Mid</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Small</span>
            </div>
            
            {/* 3x3 Grid Matrix */}
            <div className="grid grid-cols-3 grid-rows-3 w-[180px] h-[180px] border-2 border-slate-200 bg-slate-50 rounded-md overflow-hidden shrink-0 shadow-inner">
              {Array.from({ length: 9 }).map((_, i) => {
                const row = Math.floor(i / 3);
                const col = i % 3;
                const isActive = row === activeRow && col === activeCol;

                return (
                  <div 
                    key={i} 
                    className={`flex items-center justify-center border border-slate-200/80 transition-all duration-300 ${
                      isActive ? "bg-distributor-500 shadow-md shadow-distributor-500/30 z-10 scale-[1.02]" : "bg-white"
                    }`}
                  >
                    {isActive}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* WIDGET 2: Market Capitalization Table */}
      <div className="border border-slate-200 rounded-md overflow-hidden shadow-sm bg-white flex flex-col">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-distributor-600" />
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Market Capitalization</h3>
          </div>
        </div>
        <div className="overflow-x-auto w-full table-scrollbar flex-1 flex flex-col justify-center">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-white border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="p-4 font-bold border-r border-slate-50">Size</th>
                <th className="p-4 font-bold text-right">Portfolio %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {marketCapTable.map((cap, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-bold text-slate-700 border-r border-slate-50">{cap.size}</td>
                  <td className="p-4 text-right font-black text-distributor-700 bg-distributor-50/20">
                    {cap.pct > 0 ? `${cap.pct.toFixed(2)}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Subtle PE & PB Info Panel */}
          {(styleBoxData?.pe || styleBoxData?.pb) && (
            <div className="bg-slate-50 mt-auto border-t border-slate-100 p-4 grid grid-cols-2 gap-4">
               {styleBoxData?.pe && (
                 <div className="flex flex-col">
                   <span className="text-[10px] font-bold text-slate-400 uppercase">P/E Ratio</span>
                   <span className="text-sm font-black text-slate-800">{parseFloat(styleBoxData.pe).toFixed(2)}</span>
                 </div>
               )}
               {styleBoxData?.pb && (
                 <div className="flex flex-col text-right">
                   <span className="text-[10px] font-bold text-slate-400 uppercase">P/B Ratio</span>
                   <span className="text-sm font-black text-slate-800">{parseFloat(styleBoxData.pb).toFixed(2)}</span>
                 </div>
               )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}