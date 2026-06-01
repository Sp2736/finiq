"use client";

import React from "react";
import { Download, TrendingUp, PieChart, Activity, X } from "lucide-react";
import { formatCurrency, getStatusColor } from "@/lib/utils";

export interface FundHolding {
  folio_number: string;
  fund_name: string;
  amfi_code: string;
  purchase_date: string;
  avg_days: number;
  total_capital: number;
  current_value: number;
  available_units: number;
  current_nav: number;
  avg_nav: number;
  unrealised_gains_st: number;
  unrealised_gains_lt: number;
  net_pnl: number;
  todays_pnl: number;
  xirr_percent: number;
  abs_percent: number;
  sip_status: string | null;
}

export interface HoldingsData {
  investor_name: string;
  total_capital: number;
  invested_capital: number;
  current_value: number;
  unrealised_gains_st: number;
  unrealised_gains_lt: number;
  realised_gains_st: number;
  realised_gains_lt: number;
  todays_pnl_percent: number;
  abs_percent: number;
  xirr_percent: number;
  estimated_unrealised_tax_stcg: number;
  estimated_unrealised_tax_ltcg: number;
  funds: FundHolding[];
}

interface HoldingsReportProps {
  data: HoldingsData;
  onExportPdf?: () => void;
  isExporting?: boolean;
  onClose?: () => void; // Added onClose directly to the report
}

