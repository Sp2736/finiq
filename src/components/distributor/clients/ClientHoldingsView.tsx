"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { distributorService } from "@/services/distributor.service";
import GlobalStatsRibbon from "@/components/investor/GlobalStatsRibbon";
import { exportCapitalGains } from "@/lib/capitalGainsExport";
import { getDynamicFinancialYears } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  FileSpreadsheet,
  X,
  Calculator,
  AlertTriangle,
  Info,
} from "lucide-react";
import { formatCurrency, toTitleCase } from "@/lib/utils";
import { ClientPortfolio } from "@/types/investor";

// ─────────────────────────────────────────────────────────────────────────────
// TODO: Replace this static config with the authenticated distributor's
//       profile fetched from your API or user context (e.g. useAuth() hook).
//       Fields: name, address, email, phone, logoBase64 (optional – for PDF header).
//       Example:  const distributorInfo = useDistributorProfile();
// ─────────────────────────────────────────────────────────────────────────────
const DISTRIBUTOR_INFO = {
  name: "FINIQ DISTRIBUTION NETWORK",
  address: "712, Tech Park, Startup Road, Bangalore - 560001",
  email: "support@finiq.com",
  phone: "+91 98765 43210",
  // logoBase64: "", // TODO: Provide base64-encoded PNG logo for PDF header
};

