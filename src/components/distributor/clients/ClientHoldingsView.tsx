"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { distributorService } from "@/services/distributor.service";
import GlobalStatsRibbon from "@/components/investor/GlobalStatsRibbon";
import { exportCapitalGains } from "@/lib/capitalGainsExport";
import { getDynamicFinancialYears } from "@/lib/utils";
import FundAnalyticsModal from "./FundAnalyticsModal";
import HoldingsReport from "./HoldingsReport";
import { generatePortfolioValuationPDF } from "@/lib/portfolioExport";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
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
  BarChart2,
  Eye,
} from "lucide-react";
import { formatCurrency, toTitleCase } from "@/lib/utils";
import { ClientPortfolio } from "@/types/investor";

// ─────────────────────────────────────────────────────────────────────────────
// DISTRIBUTOR CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const DISTRIBUTOR_INFO = {
  name: "SHRINATHJI INVESTMENT",
  address: "527, 5 TH FLOOR, NAVRANG COMPLEX., RAOPURA, VADODARA-390001",
  email: "shrinathjiinvestment@gmail.com",
  phone: "9879786067",
  logoBase64: "",
};

interface ClientHoldingsViewProps {
  clientId: string;
  onBack: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// INLINE NOTIFICATION
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
    error: "bg-rose-50 border-rose-200 text-rose-700",
    info: "bg-distributor-50 border-distributor-200 text-distributor-700",
    warning: "bg-amber-50 border-amber-200 text-amber-700",
  };
  const icons: Record<NotifType, React.ReactNode> = {
    error: <AlertTriangle className="w-4 h-4 shrink-0" />,
    info: <Info className="w-4 h-4 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 shrink-0" />,
  };
  return (
    <div
      className={`flex items-start gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium mb-4 ${styles[notif.type]}`}
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

  const [selectedFY, setSelectedFY] = useState(financialYearOptions[0]);
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const [isCGModalOpen, setIsCGModalOpen] = useState(false);
  const [isFYSelectorOpen, setIsFYSelectorOpen] = useState(false);
  const [fyPage, setFyPage] = useState(0);

  const [exportingFormat, setExportingFormat] = useState<
    "pdf" | "excel" | null
  >(null);
  const [cgNotif, setCGNotif] = useState<Notif | null>(null);

  // Modal States
  const [analyticsFund, setAnalyticsFund] = useState<any>(null);
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // ── Pagination Math for Financial Years ──────────────────────────────────
  const ITEMS_PER_PAGE = 6;
  const paginatedYears = financialYearOptions.slice(
    fyPage * ITEMS_PER_PAGE,
    (fyPage + 1) * ITEMS_PER_PAGE,
  );
  const maxPages = Math.ceil(financialYearOptions.length / ITEMS_PER_PAGE);

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
      funds: d.funds || [],
    } as unknown as ClientPortfolio;
  }, [portfolioData, clientId]);

  const funds = portfolioData?.funds || [];

  const getFYDates = (fy: string) => {
    const startYear = parseInt(fy.split("-")[0]);
    return {
      start_date: `${startYear}-04-01`,
      end_date: `${startYear + 1}-03-31`,
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
          name: invName,
          pan:
            firstRow.pan ||
            currentPortfolio?.pan ||
            currentPortfolio?.investor_pan ||
            "N/A",
          address:
            firstRow.address ||
            currentPortfolio?.address ||
            "Address Not Provided",
          mobile:
            firstRow.mobile ||
            currentPortfolio?.mobile ||
            currentPortfolio?.login_identifier ||
            "N/A",
          email:
            firstRow.email ||
            currentPortfolio?.email ||
            currentPortfolio?.investor_email ||
            "N/A",
        },
        mutualFunds: [] as any[],
        capitalGainSummary: { shortTerm: 0, longTerm: 0, total: 0 },
      };

      const fundsMap = new Map<string, any>();

      backendData.forEach((tx) => {
        const key = `${tx.scheme_name}__${tx.folio_number}`;
        if (!fundsMap.has(key)) {
          fundsMap.set(key, {
            fundName: tx.scheme_name || "Unknown Fund",
            folioNo: tx.folio_number || "N/A",
            amfiCode: tx.amfi_code || "N/A",
            isin: tx.isin_no || "N/A",
            assetClass: tx.asset_class || "Equity",
            transactions: [],
          });
        }

        const stPL = Number(tx.short_term_pl ?? tx.stcg ?? 0);
        const ltPL = Number(tx.long_term_pl ?? tx.ltcg ?? 0);

        mapped.capitalGainSummary.shortTerm += stPL;
        mapped.capitalGainSummary.longTerm += ltPL;
        mapped.capitalGainSummary.total += stPL + ltPL;

        fundsMap.get(key)!.transactions.push({
          sellDate: tx.sell_date,
          holdingDays: tx.holding_days,
          transactionType: tx.selling_transaction_type || "Redemption",
          units: tx.units_qty ?? tx.units ?? 0,
          sellNav: tx.sell_nav || 0,
          sellAmount: tx.sell_amount || 0,
          sttAndOthers: tx.stt_and_others || 0,
          tdsAndOthers: tx.tds_and_others || 0,
          purchaseDate: tx.purchase_date || "N/A",
          purchaseNav: tx.purchase_nav || 0,
          netPurchaseAmount: tx.net_purchase_amount ?? tx.purchase_amount ?? 0,
          stampDuty: tx.stamp_duty || 0,
          costAcquisition: tx.cost_of_acquisition || 0,
          shortTermPL: stPL,
          longTermPL: ltPL,
        });
      });

      mapped.mutualFunds = Array.from(fundsMap.values());
      return mapped;
    },
    [],
  );

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
          message: `No capital Gains records found for FY ${selectedFY}. Please try a different year.`,
        });
        return;
      }

      const mappedData = mapBackendToExportFormat(cgDataArray, portfolioData);

      await exportCapitalGains(
        format,
        mappedData,
        selectedFY,
        DISTRIBUTOR_INFO,
      );
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

  const handleCloseModal = () => {
    if (exportingFormat) return;
    setIsCGModalOpen(false);
    setIsFYSelectorOpen(false);
    setCGNotif(null);
  };

  return (
    <div className="flex flex-col h-full relative z-10 animate-in slide-in-from-right-4 fade-in duration-300">
      {/* ─── ANALYTICS MODAL ─── */}
      {analyticsFund && (
        <FundAnalyticsModal
          fund={analyticsFund}
          onClose={() => setAnalyticsFund(null)}
        />
      )}

      {/* ─── HEADER & ACTIONS ─── */}
      <div className="shrink-0 mb-4 lg:mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="w-full md:w-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-slate-600 mb-3 w-fit transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Investors List
          </button>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 mb-1 leading-tight">
            {portfolioData?.investor_name ? (
              <>
                {toTitleCase(portfolioData.investor_name)}&apos;s{" "}
                <span className="text-distributor-600">Portfolio</span>
              </>
            ) : (
              <>
                Client <span className="text-distributor-600">Portfolio</span>
              </>
            )}
          </h1>
          <p className="text-slate-500 font-medium text-xs lg:text-sm truncate">
            View detailed mutual fund holdings and transaction history.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full md:w-auto mt-2 md:mt-0">
          <button
            onClick={() => setShowReportPreview(true)}
            disabled={!portfolioData}
            className="flex flex-1 md:flex-none items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold shadow-sm hover:border-distributor-300 hover:bg-distributor-50 hover:text-distributor-700 transition-all active:scale-95 disabled:opacity-50"
          >
            <Eye className="w-4 h-4" /> Holdings Report
          </button>

          <button
            onClick={() => setIsCGModalOpen(true)}
            aria-label="Open Capital Gains report export"
            className="flex flex-1 md:flex-none items-center justify-center gap-2 px-5 py-2.5 bg-distributor-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-distributor-800 transition-all active:scale-95"
          >
            <Calculator className="w-4 h-4" /> Capital Gains
          </button>
        </div>
      </div>

      {/* ─── GLOBAL STATS RIBBON ─── */}
      {normalizedPortfolio && (
        <div className="shrink-0 mb-4 lg:mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100 fill-both">
          <GlobalStatsRibbon client={normalizedPortfolio} useCompactValues />
        </div>
      )}

      {/* ─── DATA CONTAINER ─── */}
      <div className="flex-1 min-h-0 bg-white rounded-md border border-slate-200 shadow-sm flex flex-col relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-both">
        {isLoading ? (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-50 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-distributor-600" />
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
          <>
            {/* ─── DESKTOP VIEW (Table) ─── */}
            <div className="hidden lg:flex flex-col flex-1 overflow-auto table-scrollbar">
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
                    const isExpanded = expandedRow === i;
                    const schemeName = fund.fund_name || "N/A";
                    const folio = fund.folio_number || "N/A";
                    const invested = fund.total_capital || 0;
                    const current = fund.current_value || 0;
                    const netPnl = fund.net_pnl || 0;
                    const xirr = fund.xirr_percent || 0;
                    const isPositive = netPnl >= 0;
                    const transactions = fund.transactions || [];

                    return (
                      <React.Fragment key={`desktop-${i}`}>
                        <tr
                          onClick={() => setExpandedRow(isExpanded ? null : i)}
                          className={`cursor-pointer transition-colors duration-200 group border-b border-slate-100 ${
                            isExpanded
                              ? "bg-distributor-50/30"
                              : "hover:bg-slate-50/80"
                          }`}
                        >
                          <td
                            className={`p-3 text-center border-b border-slate-100 transition-colors ${isExpanded ? "bg-[#b0ddff0b]" : "bg-white group-hover:bg-[#f8fafc]"}`}
                          >
                            <button
                              aria-label={
                                isExpanded
                                  ? "Collapse transactions"
                                  : "Expand transactions"
                              }
                              className="text-slate-400 hover:text-distributor-600 outline-none p-1 rounded-md group-hover:bg-distributor-100/50 transition-colors"
                            >
                              <ChevronRight
                                className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? "rotate-90 text-distributor-600" : "rotate-0"}`}
                              />
                            </button>
                          </td>
                          <td className="py-4 border-b border-slate-100 pr-4">
                            <div className="flex items-start justify-between gap-3 pr-2">
                              <div>
                                <p className="font-bold text-slate-900 group-hover:text-distributor-700 mb-0.5 text-xs max-w-[280px] leading-tight">
                                  {schemeName}
                                </p>
                                <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold font-mono tracking-wide mt-0.5">
                                  Folio: {folio}
                                </span>
                              </div>

                              {/* Analytics Trigger Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAnalyticsFund(fund);
                                }}
                                title="View Fund Analytics"
                                className="p-1.5 text-slate-500 bg-white hover:text-distributor-600 hover:bg-distributor-50 rounded-lg transition-colors border border-slate-200 hover:border-distributor-200 shadow-sm cursor-pointer shrink-0"
                              >
                                <BarChart2 className="w-4 h-4" />
                              </button>
                            </div>
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
                                className={`flex items-center gap-0.5 text-xs font-black ${isPositive ? "text-emerald-600" : "text-rose-600"}`}
                              >
                                {isPositive ? (
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                ) : (
                                  <ArrowDownRight className="w-3.5 h-3.5" />
                                )}
                                {xirr}%
                              </div>
                              <span
                                className={`text-[10px] font-bold mt-0.5 tabular-nums ${isPositive ? "text-emerald-500" : "text-rose-500"}`}
                              >
                                {formatCurrency(netPnl)}
                              </span>
                            </div>
                          </td>
                        </tr>

                        <tr className="bg-slate-50/40">
                          <td
                            colSpan={6}
                            className="p-0 border-b border-slate-200/60"
                          >
                            <div
                              className={`grid transition-all duration-300 ease-in-out ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
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
                                              <th className="p-3 text-right">
                                                Amount
                                              </th>
                                              <th className="p-3 text-right">
                                                NAV
                                              </th>
                                              <th className="p-3 text-right pr-4">
                                                Units
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-50">
                                            {transactions.map(
                                              (t: any, tid: number) => (
                                                <tr
                                                  key={tid}
                                                  className="hover:bg-slate-50/50 transition-colors"
                                                >
                                                  <td className="p-3 pl-4 text-slate-600 font-medium whitespace-nowrap">
                                                    {t.transaction_date
                                                      ? new Date(
                                                          t.transaction_date,
                                                        ).toLocaleDateString(
                                                          "en-GB",
                                                          {
                                                            day: "2-digit",
                                                            month: "short",
                                                            year: "numeric",
                                                          },
                                                        )
                                                      : "N/A"}
                                                  </td>
                                                  <td className="p-3 text-slate-700 font-bold truncate max-w-[200px]">
                                                    {t.transaction_type ||
                                                      "Unknown"}
                                                  </td>
                                                  <td className="p-3 text-right font-black text-slate-900 tabular-nums">
                                                    {formatCurrency(
                                                      t.amount || 0,
                                                    )}
                                                  </td>
                                                  <td className="p-3 text-right text-slate-500 font-medium tabular-nums">
                                                    ₹{t.nav || 0}
                                                  </td>
                                                  <td className="p-3 text-right text-distributor-600 font-bold tabular-nums pr-4">
                                                    +
                                                    {t.units?.toFixed(3) || "0"}
                                                  </td>
                                                </tr>
                                              ),
                                            )}
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

            {/* ─── MOBILE / TABLET VIEW (Responsive Grid Cards) ─── */}
            <div className="lg:hidden flex flex-col flex-1 overflow-auto bg-slate-50/30 p-3 sm:p-4 scrollbar-thin">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 auto-rows-max">
                {funds.map((fund: any, i: number) => {
                  const isExpanded = expandedRow === i;
                  const schemeName = fund.fund_name || "N/A";
                  const folio = fund.folio_number || "N/A";
                  const invested = fund.total_capital || 0;
                  const current = fund.current_value || 0;
                  const netPnl = fund.net_pnl || 0;
                  const xirr = fund.xirr_percent || 0;
                  const isPositive = netPnl >= 0;
                  const transactions = fund.transactions || [];

                  return (
                    <div
                      key={`mobile-${i}`}
                      className={`bg-white border transition-colors rounded-xl overflow-hidden shadow-sm flex flex-col ${isExpanded ? "border-distributor-300 ring-1 ring-distributor-100" : "border-slate-200"}`}
                    >
                      {/* Card Header */}
                      <div className="p-3 sm:p-4 border-b border-slate-100 flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 text-sm leading-snug">
                            {schemeName}
                          </p>
                          <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold font-mono tracking-wide mt-1.5">
                            Folio: {folio}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAnalyticsFund(fund);
                          }}
                          aria-label="View Fund Analytics"
                          className="p-1.5 text-slate-500 bg-white hover:text-distributor-600 hover:bg-distributor-50 rounded-lg transition-colors border border-slate-200 hover:border-distributor-200 shadow-sm shrink-0"
                        >
                          <BarChart2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Card Stats Grid */}
                      <div className="p-3 sm:p-4 grid grid-cols-2 gap-y-4 gap-x-3 bg-slate-50/50">
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                            Invested
                          </p>
                          <p className="text-sm font-bold text-slate-600">
                            {formatCurrency(invested)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                            Current
                          </p>
                          <p className="text-sm font-black text-slate-900">
                            {formatCurrency(current)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                            Units / NAV
                          </p>
                          <p className="text-xs font-bold text-slate-700">
                            {fund.available_units?.toFixed(3) || "0"}{" "}
                            <span className="text-[10px] font-medium text-slate-400 block sm:inline">
                              @ ₹{fund.current_nav || 0}
                            </span>
                          </p>
                        </div>
                        <div className="flex flex-col items-end">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                            Returns
                          </p>
                          <div
                            className={`flex items-center gap-0.5 text-xs font-black ${isPositive ? "text-emerald-600" : "text-rose-600"}`}
                          >
                            {isPositive ? (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowDownRight className="w-3.5 h-3.5" />
                            )}
                            {xirr}%
                          </div>
                          <span
                            className={`text-[10px] font-bold mt-0.5 tabular-nums ${isPositive ? "text-emerald-500" : "text-rose-500"}`}
                          >
                            {formatCurrency(netPnl)}
                          </span>
                        </div>
                      </div>

                      {/* Expand/Collapse Trigger */}
                      <button
                        onClick={() => setExpandedRow(isExpanded ? null : i)}
                        className="w-full p-2.5 bg-white border-t border-slate-100 text-xs font-bold text-slate-500 hover:text-distributor-600 flex justify-center items-center gap-1 transition-colors mt-auto"
                      >
                        {isExpanded ? "Hide Transactions" : "View Transactions"}
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </button>

                      {/* Transactions List */}
                      <div
                        className={`grid transition-all duration-300 ease-in-out ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                      >
                        <div className="overflow-hidden">
                          <div className="bg-slate-50 border-t border-slate-100 p-2 sm:p-3 flex flex-col gap-2 max-h-64 overflow-y-auto scrollbar-thin">
                            {transactions.length > 0 ? (
                              transactions.map((t: any, tid: number) => (
                                <div
                                  key={tid}
                                  className="flex justify-between items-center bg-white p-2.5 sm:p-3 rounded-lg border border-slate-100 shadow-sm"
                                >
                                  <div className="min-w-0 pr-2">
                                    <p className="text-xs font-bold text-slate-700 truncate">
                                      {t.transaction_type || "Unknown"}
                                    </p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">
                                      {t.transaction_date
                                        ? new Date(
                                            t.transaction_date,
                                          ).toLocaleDateString("en-GB", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                          })
                                        : "N/A"}
                                    </p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className="text-xs font-black text-slate-900 tabular-nums">
                                      {formatCurrency(t.amount || 0)}
                                    </p>
                                    <p className="text-[10px] text-distributor-600 font-bold tabular-nums">
                                      +{t.units?.toFixed(3) || "0"}{" "}
                                      <span className="text-slate-400 font-normal">
                                        @ ₹{t.nav || 0}
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-center text-slate-400 py-4 font-medium">
                                No transactions recorded.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── CAPITAL GAINS MODAL ─── */}
      {isCGModalOpen && (
        <div
          className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0" onClick={handleCloseModal} />

          <div className="bg-white rounded-md shadow-xl border border-slate-200 w-full max-w-sm overflow-visible animate-in zoom-in-95 duration-200 relative z-10 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
              <h3
                id="cg-modal-title"
                className="font-black text-slate-900 text-lg"
              >
                Capital Gains Report
              </h3>
              <button
                onClick={handleCloseModal}
                disabled={!!exportingFormat}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4 overflow-y-auto">
              {cgNotif && (
                <InlineNotif
                  notif={cgNotif}
                  onDismiss={() => setCGNotif(null)}
                />
              )}

              <div className="relative">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Select Financial Year
                </label>

                <button
                  onClick={() => setIsFYSelectorOpen(!isFYSelectorOpen)}
                  disabled={!!exportingFormat}
                  className="w-full flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                >
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Financial Year
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 tracking-tight">
                      {selectedFY}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 transition-transform ${isFYSelectorOpen ? "rotate-180" : ""}`}
                    />
                  </div>
                </button>

                {isFYSelectorOpen && (
                  <div className="absolute top-[110%] left-0 w-full bg-white border border-slate-200 shadow-xl rounded-xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                      <button
                        onClick={() => setFyPage((p) => Math.max(0, p - 1))}
                        disabled={fyPage === 0}
                        className="p-1 text-slate-400 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-400"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Page {fyPage + 1} of {maxPages}
                      </span>
                      <button
                        onClick={() =>
                          setFyPage((p) => Math.min(maxPages - 1, p + 1))
                        }
                        disabled={fyPage === maxPages - 1}
                        className="p-1 text-slate-400 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-400"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {paginatedYears.map((fy) => (
                        <button
                          key={fy}
                          onClick={() => {
                            setSelectedFY(fy);
                            setIsFYSelectorOpen(false);
                            setCGNotif(null);
                          }}
                          className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all ${selectedFY === fy ? "bg-distributor-50 border-distributor-500 text-distributor-700 shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`}
                        >
                          {fy}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4 shrink-0">
                <button
                  onClick={() => handleExportCG("pdf")}
                  disabled={!!exportingFormat || isFYSelectorOpen}
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
                  disabled={!!exportingFormat || isFYSelectorOpen}
                  className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 border-slate-100 hover:border-distributor-200 hover:bg-distributor-50 text-distributor-600 disabled:opacity-50 active:scale-95 transition-all"
                >
                  {exportingFormat === "excel" ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-6 h-6" />
                  )}
                  <span className="text-xs font-bold">
                    {exportingFormat === "excel"
                      ? "Generating…"
                      : "Export Excel"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── REPORT PREVIEW MODAL ─── */}
      {showReportPreview && portfolioData && (
        <div className="absolute inset-0 z-[100] bg-white/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 lg:p-6">
          <div
            className="absolute inset-0"
            onClick={() => setShowReportPreview(false)}
          />

          <div className="w-full max-w-6xl h-[95%] rounded-xl flex flex-col overflow-hidden shadow-2xl border border-slate-200 relative z-10 animate-in zoom-in-95 duration-200 bg-white">
            <HoldingsReport
              data={portfolioData}
              isExporting={isExportingPdf}
              onClose={() => setShowReportPreview(false)}
              onExportPdf={() => {
                setIsExportingPdf(true);
                setTimeout(() => {
                  if (portfolioData) {
                    generatePortfolioValuationPDF(
                      portfolioData,
                      DISTRIBUTOR_INFO,
                    );
                  }
                  setIsExportingPdf(false);
                }, 500);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
