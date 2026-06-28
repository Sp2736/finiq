"use client";

import React, { useEffect, useState } from "react";
import { Loader2, ShieldAlert, PieChart } from "lucide-react";
import { distributorService } from "@/services/distributor.service";
import FundStyleBox from "./FundStyleBox";
import FundHoldingDetail from "./FundHoldingDetail";

interface FundPortfolioTabProps {
  amfiCode: string;
}

export default function FundPortfolioTab({ amfiCode }: FundPortfolioTabProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sectors, setSectors] = useState<any[]>([]);

  const toTitleCase = (str: string) => {
    return str
      .toLowerCase()
      .split(/[\s-]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const safeExtract = (res: any) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (res.data && Array.isArray(res.data)) return res.data;
    if (res.data?.data && Array.isArray(res.data.data)) return res.data.data;
    if (typeof res === "object") return [res];
    return [];
  };

  useEffect(() => {
    if (!amfiCode || amfiCode === "N/A") {
      setError("No AMFI code available to fetch portfolio details.");
      setIsLoading(false);
      return;
    }

    const fetchPortfolioData = async () => {
      setIsLoading(true);
      try {
        const res = await distributorService.getFundSectorAllocation(amfiCode);
        let rawSectors = safeExtract(res);
        if (
          rawSectors.length > 0 &&
          Array.isArray(rawSectors[0]?.sector_allocation)
        ) {
          rawSectors = rawSectors[0].sector_allocation;
        }

        const processedSectors = rawSectors
          .map((item: any) => {
            const name = item.sector_name || item.sector || "Unknown";
            const words = name.split(/[\s-]+/);
            let abbr =
              words.length > 1
                ? words[0].charAt(0) + words[1].charAt(0)
                : name.substring(0, 3);

            return {
              name: name,
              abbr: abbr.toUpperCase(),
              value: parseFloat(
                item.allocation || item.percentage || item.weight || "0",
              ),
            };
          })
          .sort((a: any, b: any) => b.value - a.value);

        setSectors(processedSectors);
      } catch (err: any) {
        setError(err.message || "Failed to load sector allocation data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortfolioData();
  }, [amfiCode]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-distributor-500 mb-3" />
        <p className="text-slate-500 font-bold text-xs">
          Loading portfolio data...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <ShieldAlert className="w-10 h-10 text-rose-300 mb-2" />
        <p className="text-rose-600 font-bold text-xs">{error}</p>
      </div>
    );
  }

  if (sectors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-100 rounded-md bg-slate-50/50">
        <PieChart className="w-10 h-10 text-slate-300 mb-3" />
        <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest mb-1">
          No Data
        </h3>
        <p className="text-[10px] text-slate-400">
          Sector allocation data is not available for this fund.
        </p>
      </div>
    );
  }

  const maxVal = Math.max(...sectors.map((s) => s.value), 10);
  const PADDING_TOP = 20;
  const PADDING_BOTTOM = 30;
  const PADDING_LEFT = 55;
  const PADDING_RIGHT = 20;
  const HEIGHT = 240;

  const MIN_SECTOR_WIDTH = 45;
  const WIDTH = Math.max(
    600,
    PADDING_LEFT + PADDING_RIGHT + sectors.length * MIN_SECTOR_WIDTH,
  );

  const chartWidth = WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const BAR_WIDTH = Math.min(35, (chartWidth / sectors.length) * 0.5);

  const getY = (val: number) =>
    HEIGHT -
    PADDING_BOTTOM -
    (val / maxVal) * (HEIGHT - PADDING_TOP - PADDING_BOTTOM);
  const getX = (idx: number) =>
    PADDING_LEFT +
    (chartWidth / sectors.length) * idx +
    chartWidth / sectors.length / 2;

  const isCluttered = sectors.length > 12;

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300 pb-4">
      {/* ─── NEW STYLE BOX WIDGET ─── */}
      <FundStyleBox amfiCode={amfiCode} />

      {/* ─── SECTOR ALLOCATION SVG ─── */}
      <div
        className={`border border-slate-200 rounded-md overflow-hidden shadow-sm flex flex-col ${isCluttered ? "" : "lg:flex-row"} bg-white`}
      >
        <div
          className={`p-4 sm:p-6 relative flex flex-col ${isCluttered ? "border-b border-slate-100 w-full" : "flex-1 border-b lg:border-b-0 lg:border-r border-slate-100 min-w-0"}`}
        >
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest mb-4">
            Sector Allocation (%)
          </h3>

          <div className="w-full overflow-x-auto table-scrollbar relative">
            <svg
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              className="h-[240px]"
              style={{ width: "100%", minWidth: `${WIDTH}px` }}
              preserveAspectRatio="none"
            >
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = getY(maxVal * ratio);
                return (
                  <g key={i}>
                    <line
                      x1={PADDING_LEFT}
                      y1={y}
                      x2={WIDTH - PADDING_RIGHT}
                      y2={y}
                      stroke="#f1f5f9"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                    <text
                      x="5"
                      y={y + 3}
                      fontSize="10"
                      fill="#94a3b8"
                      fontWeight="600"
                    >
                      {Math.round(maxVal * ratio)}%
                    </text>
                  </g>
                );
              })}

              <line
                x1={PADDING_LEFT}
                y1={HEIGHT - PADDING_BOTTOM}
                x2={WIDTH - PADDING_RIGHT}
                y2={HEIGHT - PADDING_BOTTOM}
                stroke="#cbd5e1"
                strokeWidth="2"
              />

              {sectors.map((s, i) => {
                const x = getX(i);
                const barHeight =
                  (s.value / maxVal) * (HEIGHT - PADDING_TOP - PADDING_BOTTOM);
                const y = HEIGHT - PADDING_BOTTOM - barHeight;

                return (
                  <g key={i} className="group">
                    <text
                      x={x}
                      y={y - 8}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="800"
                      className="opacity-0 group-hover:opacity-100 transition-opacity fill-[var(--fin-brand-700)]"
                    >
                      {s.value.toFixed(2)}%
                    </text>
                    <rect
                      x={x - BAR_WIDTH / 2}
                      y={y}
                      width={BAR_WIDTH}
                      height={Math.max(barHeight, 2)}
                      rx="2"
                      className="transition-all duration-300 fill-[var(--fin-brand-500)] opacity-80 group-hover:opacity-100 group-hover:fill-[var(--fin-brand-700)] cursor-pointer"
                    />
                    <text
                      x={x}
                      y={HEIGHT - 12}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#64748b"
                      fontWeight="800"
                    >
                      {s.abbr}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* LEGEND */}
        <div
          className={`${isCluttered ? "w-full" : "w-full lg:w-96 shrink-0"} bg-slate-50 p-4 sm:p-5 flex flex-col max-h-[400px]`}
        >
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 shrink-0">
            Legend
          </h4>
          <div className="overflow-x-auto overflow-y-auto table-scrollbar rounded-md border border-slate-200 bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-[10px] text-slate-500 uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="p-3 font-bold border-b border-slate-200">
                    Sector
                  </th>
                  <th className="p-3 font-bold text-right border-b border-slate-200 border-l border-slate-100 w-24">
                    Allocation
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sectors.map((s, i) => (
                  <tr
                    key={i}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-sm shrink-0 bg-[var(--fin-brand-500)]" />
                        <span className="font-semibold text-slate-700 whitespace-normal">
                          {toTitleCase(s.name)}{" "}
                          <span className="text-slate-400 font-bold ml-1 text-[10px]">
                            ({s.abbr})
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-right font-black text-distributor-700 bg-distributor-50/30 border-l border-slate-100 whitespace-nowrap">
                      {s.value.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <FundHoldingDetail amfiCode={amfiCode} />
    </div>
  );
}