interface ClientHoldingsViewProps {
  clientId: string;
  onBack: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// INLINE NOTIFICATION  (replaces alert() calls)
// ─────────────────────────────────────────────────────────────────────────────
type NotifType = "error" | "info" | "warning";
interface Notif {
  type: NotifType;
  message: string;
}

const InlineNotif = ({
  notif,
  onDismiss,
}: {
  notif: Notif;
  onDismiss: () => void;
}) => {
  const styles: Record<NotifType, string> = {
    error:   "bg-rose-50 border-rose-200 text-rose-700",
    info:    "bg-blue-50 border-blue-200 text-blue-700",
    warning: "bg-amber-50 border-amber-200 text-amber-700",
  };
  const icons: Record<NotifType, React.ReactNode> = {
    error:   <AlertTriangle className="w-4 h-4 shrink-0" />,
    info:    <Info className="w-4 h-4 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 shrink-0" />,
  };
  return (
    <div
      className={`flex items-start gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium ${styles[notif.type]}`}
    >
      {icons[notif.type]}
      <span className="flex-1">{notif.message}</span>
      <button
        onClick={onDismiss}
        className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function ClientHoldingsView({
  clientId,
  onBack,
}: ClientHoldingsViewProps) {
  const financialYearOptions = useMemo(
    () => getDynamicFinancialYears(2010),
    [],
  );

  const [selectedFY, setSelectedFY]         = useState(financialYearOptions[0]);
  const [portfolioData, setPortfolioData]   = useState<any>(null);
  const [isLoading, setIsLoading]           = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [expandedRow, setExpandedRow]       = useState<number | null>(null);
  const [isCGModalOpen, setIsCGModalOpen]   = useState(false);
  const [exportingFormat, setExportingFormat] = useState<"pdf" | "excel" | null>(null);

  // Replaces alert() — shown inline inside the CG modal
  const [cgNotif, setCGNotif] = useState<Notif | null>(null);

  // ── Portfolio fetch ──────────────────────────────────────────────────────
  useEffect(() => {
    const fetchHoldings = async () => {
      setIsLoading(true);
      try {
        const res = await distributorService.getClientPortfolio(clientId);
        if (res.success && res.data) {
          setPortfolioData(res.data);
        } else {
          setError(res.message || "Failed to fetch holdings.");
        }
      } catch (err: any) {
        console.error("Error fetching holdings:", err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchHoldings();
  }, [clientId]);

  // ── Normalised portfolio for the stats ribbon ────────────────────────────
  const normalizedPortfolio = useMemo((): ClientPortfolio | null => {
    if (!portfolioData) return null;
    const d = portfolioData;
    return {
      id: clientId,
      clientName: d.investor_name || "Investor",
      totalCapital: d.total_capital || 0,
      investedCapital: d.invested_capital || 0,
      currentValue: d.current_value || 0,
      dividendPayout: d.dividend_payout || 0,
      unrealisedGain:
        (d.unrealised_gains_lt || 0) + (d.unrealised_gains_st || 0) || 0,
      unrealisedGainPercent: d.abs_percent || 0,
      realisedGain:
        (d.realised_gains_lt || 0) + (d.realised_gains_st || 0) || 0,
      netPL: d.current_value - d.total_capital || 0,
      todaysGain: d.todays_pnl || 0,
      todaysGainPercent: d.todays_pnl_percent || 0,
      xirr: d.xirr_percent || 0,
      abs: d.abs_percent || 0,
      avgHoldingDays: 0,
      funds: [],
    } as unknown as ClientPortfolio;
  }, [portfolioData, clientId]);

  const funds = portfolioData?.funds || [];

  // ── FY → date range helper ───────────────────────────────────────────────
  const getFYDates = (fy: string) => {
    const startYear = parseInt(fy.split("-")[0]);
    return {
      start_date: `${startYear}-04-01`,
      end_date:   `${startYear + 1}-03-31`,
    };
  };

  // ── Backend → export format mapper ──────────────────────────────────────
  const mapBackendToExportFormat = useCallback(
    (backendData: any[], currentPortfolio: any) => {
      const firstRow = backendData[0] || {};
      const invName =
        firstRow.investor_name || currentPortfolio?.investor_name || "Investor";

      const mapped = {
        investorDetails: {
          name:    invName,
          pan:     firstRow.pan     || currentPortfolio?.pan     || "N/A",
          address: firstRow.address || currentPortfolio?.address || "Address Not Provided",
          mobile:  firstRow.mobile  || currentPortfolio?.mobile  || "N/A",
          email:   firstRow.email   || currentPortfolio?.email   || "N/A",
        },
        mutualFunds: [] as any[],
        capitalGainSummary: { shortTerm: 0, longTerm: 0, total: 0 },
      };

      const fundsMap = new Map<string, any>();

      backendData.forEach((tx) => {
        const key = `${tx.scheme_name}__${tx.folio_number}`;
        if (!fundsMap.has(key)) {
          fundsMap.set(key, {
            fundName:   tx.scheme_name    || "Unknown Fund",
            folioNo:    tx.folio_number   || "N/A",
            isin:       tx.isin_no        || "N/A",
            assetClass: tx.asset_class    || "Equity",
            transactions: [],
          });
        }

        const stPL = Number(tx.short_term_pl ?? tx.stcg ?? 0);
        const ltPL = Number(tx.long_term_pl  ?? tx.ltcg ?? 0);

        mapped.capitalGainSummary.shortTerm += stPL;
        mapped.capitalGainSummary.longTerm  += ltPL;
        mapped.capitalGainSummary.total     += stPL + ltPL;

        fundsMap.get(key)!.transactions.push({
          sellDate:          tx.sell_date,
          holdingDays:       tx.holding_days,
          transactionType:   tx.selling_transaction_type || "Redemption",
          sellNav:           tx.sell_nav            || 0,
          sellAmount:        tx.sell_amount          || 0,
          sttAndOthers:      tx.stt_and_others       || 0,
          tdsAndOthers:      tx.tds_and_others       || 0,  // now forwarded to PDF
          purchaseDate:      tx.purchase_date        || "N/A",
          purchaseNav:       tx.purchase_nav         || 0,
          netPurchaseAmount: tx.net_sell_amount ?? tx.purchase_amount ?? 0,
          stampDuty:         tx.stamp_duty           || 0,
          costAcquisition:   tx.cost_of_acquisition  || 0,
          shortTermPL:       stPL,
          longTermPL:        ltPL,
        });
      });

      mapped.mutualFunds = Array.from(fundsMap.values());
      return mapped;
    },
    [],
  );

  // ── Capital Gains export handler ─────────────────────────────────────────
  const handleExportCG = async (format: "pdf" | "excel") => {
    setCGNotif(null);
    setExportingFormat(format);
    const { start_date, end_date } = getFYDates(selectedFY);

    try {
      const res = await distributorService.getCapitalGains({
        investor_id: clientId,
        start_date,
        end_date,
      });

      const cgDataArray: any[] = res.data?.[0]?.get_capital_gains_vr || [];

      if (cgDataArray.length === 0) {
        setCGNotif({
          type: "info",
          message: `No capital gains records found for FY ${selectedFY}. Please try a different year.`,
        });
        return;
      }

      const mappedData = mapBackendToExportFormat(cgDataArray, portfolioData);
      exportCapitalGains(format, mappedData, selectedFY, DISTRIBUTOR_INFO);
      setIsCGModalOpen(false);
    } catch (err: any) {
      console.error("Capital Gains fetch failed:", err);
      setCGNotif({
        type: "error",
        message:
          err?.message ||
          "Failed to fetch Capital Gains data. Please try again.",
      });
    } finally {
      setExportingFormat(null);
    }
  };

  // ── Close modal & reset local state ─────────────────────────────────────
  const handleCloseModal = () => {
    if (exportingFormat) return; // prevent close while exporting
    setIsCGModalOpen(false);
    setCGNotif(null);
    // Intentionally keep selectedFY — user likely wants the same FY next time
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full relative z-10 animate-in slide-in-from-right-4 fade-in duration-300">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="shrink-0 mb-4 lg:mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-slate-600 mb-3 w-fit"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Investors List
          </button>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 mb-1">
            {portfolioData?.investor_name ? (
              <>
                {toTitleCase(portfolioData.investor_name)}&apos;s{" "}
                <span className="text-emerald-600">Portfolio</span>
              </>
            ) : (
              <>
                Client <span className="text-emerald-600">Portfolio</span>
              </>
            )}
          </h1>
          <p className="text-slate-500 font-medium text-xs lg:text-sm truncate">
            View detailed mutual fund holdings and transaction history securely.
          </p>
        </div>

        <button
          onClick={() => setIsCGModalOpen(true)}
          aria-label="Open Capital Gains report export"
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-md hover:bg-slate-800 transition-all active:scale-95"
        >
          <Calculator className="w-4 h-4" /> Capital Gains
        </button>
      </div>

      {/* ── Stats Ribbon ────────────────────────────────────────────────── */}
      {normalizedPortfolio && (
        <div className="shrink-0 mb-4 lg:mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100 fill-both">
          <GlobalStatsRibbon client={normalizedPortfolio} useCompactValues />
        </div>
      )}

      {/* ── Holdings Table ──────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-both">
        {isLoading ? (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-50 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-sm font-bold text-slate-500">
              Loading portfolio securely...
            </p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mb-3">
              <PieChart className="w-6 h-6 text-rose-300" />
            </div>
            <p className="text-rose-600 font-bold mb-1">
              Error Loading Portfolio
            </p>
            <p className="text-sm text-slate-500 max-w-sm">{error}</p>
          </div>
        ) : funds.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
              <PieChart className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-base font-bold text-slate-600">
              No Holdings Found
            </p>
            <p className="text-xs font-medium text-slate-400 max-w-sm mt-1">
              This investor does not currently have any active mutual fund
              holdings.
            </p>
          </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-auto table-scrollbar">
            <table className="w-full text-left text-sm min-w-[900px] border-separate border-spacing-0">
              <thead className="bg-slate-50/90 backdrop-blur-sm border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-500 font-black sticky top-0 z-20 shadow-sm ring-1 ring-slate-200/50">
                <tr>
                  <th className="p-3 w-10 border-b border-slate-200" />
                  <th className="py-4 border-b border-slate-200">
                    Scheme Name &amp; Folio
                  </th>
                  <th className="p-4 text-right border-b border-slate-200">
                    Units &amp; NAV
                  </th>
                  <th className="p-4 text-right border-b border-slate-200">
                    Invested Value
                  </th>
                  <th className="p-4 text-right border-b border-slate-200">
                    Current Value
                  </th>
                  <th className="p-4 text-right pr-6 border-b border-slate-200">
                    Returns (XIRR)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {funds.map((fund: any, i: number) => {
                  const isExpanded    = expandedRow === i;
                  const schemeName    = fund.fund_name     || "N/A";
                  const folio         = fund.folio_number  || "N/A";
                  const invested      = fund.total_capital || 0;
                  const current       = fund.current_value || 0;
                  const netPnl        = fund.net_pnl       || 0;
                  const xirr          = fund.xirr_percent  || 0;
                  const isPositive    = netPnl >= 0;
                  const transactions  = fund.transactions  || [];

                  return (
                    <React.Fragment key={i}>
                      <tr
                        onClick={() => setExpandedRow(isExpanded ? null : i)}
                        className={`cursor-pointer transition-colors duration-200 group border-b border-slate-100 ${
                          isExpanded ? "bg-emerald-50/30" : "hover:bg-slate-50/80"
                        }`}
                      >
                        <td
                          className={`p-3 text-center border-b border-slate-100 transition-colors ${
                            isExpanded
                              ? "bg-[#f0fdf4]"
                              : "bg-white group-hover:bg-[#f8fafc]"
                          }`}
                        >
                          <button
                            aria-label={isExpanded ? "Collapse transactions" : "Expand transactions"}
                            className="text-slate-400 group-hover:text-emerald-600 outline-none p-1 rounded-md group-hover:bg-emerald-100/50 transition-colors"
                          >
                            <ChevronRight
                              className={`w-4 h-4 transition-transform duration-300 ${
                                isExpanded ? "rotate-90 text-emerald-600" : "rotate-0"
                              }`}
                            />
                          </button>
                        </td>

                        <td className="py-4 border-b border-slate-100 pr-4">
                          <p className="font-bold text-slate-900 group-hover:text-emerald-700 mb-0.5 text-xs max-w-[280px] leading-tight">
                            {schemeName}
                          </p>
                          <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold font-mono tracking-wide">
                            Folio: {folio}
                          </span>
                        </td>

                        <td className="p-4 text-right border-b border-slate-100">
                          <p className="font-bold text-slate-700 tabular-nums text-xs mb-0.5">
                            {fund.available_units?.toFixed(3) || "0"}
                          </p>
                          <p className="text-[10px] font-medium text-slate-400 tabular-nums">
                            NAV: ₹{fund.current_nav || 0}
                          </p>
                        </td>

                        <td className="p-4 text-right border-b border-slate-100">
                          <p className="font-medium text-slate-600 tabular-nums text-sm">
                            {formatCurrency(invested)}
                          </p>
                        </td>

                        <td className="p-4 text-right border-b border-slate-100">
                          <p className="font-black text-slate-900 tabular-nums text-sm">
                            {formatCurrency(current)}
                          </p>
                        </td>

                        <td className="p-4 text-right border-b border-slate-100 pr-6">
                          <div className="flex flex-col items-end">
                            <div
                              className={`flex items-center gap-0.5 text-xs font-black ${
                                isPositive ? "text-emerald-600" : "text-rose-600"
                              }`}
                            >
                              {isPositive ? (
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              ) : (
                                <ArrowDownRight className="w-3.5 h-3.5" />
                              )}
                              {xirr}%
                            </div>
                            <span
                              className={`text-[10px] font-bold mt-0.5 tabular-nums ${
                                isPositive ? "text-emerald-500" : "text-rose-500"
                              }`}
                            >
                              {formatCurrency(netPnl)}
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* ── Expanded Transaction History ─────────────────── */}
                      <tr className="bg-slate-50/40">
                        <td
                          colSpan={6}
                          className="p-0 border-b border-slate-200/60"
                        >
                          <div
                            className={`grid transition-all duration-300 ease-in-out ${
                              isExpanded
                                ? "grid-rows-[1fr] opacity-100"
                                : "grid-rows-[0fr] opacity-0"
                            }`}
                          >
                            <div className="overflow-hidden">
                              <div className="p-4 pl-14 pr-6">
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                      Transaction History
                                    </h4>
                                    <p className="text-[10px] font-bold text-slate-400">
                                      {transactions.length} entries
                                    </p>
                                  </div>
                                  {transactions.length > 0 ? (
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-left text-xs">
                                        <thead className="bg-white border-b border-slate-100 text-[9px] uppercase tracking-widest text-slate-400 font-bold">
                                          <tr>
                                            <th className="p-3 pl-4">Date</th>
                                            <th className="p-3">Type</th>
                                            <th className="p-3 text-right">Amount</th>
                                            <th className="p-3 text-right">NAV</th>
                                            <th className="p-3 text-right pr-4">Units</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                          {transactions.map((t: any, tid: number) => (
                                            <tr
                                              key={tid}
                                              className="hover:bg-slate-50/50 transition-colors"
                                            >
                                              <td className="p-3 pl-4 text-slate-600 font-medium whitespace-nowrap">
                                                {t.transaction_date
                                                  ? new Date(
                                                      t.transaction_date,
                                                    ).toLocaleDateString("en-GB", {
                                                      day:   "2-digit",
                                                      month: "short",
                                                      year:  "numeric",
                                                    })
                                                  : "N/A"}
                                              </td>
                                              <td className="p-3 text-slate-700 font-bold truncate max-w-[200px]">
                                                {t.transaction_type || "Unknown"}
                                              </td>
                                              <td className="p-3 text-right font-black text-slate-900 tabular-nums">
                                                {formatCurrency(t.amount || 0)}
                                              </td>
                                              <td className="p-3 text-right text-slate-500 font-medium tabular-nums">
                                                ₹{t.nav || 0}
                                              </td>
                                              <td className="p-3 text-right text-emerald-600 font-bold tabular-nums pr-4">
                                                +{t.units?.toFixed(3) || "0"}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    <div className="p-6 text-center text-slate-400 text-xs font-medium">
                                      No transactions recorded for this fund.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Capital Gains Export Modal ───────────────────────────────────── */}
      {isCGModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cg-modal-title"
        >
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3
                id="cg-modal-title"
                className="font-black text-slate-900 text-lg"
              >
                Capital Gains Report
              </h3>
              <button
                onClick={handleCloseModal}
                disabled={!!exportingFormat}
                aria-label="Close modal"
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">

              {/* Inline notification (replaces alert) */}
              {cgNotif && (
                <InlineNotif
                  notif={cgNotif}
                  onDismiss={() => setCGNotif(null)}
                />
              )}

              {/* Financial Year Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                  Select Financial Year
                </label>
                <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-2 pb-1 table-scrollbar">
                  {financialYearOptions.map((fy) => (
                    <button
                      key={fy}
                      onClick={() => {
                        setSelectedFY(fy);
                        setCGNotif(null); // clear stale notification on FY change
                      }}
                      disabled={!!exportingFormat}
                      aria-pressed={selectedFY === fy}
                      className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all active:scale-95 flex items-center justify-center ${
                        selectedFY === fy
                          ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm ring-1 ring-emerald-500/20"
                          : "bg-white border-slate-200 text-slate-600 hover:border-emerald-200 hover:bg-slate-50"
                      } disabled:opacity-50 disabled:active:scale-100`}
                    >
                      {fy}
                    </button>
                  ))}
                </div>
              </div>

              {/* Export Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleExportCG("pdf")}
                  disabled={!!exportingFormat}
                  aria-label="Export as PDF"
                  className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 border-slate-100 hover:border-rose-200 hover:bg-rose-50 text-rose-600 disabled:opacity-50 active:scale-95 transition-all"
                >
                  {exportingFormat === "pdf" ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <FileText className="w-6 h-6" />
                  )}
                  <span className="text-xs font-bold">
                    {exportingFormat === "pdf" ? "Generating…" : "Export PDF"}
                  </span>
                </button>

                <button
                  onClick={() => handleExportCG("excel")}
                  disabled={!!exportingFormat}
                  aria-label="Export as Excel"
                  className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 text-emerald-600 disabled:opacity-50 active:scale-95 transition-all"
                >
                  {exportingFormat === "excel" ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-6 h-6" />
                  )}
                  <span className="text-xs font-bold">
                    {exportingFormat === "excel" ? "Generating…" : "Export Excel"}
                  </span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}