"use client";

import React, { useEffect, useState } from "react";
import { Loader2, ShieldAlert, Layers } from "lucide-react";
import { distributorService } from "@/services/distributor.service";
import { formatCompactNumber } from "@/lib/utils";

interface FundHoldingDetailProps {
  amfiCode: string;
}

export default function FundHoldingDetail({
  amfiCode,
}: FundHoldingDetailProps) {
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
      <div className="flex flex-col items-center justify-center py-12 border border-slate-200 rounded-md bg-white shadow-sm w-full h-[250px]">
        <Loader2 className="w-6 h-6 animate-spin text-distributor-500 mb-2" />
        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">
          Loading Holdings...
        </p>
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

  if (holdings.length === 0) {
    return null;
  }

  const formatCurr = (number: number) => {
    if (!number) return "0";
    if (number >= 10000000) return `${(number / 10000000).toFixed(2)} Cr`;
    if (number >= 100000) return `${(number / 100000).toFixed(2)} L`;
    if (number >= 1000) return `${(number / 1000).toFixed(2)} K`;
    return `${number.toFixed(0)}`;
  };

  return (
    <div className="border border-slate-200 rounded-md overflow-hidden shadow-sm bg-white flex flex-col mt-5">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-distributor-600" />
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">
            Portfolio Holdings
          </h3>
        </div>
        <span className="bg-distributor-50 text-distributor-700 font-black text-[10px] px-2 py-0.5 rounded uppercase tracking-widest">
          {holdings.length} Assets
        </span>
      </div>

      <div className="overflow-x-auto w-full table-scrollbar max-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white/95 backdrop-blur-sm text-[10px] text-slate-400 uppercase tracking-widest sticky top-0 z-10 ring-1 ring-slate-100 shadow-sm">
            <tr>
              <th className="py-3 px-4 font-black whitespace-nowrap">
                Company / Asset
              </th>
              <th className="py-3 px-4 font-black whitespace-nowrap">Sector</th>
              <th className="py-3 px-4 font-black whitespace-nowrap">
                Asset Class
              </th>
              <th className="py-3 px-4 font-black text-right whitespace-nowrap">
                Shares / Count
              </th>
              <th className="py-3 px-4 font-black text-right whitespace-nowrap">
                Value (₹)
              </th>
              <th className="py-3 px-4 font-black text-right whitespace-nowrap">
                Weight
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {holdings.map((holding, i) => {
              const weightNum = parseFloat(holding.weightage) || 0;
              // Scale factor to make small weights visible in the mini-bar (x5 scale)
              const barWidth = Math.min(weightNum * 5, 100);

              // Determine colors based on asset class
              const isEquity = holding.asset_type === "EQUITY";
              const isDebt = holding.asset_type === "DEBT";
              const isCash =
                holding.asset_type === "CASH" ||
                holding.asset_type === "TREASURY BILLS";

              return (
                <tr
                  key={i}
                  className="group hover:bg-slate-50 transition-colors duration-200 cursor-default"
                >
                  {/* Company */}
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-800 text-xs group-hover:text-distributor-700 transition-colors">
                      {holding.company}
                    </p>
                    {holding.isin_no && (
                      <p className="text-[9px] font-mono text-slate-400 mt-0.5">
                        {holding.isin_no}
                      </p>
                    )}
                  </td>

                  {/* Sector */}
                  <td className="py-3.5 px-4">
                    <p className="font-medium text-slate-500 text-xs">
                      {holding.sector}
                    </p>
                  </td>

                  {/* Asset Class Badge */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ring-1 ring-inset ${
                        isEquity
                          ? "bg-distributor-50 text-distributor-700 ring-distributor-600/20"
                          : isDebt
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                            : isCash
                              ? "bg-amber-50 text-amber-700 ring-amber-600/20"
                              : "bg-slate-50 text-slate-600 ring-slate-500/20"
                      }`}
                    >
                      {holding.asset_type || "N/A"}
                    </span>
                  </td>

                  {/* Shares / Count */}
                  <td className="py-3.5 px-4 text-right text-xs text-slate-500 tabular-nums font-medium">
                    {holding.count
                      ? Number(holding.count).toLocaleString("en-IN")
                      : "—"}
                  </td>

                  {/* Value (₹) */}
                  <td className="py-3.5 px-4 text-right text-xs font-bold text-slate-800 tabular-nums">
                    {formatCurr(Number(holding.value))}
                  </td>

                  {/* Weight & Mini Bar */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="font-bold text-slate-700 text-xs tabular-nums">
                        {weightNum.toFixed(2)}%
                      </span>
                      <div className="w-14 h-1 bg-slate-100 rounded-full overflow-hidden flex justify-end">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isEquity
                              ? "bg-distributor-400"
                              : isDebt
                                ? "bg-emerald-400"
                                : isCash
                                  ? "bg-amber-400"
                                  : "bg-slate-300"
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