export default function HoldingsReport({ data, onExportPdf, isExporting, onClose }: HoldingsReportProps) {
  if (!data) return null;

  const totalUnrealised = data.unrealised_gains_st + data.unrealised_gains_lt;
  const totalRealised = data.realised_gains_st + data.realised_gains_lt;
  const totalEstimatedTax = data.estimated_unrealised_tax_stcg + data.estimated_unrealised_tax_ltcg;

  const formatDate = (isoString: string) => {
    if (!isoString) return "N/A";
    const date = new Date(isoString);
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className="flex flex-col h-full bg-white w-full">
      
      {/* ─── INTEGRATED HEADER (Ultra Compact) ─── */}
      <div className="px-4 py-3 border-b border-slate-200 shrink-0 flex justify-between items-center bg-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-distributor-50 rounded-md hidden sm:block">
            <PieChart className="w-5 h-5 text-investor-600" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none mb-1">Portfolio Holdings</h2>
            <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-none">
              Client: <span className="font-bold text-slate-800">{data.investor_name}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="text-right hidden md:block mr-2">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Report Date</p>
            <p className="text-xs font-bold text-slate-700 leading-none">{formatDate(new Date().toISOString())}</p>
          </div>
          
          {onExportPdf && (
            <button
              onClick={onExportPdf}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-distributor-600 text-white rounded-md text-xs font-bold shadow-sm hover:bg-distributor-700 transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100"
            >
              {isExporting ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isExporting ? "Generating..." : "Download PDF"}</span>
            </button>
          )}

          {onClose && (
            <button 
              onClick={onClose} 
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors border border-transparent hover:border-rose-100"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* ─── KPI SUMMARY RIBBON (Tight Grid, No Scroll) ─── */}
      <div className="bg-slate-50/50 border-b border-slate-200 shrink-0 px-4 py-2.5">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-y-3 gap-x-2 md:divide-x md:divide-slate-200/60">
          <div className="px-2 first:pl-0">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Invested Capital</p>
            <p className="text-sm font-black text-slate-900 tabular-nums">{formatCurrency(data.invested_capital)}</p>
          </div>
          <div className="px-2">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Current Value</p>
            <p className="text-sm font-black text-investor-600 tabular-nums">{formatCurrency(data.current_value)}</p>
          </div>
          <div className="px-2">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Unrealised Gain</p>
            <p className={`text-sm font-black tabular-nums ${getStatusColor(totalUnrealised)}`}>{formatCurrency(totalUnrealised)}</p>
          </div>
          <div className="px-2">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Net XIRR</p>
            <div className="flex items-center gap-1.5">
              <p className={`text-sm font-black tabular-nums ${getStatusColor(data.xirr_percent)}`}>{data.xirr_percent.toFixed(2)}%</p>
              <span className="text-[9px] font-bold text-slate-500">({data.abs_percent.toFixed(2)}% ABS)</span>
            </div>
          </div>
          <div className="px-2">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Est. Tax Liability</p>
            <p className="text-sm font-black text-rose-600 tabular-nums">{formatCurrency(totalEstimatedTax)}</p>
          </div>
        </div>
      </div>

      {/* ─── DATA TABLE (Maximized Vertical Scroll) ─── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 shadow-sm ring-1 ring-slate-200/50">
            <tr className="bg-slate-100 text-[9px] uppercase tracking-widest text-slate-500 font-bold">
              <th className="px-3 py-2.5 border-b border-slate-200/50 w-[28%]">Fund Details</th>
              <th className="px-2 py-2.5 border-b border-slate-200/50 whitespace-nowrap w-[8%]">Pur. Date</th>
              <th className="px-2 py-2.5 text-right border-b border-slate-200/50 whitespace-nowrap w-[10%]">Principal</th>
              <th className="px-2 py-2.5 text-right border-b border-slate-200/50 whitespace-nowrap w-[14%]">Curr Val & Units</th>
              <th className="px-2 py-2.5 text-right border-b border-slate-200/50 whitespace-nowrap w-[10%]">NAV (Cur/Avg)</th>
              <th className="px-2 py-2.5 text-right border-b border-slate-200/50 whitespace-nowrap w-[10%]">Unrealised</th>
              <th className="px-2 py-2.5 text-right border-b border-slate-200/50 whitespace-nowrap w-[10%]">Net P&L</th>
              <th className="px-3 py-2.5 text-right border-b border-slate-200/50 whitespace-nowrap w-[10%]">XIRR %</th>
            </tr>
          </thead>
          <tbody className="text-[11px] divide-y divide-slate-100">
            {data.funds.map((fund, idx) => {
              const fundUnrealised = fund.unrealised_gains_st + fund.unrealised_gains_lt;
              return (
                <tr key={idx} className="hover:bg-distributor-50/30 transition-colors">
                  <td className="px-3 py-2">
                    <span className="font-bold text-slate-900 block mb-0.5 leading-tight">{fund.fund_name}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono text-slate-500">Folio: {fund.folio_number}</span>
                      {fund.sip_status && (
                        <span className={`text-[8px] font-bold uppercase rounded px-1 ${fund.sip_status === 'Active' ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}`}>{fund.sip_status}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-2 text-slate-500 font-medium tabular-nums whitespace-nowrap">
                    {formatDate(fund.purchase_date)}
                  </td>
                  <td className="px-2 py-2 text-right font-medium text-slate-600 tabular-nums whitespace-nowrap">
                    {formatCurrency(fund.total_capital)}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums whitespace-nowrap">
                    <span className="block font-bold text-slate-900 leading-tight">{formatCurrency(fund.current_value)}</span>
                    <span className="block text-[9px] text-slate-400 font-medium">{fund.available_units.toFixed(3)} U</span>
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums whitespace-nowrap">
                    <span className="block font-bold text-slate-700 leading-tight">{fund.current_nav.toFixed(4)}</span>
                    <span className="block text-[9px] text-slate-400 font-medium">Avg: {fund.avg_nav.toFixed(4)}</span>
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums whitespace-nowrap">
                    <span className={`block font-bold leading-tight ${getStatusColor(fundUnrealised)}`}>{formatCurrency(fundUnrealised)}</span>
                    <div className="flex justify-end gap-1 mt-0.5 text-[8px] font-bold">
                      {fund.unrealised_gains_st !== 0 && <span className="text-amber-500">ST</span>}
                      {fund.unrealised_gains_lt !== 0 && <span className="text-emerald-500">LT</span>}
                    </div>
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums whitespace-nowrap">
                    <span className={`block font-bold ${getStatusColor(fund.net_pnl)}`}>{formatCurrency(fund.net_pnl)}</span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums whitespace-nowrap">
                    <div className={`inline-flex items-center gap-0.5 font-bold ${getStatusColor(fund.xirr_percent)}`}>
                      {fund.xirr_percent > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <Activity className="w-2.5 h-2.5" />}
                      {fund.xirr_percent.toFixed(2)}%
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-100 sticky bottom-0 border-t-2 border-slate-200">
            <tr>
              <td className="px-3 py-2.5 font-black text-slate-900 text-[10px]">MUTUAL FUNDS TOTAL</td>
              <td className="px-2 py-2.5"></td>
              <td className="px-2 py-2.5 text-right font-black text-slate-900 whitespace-nowrap text-[11px]">{formatCurrency(data.invested_capital)}</td>
              <td className="px-2 py-2.5 text-right font-black text-investor-600 whitespace-nowrap text-[11px]">{formatCurrency(data.current_value)}</td>
              <td className="px-2 py-2.5"></td>
              <td className={`px-2 py-2.5 text-right font-black whitespace-nowrap text-[11px] ${getStatusColor(totalUnrealised)}`}>{formatCurrency(totalUnrealised)}</td>
              <td className={`px-2 py-2.5 text-right font-black whitespace-nowrap text-[11px] ${getStatusColor(totalUnrealised + totalRealised)}`}>{formatCurrency(totalUnrealised + totalRealised)}</td>
              <td className={`px-3 py-2.5 text-right font-black whitespace-nowrap text-[11px] ${getStatusColor(data.xirr_percent)}`}>{data.xirr_percent.toFixed(2)}%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}