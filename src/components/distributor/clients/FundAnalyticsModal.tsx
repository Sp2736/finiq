"use client";

import React, { useEffect, useState } from "react";
import { X, Loader2, TrendingUp, ShieldAlert, PieChart } from "lucide-react";
import { distributorService } from "@/services/distributor.service";
import FundPortfolioTab from "./FundPortfolioTab";

interface FundAnalyticsModalProps {
  fund: any;
  onClose: () => void;
}

export default function FundAnalyticsModal({
  fund,
  onClose,
}: FundAnalyticsModalProps) {
  const [activeTab, setActiveTab] = useState<
    "performance" | "risk" | "portfolio"
  >("performance");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [analyticsData, setAnalyticsData] = useState<any>({
    returns: [],
    monthlyReturns: [],
    riskStats: [],
  });

  const amfiCode = fund?.amfi_code || fund?.amfiCode;

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
      setError("No AMFI code available for this fund to fetch analytics.");
      setIsLoading(false);
      return;
    }

    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const [returnsRes, monthlyRes, riskRes] = await Promise.all([
          distributorService.getFundReturns(amfiCode).catch(() => null),
          distributorService.getFundMonthlyReturns(amfiCode).catch(() => null),
          distributorService.getFundRiskStats(amfiCode).catch(() => null),
        ]);

        setAnalyticsData({
          returns: safeExtract(returnsRes),
          monthlyReturns: safeExtract(monthlyRes),
          riskStats: safeExtract(riskRes),
        });
      } catch (err: any) {
        setError(err.message || "Failed to load fund analytics.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [amfiCode]);

  const retData = analyticsData.returns?.[0] || {};
  const riskData = analyticsData.riskStats?.[0] || {};
  const monthlyData = analyticsData.monthlyReturns || [];

  const formatDateDDMMYYYY = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
  };

  const commonInfo = {
    fundName:
      retData.basic_name ||
      retData.fund_name ||
      fund?.fund_name ||
      "Unknown Fund",
    allotmentDate: formatDateDDMMYYYY(
      retData.allottment_date || retData.allotment_date,
    ),
    category:
      retData.vr_category_name ||
      retData.sebi_category_name ||
      fund?.asset_class ||
      "Equity",
    aum: retData.latest_aum
      ? `₹${parseFloat(retData.latest_aum).toFixed(2)} Cr`
      : "N/A",
    benchmark:
      retData.benchmark_details?.[0]?.short_name ||
      retData.benchmark_details?.[0]?.full_name ||
      "N/A",
    fundManagersList: retData.fund_manager_details || [],
    riskometer: retData.riskometer_details?.[0]?.description || "N/A",
  };

  const formatReturn = (val: any) => {
    if (val === null || val === undefined)
      return <span className="text-slate-300">—</span>;
    const num = Number(val);
    if (isNaN(num)) return <span className="text-slate-300">—</span>;
    if (num > 0)
      return (
        <span className="text-emerald-600 font-bold">+{num.toFixed(2)}%</span>
      );
    if (num < 0)
      return <span className="text-rose-600 font-bold">{num.toFixed(2)}%</span>;
    return <span className="text-slate-500 font-bold">0.00%</span>;
  };

  const formatNum = (val: any) => {
    if (val === null || val === undefined) return "—";
    const num = Number(val);
    return isNaN(num) ? "—" : num.toFixed(2);
  };

  const renderPerformanceTab = () => {
    const tr = retData.trailing_returns || {};
    const rr = retData.rolling_returns || {};

    const periods = [
      { key: "7d", label: "7D", trailing: null, rolling: rr.ret_7days },
      { key: "14d", label: "14D", trailing: null, rolling: rr.ret_14days },
      { key: "21d", label: "21D", trailing: null, rolling: rr.ret_21days },
      { key: "1m", label: "1M", trailing: tr.ret_1month, rolling: rr.ret_28days },
      { key: "3m", label: "3M", trailing: tr.ret_3month, rolling: rr.ret_90days },
      { key: "6m", label: "6M", trailing: tr.ret_6month, rolling: rr.ret_180days },
      { key: "ytd", label: "YTD", trailing: tr.ret_ytd, rolling: null },
      { key: "1y", label: "1Y", trailing: tr.ret_1year, rolling: rr.ret_365days },
      { key: "3y", label: "3Y", trailing: tr.ret_3year, rolling: null },
      { key: "5y", label: "5Y", trailing: tr.ret_5year, rolling: null },
      { key: "7y", label: "7Y", trailing: tr.ret_7year, rolling: null },
      { key: "10y", label: "10Y", trailing: tr.ret_10year, rolling: null },
    ];

    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-xl overflow-hidden shadow-sm">
          <div className="bg-slate-50 px-3 py-2 border border-slate-200 border-b-0 rounded-t-xl">
            <h3 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
              Fund Returns Overview (%)
            </h3>
          </div>
          <div className="overflow-x-auto w-full table-scrollbar">
            <table className="w-full text-center text-[10px] sm:text-[11px] border-collapse">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-2 py-1.5 border border-slate-200 text-left font-black text-slate-700 bg-slate-50 sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-10 w-20 sm:w-28 border-r border-slate-100">
                    Type
                  </th>
                  {periods.map((p) => (
                    <th key={p.key} className="px-2 py-1.5 border border-slate-200 bg-slate-50 whitespace-nowrap">
                      {p.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-2 py-1.5 border border-slate-200 text-left font-bold text-slate-700 bg-slate-50 sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-10 border-r border-slate-100">
                    Trailing
                  </td>
                  {periods.map((p) => (
                    <td key={`tr-${p.key}`} className="px-2 py-1.5 border border-slate-200 whitespace-nowrap">
                      {formatReturn(p.trailing)}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-2 py-1.5 border border-slate-200 text-left font-bold text-slate-700 bg-slate-50 sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-10 border-r border-slate-100">
                    Rolling
                  </td>
                  {periods.map((p) => (
                    <td key={`rr-${p.key}`} className="px-2 py-1.5 border border-slate-200 whitespace-nowrap">
                      {formatReturn(p.rolling)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {renderMonthlyReturnsMatrix()}
      </div>
    );
  };

  const renderMonthlyReturnsMatrix = () => {
    if (!monthlyData || monthlyData.length === 0) return null;

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const matrix: Record<string, Record<string, number>> = {};

    monthlyData.forEach((item: any) => {
      if (!item.date || !item.returns) return;
      const d = new Date(item.date);
      const year = d.getFullYear().toString();
      const month = months[d.getMonth()];

      if (!matrix[year]) matrix[year] = {};
      matrix[year][month] = parseFloat(item.returns);
    });

    const sortedYears = Object.keys(matrix).sort((a, b) => Number(b) - Number(a));

    return (
      <div className="rounded-xl overflow-hidden shadow-sm">
        <div className="bg-slate-50 px-3 py-2 border border-slate-200 border-b-0 rounded-t-xl">
          <h3 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
            Monthly Returns Matrix (%)
          </h3>
        </div>
        <div className="overflow-x-auto w-full table-scrollbar">
          <table className="w-full text-center text-[10px] sm:text-[11px] border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-2 py-1.5 border border-slate-200 text-left font-black text-slate-700 bg-slate-50 sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-10 w-16">
                  Year
                </th>
                {months.map((m) => (
                  <th key={m} className="px-2 py-1.5 border border-slate-200 bg-slate-50">
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedYears.map((year) => (
                <tr key={year} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-2 py-1.5 border border-slate-200 text-left font-bold text-slate-700 bg-slate-50 sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-10">
                    {year}
                  </td>
                  {months.map((month) => (
                    <td key={month} className="px-2 py-1.5 border border-slate-200 whitespace-nowrap">
                      {matrix[year][month] !== undefined ? formatReturn(matrix[year][month]) : <span className="text-slate-300">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderRiskMeasures = () => {
    const rm = riskData.risk_measures || {};
    const rrm = riskData.relative_risk_measures || {};

    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-xl overflow-hidden shadow-sm">
          <div className="bg-slate-50 px-3 py-2 border border-slate-200 border-b-0 rounded-t-xl">
            <h3 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
              Risk Measures
            </h3>
          </div>
          <div className="overflow-x-auto w-full table-scrollbar">
            <table className="w-full text-center text-[10px] sm:text-[11px] border-collapse">
              <thead className="bg-slate-50 text-slate-500 font-bold tracking-wider">
                <tr>
                  <th className="px-2 py-1.5 border border-slate-200 bg-slate-50 align-middle">Mean</th>
                  <th className="px-2 py-1.5 border border-slate-200 bg-slate-50 align-middle">Standard Deviation</th>
                  <th className="px-2 py-1.5 border border-slate-200 bg-slate-50 align-middle">Sharpe Ratio</th>
                  <th className="px-2 py-1.5 border border-slate-200 bg-slate-50 align-middle">Sortino Ratio</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-2 py-1.5 border border-slate-200 font-black text-slate-800 align-middle">{formatNum(rm.mean)}</td>
                  <td className="px-2 py-1.5 border border-slate-200 font-black text-slate-800 align-middle">{formatNum(rm.standard_deviation)}</td>
                  <td className="px-2 py-1.5 border border-slate-200 font-black text-slate-800 align-middle">{formatNum(rm.sharpe_ratio)}</td>
                  <td className="px-2 py-1.5 border border-slate-200 font-black text-slate-800 align-middle">{formatNum(rm.sortino_ratio)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden shadow-sm">
          <div className="bg-slate-50 px-3 py-2 border border-slate-200 border-b-0 rounded-t-xl">
            <h3 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
              Relative Risk Measures
            </h3>
          </div>
          <div className="overflow-x-auto w-full table-scrollbar">
            <table className="w-full text-center text-[9px] sm:text-[11px] leading-tight border-collapse">
              <thead className="bg-slate-50 text-slate-500 font-bold tracking-wider">
                <tr>
                  <th className="px-2 py-1.5 border border-slate-200 bg-slate-50 align-middle">R-Squared</th>
                  <th className="px-2 py-1.5 border border-slate-200 bg-slate-50 align-middle">Alpha</th>
                  <th className="px-2 py-1.5 border border-slate-200 bg-slate-50 align-middle">Alpha (Stated)</th>
                  <th className="px-2 py-1.5 border border-slate-200 bg-slate-50 align-middle">Beta</th>
                  <th className="px-2 py-1.5 border border-slate-200 bg-slate-50 align-middle">Beta (Stated)</th>
                  <th className="px-2 py-1.5 border border-slate-200 bg-slate-50 align-middle">Treynor Ratio</th>
                  <th className="px-2 py-1.5 border border-slate-200 bg-slate-50 align-middle">Treynor (Stated)</th>
                  <th className="px-2 py-1.5 border border-slate-200 bg-slate-50 align-middle">Information Ratio</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-2 py-1.5 border border-slate-200 font-black text-slate-800 align-middle">{formatNum(rrm.rsquared)}</td>
                  <td className="px-2 py-1.5 border border-slate-200 font-black text-slate-800 align-middle">{formatNum(rrm.alpha)}</td>
                  <td className="px-2 py-1.5 border border-slate-200 font-black text-slate-800 align-middle">{formatNum(rrm.alpha_stated)}</td>
                  <td className="px-2 py-1.5 border border-slate-200 font-black text-slate-800 align-middle">{formatNum(rrm.beta)}</td>
                  <td className="px-2 py-1.5 border border-slate-200 font-black text-slate-800 align-middle">{formatNum(rrm.beta_stated)}</td>
                  <td className="px-2 py-1.5 border border-slate-200 font-black text-slate-800 align-middle">{formatNum(rrm.treynor)}</td>
                  <td className="px-2 py-1.5 border border-slate-200 font-black text-slate-800 align-middle">{formatNum(rrm.treynor_stated)}</td>
                  <td className="px-2 py-1.5 border border-slate-200 font-black text-slate-800 align-middle">{formatNum(rrm.information_ratio)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    );
  };

  return (
    <div className="absolute inset-0 z-[99999] flex items-center justify-center bg-white/80 backdrop-blur-sm p-2 sm:p-4 lg:p-6 w-full h-full overflow-hidden pointer-events-none">
      <div className="absolute inset-0 pointer-events-auto" onClick={onClose} />
      
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col w-full max-w-5xl h-full sm:h-[95%] relative pointer-events-auto animate-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* ─── LOADING & ERROR STATES ─── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full w-full relative">
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
              <X className="w-5 h-5" />
            </button>
            <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-distributor-500 mb-3" />
            <p className="text-slate-500 font-bold text-xs sm:text-sm tracking-widest uppercase">Loading Analytics...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full w-full relative py-8">
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
              <X className="w-5 h-5" />
            </button>
            <ShieldAlert className="w-10 h-10 text-rose-300 mb-3" />
            <p className="text-rose-600 font-bold text-center max-w-sm text-sm">{error}</p>
          </div>
        ) : (
          <>
            {/* ─── ULTRA COMPACT HEADER ─── */}
            <div className="flex items-start justify-between px-4 py-3 sm:px-5 sm:py-4 border-b border-slate-100 bg-white shrink-0">
              <div className="pr-2 sm:pr-4 flex-1">
                
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                    {commonInfo.fundName}
                  </h2>
                  <span className="bg-slate-50 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest whitespace-nowrap">
                    {commonInfo.category}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] sm:text-[11px] text-slate-600 mb-1.5">
                  <div className="flex items-center gap-1"><span className="text-slate-400">Allotment:</span><strong className="text-slate-800">{commonInfo.allotmentDate}</strong></div>
                  <div className="flex items-center gap-1"><span className="text-slate-400">Risk:</span><strong className="text-rose-600 uppercase">{commonInfo.riskometer}</strong></div>
                  <div className="flex items-center gap-1"><span className="text-slate-400">AUM:</span><strong className="text-slate-800">{commonInfo.aum}</strong></div>
                  <div className="flex items-center gap-1"><span className="text-slate-400">Benchmark:</span><strong className="text-slate-800">{commonInfo.benchmark}</strong></div>
                </div>

                {commonInfo.fundManagersList.length > 0 && (
                  <div className="flex items-center gap-2 max-w-full mt-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Managers:</span>
                    <div className="flex flex-wrap gap-1">
                      {commonInfo.fundManagersList.map((m: any, i: number) => (
                        <span key={i} className="bg-slate-50 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md text-[9px] font-semibold whitespace-nowrap">
                          {m.person_name} <span className="text-slate-400 font-medium">(Since {formatDateDDMMYYYY(m.date_from)})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              <button onClick={onClose} className="p-1 sm:p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0 -mt-1 -mr-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ─── COMPACT TAB NAVIGATION ─── */}
            <div className="flex items-center gap-4 px-4 sm:px-5 border-b border-slate-100 bg-slate-50/50 shrink-0 overflow-x-auto table-scrollbar">
              {(["performance", "risk", "portfolio"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 sm:py-2.5 px-1 text-[11px] sm:text-xs font-bold capitalize tracking-wide transition-all border-b-2 whitespace-nowrap outline-none ${
                    activeTab === tab
                      ? "border-distributor-500 text-distributor-700"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {tab === "performance" && <TrendingUp className={`w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5 ${activeTab === tab ? "text-distributor-500" : "text-slate-400"}`} />}
                  {tab === "risk" && <ShieldAlert className={`w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5 ${activeTab === tab ? "text-distributor-500" : "text-slate-400"}`} />}
                  {tab === "portfolio" && <PieChart className={`w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5 ${activeTab === tab ? "text-distributor-500" : "text-slate-400"}`} />}
                  {tab}
                </button>
              ))}
            </div>

            {/* ─── TAB CONTENT (Expanded Room) ─── */}
            <div className="flex-1 overflow-y-auto bg-white p-3 sm:p-4 lg:p-5 table-scrollbar relative">
              <div className={activeTab === "performance" ? "block" : "hidden"}>
                {renderPerformanceTab()}
              </div>
              <div className={activeTab === "risk" ? "block" : "hidden"}>
                {renderRiskMeasures()}
              </div>
              <div className={activeTab === "portfolio" ? "block" : "hidden"}>
                <FundPortfolioTab amfiCode={amfiCode} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}