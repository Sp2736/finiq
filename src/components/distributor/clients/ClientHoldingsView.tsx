"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { distributorService } from "@/services/distributor.service";
import GlobalStatsRibbon from "@/components/investor/GlobalStatsRibbon";
import FilterBar from "@/components/investor/FilterBar";
import { exportCapitalGains } from "@/lib/capitalGainsExport";
import { getDynamicFinancialYears } from "@/lib/utils";
import FundAnalyticsModal from "./FundAnalyticsModal";
import { generatePortfolioValuationPDF } from "@/lib/portfolioExport";
import { exportTransactionReport } from "@/lib/transactionReportExport";
import { buildDistributorInfoPayload } from "@/lib/companyInfo";
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
  Download,
} from "lucide-react";
import { formatCurrency, toTitleCase } from "@/lib/utils";
import { ClientPortfolio } from "@/types/investor";

// ─────────────────────────────────────────────────────────────────────────────
// DISTRIBUTOR CONFIG
// ─────────────────────────────────────────────────────────────────────────────


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
    error:
      "bg-[var(--fin-badge-danger-bg)] border-[var(--fin-badge-danger-border)] text-[var(--fin-badge-danger-text)]",
    info: "bg-[var(--fin-brand-50)] border-[var(--fin-brand-200)] text-[var(--fin-brand-700)]",
    warning:
      "bg-[var(--fin-badge-warning-bg)] border-[var(--fin-badge-warning-border)] text-[var(--fin-badge-warning-text)]",
  };
  const icons: Record<NotifType, React.ReactNode> = {
    error: <AlertTriangle className="w-4 h-4 shrink-0" />,
    info: <Info className="w-4 h-4 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 shrink-0" />,
  };
  return (
    <div
      className={`flex items-start gap-2 px-3 py-2.5 rounded-sm border text-xs font-medium mb-4 ${styles[notif.type]}`}
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

  const calendarYearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear; y >= 2010; y--) {
      years.push(y.toString());
    }
    return years;
  }, []);

  const [selectedFY, setSelectedFY] = useState(financialYearOptions[0]);
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Filter States
  const [activeFilterType, setActiveFilterType] = useState<string>("All");
  const [activeFilterValue, setActiveFilterValue] = useState<string>("All");

  // Capital Gains Period Configurations
  const [cgReportType, setCgReportType] = useState<"FY" | "CY" | "CUSTOM">(
    "FY",
  );
  const [selectedCY, setSelectedCY] = useState(calendarYearOptions[0]);
  const [isCYSelectorOpen, setIsCYSelectorOpen] = useState(false);
  const [cyPage, setCyPage] = useState(0);

  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const [isCGModalOpen, setIsCGModalOpen] = useState(false);
  const [isFYSelectorOpen, setIsFYSelectorOpen] = useState(false);
  const [fyPage, setFyPage] = useState(0);

  const [exportingFormat, setExportingFormat] = useState<
    "pdf" | "excel" | null
  >(null);
  const [cgNotif, setCGNotif] = useState<Notif | null>(null);

  // Modal States
  const [analyticsFund, setAnalyticsFund] = useState<any>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingTxn, setIsExportingTxn] = useState(false);

  // ── Pagination Math for Financial Years ──────────────────────────────────
  const ITEMS_PER_PAGE = 6;
  const paginatedYears = financialYearOptions.slice(
    fyPage * ITEMS_PER_PAGE,
    (fyPage + 1) * ITEMS_PER_PAGE,
  );
  const maxPages = Math.ceil(financialYearOptions.length / ITEMS_PER_PAGE);

  // ── Pagination Math for Calendar Years ───────────────────────────────────
  const CY_ITEMS_PER_PAGE = 6;
  const paginatedCYYears = calendarYearOptions.slice(
    cyPage * CY_ITEMS_PER_PAGE,
    (cyPage + 1) * CY_ITEMS_PER_PAGE,
  );
  const maxCYPages = Math.ceil(calendarYearOptions.length / CY_ITEMS_PER_PAGE);

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
      unrealisedGainST: d.unrealised_gains_st || 0,
      unrealisedGainLT: d.unrealised_gains_lt || 0,
      funds: d.funds || [],
    } as unknown as ClientPortfolio;
  }, [portfolioData, clientId]);

  const funds = portfolioData?.funds || [];

  // ── Filtering Logic ──────────────────────────────────────────────────────
  const filterOptions = useMemo(() => {
    const options = new Set<string>();
    if (funds.length > 0) {
      funds.forEach((fund: any) => {
        if (activeFilterType === "Category/Industry") {
          options.add(fund.asset_class || fund.category || "Equity");
        }
        if (activeFilterType === "AMC/Issuer") {
          options.add(fund.amc || "AMC");
        }
        if (activeFilterType === "Tag") {
          const tag =
            fund.sip_status === "Active" || fund.sip_status === "SIP"
              ? "SIP"
              : fund.sip_status || "N/A";
          options.add(tag);
        }
      });
    }
    return Array.from(options).filter(Boolean);
  }, [activeFilterType, funds]);

  const filteredFunds = useMemo(() => {
    if (!funds) return [];
    return funds.filter((fund: any) => {
      if (activeFilterType === "All" || activeFilterValue === "All")
        return true;

      if (activeFilterType === "Category/Industry") {
        const category = fund.asset_class || fund.category || "Equity";
        return category === activeFilterValue;
      }

      if (activeFilterType === "AMC/Issuer") {
        const amc = fund.amc || "AMC";
        return amc === activeFilterValue;
      }

      if (activeFilterType === "Tag") {
        const tag =
          fund.sip_status === "Active" || fund.sip_status === "SIP"
            ? "SIP"
            : fund.sip_status || "N/A";
        return tag === activeFilterValue;
      }
      return true;
    });
  }, [activeFilterType, activeFilterValue, funds]);

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

    let start_date = "";
    let end_date = "";
    let periodLabel = "";

    if (cgReportType === "FY") {
      const dates = getFYDates(selectedFY);
      start_date = dates.start_date;
      end_date = dates.end_date;
      periodLabel = selectedFY;
    } else if (cgReportType === "CY") {
      start_date = `${selectedCY}-01-01`;
      end_date = `${selectedCY}-12-31`;
      periodLabel = `CY ${selectedCY}`;
    } else if (cgReportType === "CUSTOM") {
      if (!customStartDate || !customEndDate) {
        setCGNotif({
          type: "error",
          message: "Please select both Start Date and End Date.",
        });
        return;
      }
      if (customStartDate > customEndDate) {
        setCGNotif({
          type: "error",
          message: "Start Date must be before or equal to End Date.",
        });
        return;
      }
      start_date = customStartDate;
      end_date = customEndDate;
      periodLabel = `${customStartDate} to ${customEndDate}`;
    }

    setExportingFormat(format);

    try {
      await exportCapitalGains(
        format,
        clientId,
        portfolioData?.investor_name,
        start_date,
        end_date,
        periodLabel,
        buildDistributorInfoPayload(),
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
    setIsCYSelectorOpen(false);
    setCGNotif(null);
  };

  const handleTransactionExport = async () => {
    setIsExportingTxn(true);
    setCGNotif(null);
    try {
      await exportTransactionReport(clientId, portfolioData?.investor_name, buildDistributorInfoPayload());
    } catch (err: any) {
      console.error("Error exporting transaction report:", err);
      setCGNotif({
        type: "error",
        message:
          err?.message || "An error occurred while exporting the report.",
      });
    } finally {
      setIsExportingTxn(false);
    }
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
            className="flex items-center gap-1 text-sm font-bold text-[var(--fin-aux-text)] hover:text-[var(--fin-body-text)] mb-3 w-fit transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Investors List
          </button>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-[var(--fin-heading-primary)] mb-1 leading-tight">
            {portfolioData?.investor_name ? (
              <>
                {toTitleCase(portfolioData.investor_name)}&apos;s{" "}
                <span className="text-[var(--fin-brand-600)]">Portfolio</span>
              </>
            ) : (
              <>
                Client{" "}
                <span className="text-[var(--fin-brand-600)]">Portfolio</span>
              </>
            )}
          </h1>
          <p className="text-[var(--fin-muted-text)] font-medium text-xs lg:text-sm truncate">
            View detailed mutual fund holdings and transaction history.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full md:w-auto mt-2 md:mt-0">
          <button
            onClick={handleTransactionExport}
            disabled={isExportingTxn}
            className="flex flex-1 md:flex-none items-center justify-center gap-2 px-5 py-2.5 bg-[var(--fin-table-bg)] border border-[var(--fin-border)] text-[var(--fin-table-row-text)] rounded-sm text-sm font-bold shadow-sm hover:border-[var(--fin-brand-300)] hover:bg-[var(--fin-brand-50)] hover:text-[var(--fin-brand-700)] transition-all active:scale-95 disabled:opacity-50"
          >
            {isExportingTxn ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isExportingTxn ? "Generating..." : "Transaction Report"}
          </button>
          <button
            onClick={() => {
              setIsExportingPdf(true);
              if (portfolioData) {
                generatePortfolioValuationPDF(
                  clientId,
                  portfolioData.investor_name,
                  buildDistributorInfoPayload(),
                ).finally(() => {
                  setIsExportingPdf(false);
                });
              } else {
                setIsExportingPdf(false);
              }
            }}
            disabled={!portfolioData || isExportingPdf}
            className="flex flex-1 md:flex-none items-center justify-center gap-2 px-5 py-2.5 bg-[var(--fin-table-bg)] border border-[var(--fin-border)] text-[var(--fin-table-row-text)] rounded-sm text-sm font-bold shadow-sm hover:border-[var(--fin-brand-300)] hover:bg-[var(--fin-brand-50)] hover:text-[var(--fin-brand-700)] transition-all active:scale-95 disabled:opacity-50"
          >
            {isExportingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}{" "}
            Holdings Report
          </button>

          <button
            onClick={() => setIsCGModalOpen(true)}
            aria-label="Open Capital Gains report export"
            className="flex flex-1 md:flex-none items-center justify-center gap-2 px-5 py-2.5 bg-[var(--fin-brand-600)] text-[var(--fin-btn-primary-text)] rounded-sm text-sm font-bold shadow-md hover:bg-[var(--fin-brand-800)] transition-all active:scale-95"
          >
            <Calculator className="w-4 h-4" /> Capital Gains
          </button>
        </div>
      </div>

      {/* ─── GLOBAL STATS RIBBON ─── */}
      {normalizedPortfolio && (
        <div className="shrink-0 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100 fill-both">
          <GlobalStatsRibbon client={normalizedPortfolio} useCompactValues />
        </div>
      )}

      {/* ─── FILTER BAR ─── */}
      {normalizedPortfolio && funds.length > 0 && (
        <div className="shrink-0 mb-4 lg:mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150 fill-both">
          <FilterBar
            role="distributor"
            activeFilterType={activeFilterType}
            setActiveFilterType={setActiveFilterType}
            activeFilterValue={activeFilterValue}
            setActiveFilterValue={setActiveFilterValue}
            filterOptions={filterOptions}
            avgHoldingDays={normalizedPortfolio.avgHoldingDays || 0}
          />
        </div>
      )}

      {/* ─── DATA CONTAINER ─── */}
      <div
        className="flex-1 min-h-0 bg-[var(--fin-table-bg)] rounded-sm border border-[var(--fin-border)] flex flex-col relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-both"
        style={{ boxShadow: "0 4px 15px var(--fin-kpi-shadow)" }}
      >
        {isLoading ? (
          <div className="absolute inset-0 bg-[var(--fin-table-bg)]/60 backdrop-blur-[1px] z-50 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--fin-brand-600)]" />
            <p className="text-sm font-bold text-[var(--fin-muted-text)]">
              Loading portfolio securely...
            </p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-12 h-12 bg-[var(--fin-badge-danger-bg)] rounded-sm flex items-center justify-center mb-3">
              <PieChart className="w-6 h-6 text-[var(--fin-badge-danger-text)]" />
            </div>
            <p className="text-[var(--fin-badge-danger-text)] font-bold mb-1">
              Error Loading Portfolio
            </p>
            <p className="text-sm text-[var(--fin-muted-text)] max-w-sm">
              {error}
            </p>
          </div>
        ) : filteredFunds.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-12 h-12 bg-[var(--fin-page-bg)] rounded-sm flex items-center justify-center mb-3">
              <PieChart className="w-6 h-6 text-[var(--fin-aux-text)]" />
            </div>
            <p className="text-base font-bold text-[var(--fin-body-text)]">
              No Holdings Found
            </p>
            <p className="text-xs font-medium text-[var(--fin-aux-text)] max-w-sm mt-1">
              {funds.length > 0
                ? "No funds match the selected filters."
                : "This investor does not currently have any active mutual fund holdings."}
            </p>
          </div>
        ) : (
          <>
            {/* ─── DESKTOP VIEW (Table) ─── */}
            <div className="hidden lg:flex flex-col flex-1 overflow-auto table-scrollbar">
              <table className="w-full text-left text-sm min-w-[900px] border-separate border-spacing-0">
                <thead className="bg-[var(--fin-page-bg)]/90 backdrop-blur-sm border-b border-[var(--fin-border-subtle)] text-[10px] uppercase tracking-widest text-[var(--fin-muted-text)] font-black sticky top-0 z-20 shadow-sm ring-1 ring-[var(--fin-input-ring-focus)]/50">
                  <tr>
                    <th className="p-3 w-10 border-b border-[var(--fin-border)]" />
                    <th className="py-4 border-b border-[var(--fin-border)]">
                      Scheme Name &amp; Folio
                    </th>
                    <th className="p-4 text-right border-b border-[var(--fin-border)]">
                      Units &amp; NAV
                    </th>
                    <th className="p-4 text-right border-b border-[var(--fin-border)]">
                      Invested Value
                    </th>
                    <th className="p-4 text-right border-b border-[var(--fin-border)]">
                      Current Value
                    </th>
                    <th className="p-4 text-right border-b border-[var(--fin-border)]">
                      Unrealised Gains
                    </th>
                    <th className="p-4 text-right pr-6 border-b border-[var(--fin-border)]">
                      Returns (XIRR)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--fin-table-row-border)]">
                  {filteredFunds.map((fund: any, i: number) => {
                    const isExpanded = expandedRow === i;
                    const schemeName = fund.fund_name || "N/A";
                    const folio = fund.folio_number || "N/A";
                    const category =
                      fund.asset_class || fund.category || "Equity";
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
                          className={`cursor-pointer transition-colors duration-200 group border-b border-[var(--fin-border-subtle)] ${
                            isExpanded
                              ? "bg-[var(--fin-brand-50)]/30"
                              : "hover:bg-[var(--fin-page-bg)]/80"
                          }`}
                        >
                          <td
                            className={`p-3 text-center border-b border-[var(--fin-border-subtle)] transition-colors ${isExpanded ? "bg-[var(--fin-brand-50)]" : "bg-[var(--fin-table-bg)] group-hover:bg-[var(--fin-page-bg)]"}`}
                          >
                            <button
                              aria-label={
                                isExpanded
                                  ? "Collapse transactions"
                                  : "Expand transactions"
                              }
                              className="text-[var(--fin-aux-text)] hover:text-[var(--fin-brand-600)] outline-none p-1 rounded-sm group-hover:bg-[var(--fin-brand-100)]/50 transition-colors"
                            >
                              <ChevronRight
                                className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? "rotate-90 text-[var(--fin-brand-600)]" : "rotate-0"}`}
                              />
                            </button>
                          </td>
                          <td className="py-4 border-b border-[var(--fin-border-subtle)] pr-4">
                            <div className="flex items-start justify-between gap-3 pr-2">
                              <div>
                                <p className="font-bold text-[var(--fin-heading-primary)] group-hover:text-[var(--fin-brand-700)] mb-0.5 text-xs max-w-[280px] leading-tight flex flex-wrap items-center gap-1.5">
                                  {schemeName}
                                </p>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                  <span className="inline-block px-2 py-0.5 bg-[var(--fin-skeleton-base)] text-[var(--fin-muted-text)] rounded text-[10px] font-bold font-mono tracking-wide">
                                    Folio: {folio}
                                  </span>
                                  <span className="inline-block px-2 py-0.5 bg-[var(--fin-brand-50)] text-[var(--fin-brand-700)] border border-[var(--fin-brand-100)] rounded text-[10px] font-bold tracking-wide uppercase">
                                    {category}
                                  </span>
                                  {fund.sip_status && (
                                    <span
                                      className={`text-[9px] font-bold uppercase rounded px-1.5 py-0.5 whitespace-nowrap ${
                                        fund.sip_status === "Active" ||
                                        fund.sip_status === "SIP"
                                          ? "text-[var(--fin-badge-success-text)] bg-[var(--fin-badge-success-bg)]"
                                          : "text-[var(--fin-badge-warning-text)] bg-[var(--fin-badge-warning-bg)]"
                                      }`}
                                    >
                                      {fund.sip_status === "Active"
                                        ? "SIP"
                                        : fund.sip_status}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Analytics Trigger Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAnalyticsFund(fund);
                                }}
                                title="View Fund Analytics"
                                className="p-1.5 text-[var(--fin-muted-text)] bg-[var(--fin-table-bg)] hover:text-[var(--fin-brand-600)] hover:bg-[var(--fin-brand-50)] rounded-sm transition-colors border border-[var(--fin-border)] hover:border-[var(--fin-brand-200)] shadow-sm cursor-pointer shrink-0"
                              >
                                <BarChart2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                          <td className="p-4 text-right border-b border-[var(--fin-border-subtle)]">
                            <p className="font-bold text-[var(--fin-table-row-text)] tabular-nums text-xs mb-0.5">
                              {fund.available_units?.toFixed(3) || "0"} U
                            </p>
                            <p className="text-[10px] font-bold text-[var(--fin-body-text)] tabular-nums leading-tight">
                              Cur: ₹{(fund.current_nav ?? 0).toFixed(4)}
                            </p>
                            <p className="text-[9px] font-medium text-[var(--fin-aux-text)] tabular-nums leading-tight">
                              Avg: ₹{(fund.avg_nav ?? 0).toFixed(4)}
                            </p>
                          </td>
                          <td className="p-4 text-right border-b border-[var(--fin-border-subtle)]">
                            <p className="font-medium text-[var(--fin-body-text)] tabular-nums text-sm">
                              {formatCurrency(invested)}
                            </p>
                          </td>
                          <td className="p-4 text-right border-b border-[var(--fin-border-subtle)]">
                            <p className="font-black text-[var(--fin-heading-primary)] tabular-nums text-sm">
                              {formatCurrency(current)}
                            </p>
                          </td>
                          <td className="p-4 text-right border-b border-[var(--fin-border-subtle)]">
                            <div className="flex flex-col items-end">
                              <span
                                className={`text-[10px] font-bold tabular-nums ${isPositive ? "text-[var(--fin-badge-success-text)]" : "text-[var(--fin-badge-danger-text)]"}`}
                              >
                                {formatCurrency(netPnl)}
                              </span>
                              <div className="flex flex-col items-end text-[9px] font-bold text-[var(--fin-aux-text)]/80 mt-1 leading-tight select-none">
                                <span>
                                  LT:{" "}
                                  {formatCurrency(
                                    fund.unrealised_gains_lt || 0,
                                  )}
                                </span>
                                <span>
                                  ST:{" "}
                                  {formatCurrency(
                                    fund.unrealised_gains_st || 0,
                                  )}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-right border-b border-[var(--fin-border-subtle)] pr-6">
                            <div className="flex flex-col items-end">
                              <div
                                className={`flex items-center gap-0.5 text-xs font-black ${isPositive ? "text-[var(--fin-badge-success-text)]" : "text-[var(--fin-badge-danger-text)]"}`}
                              >
                                {isPositive ? (
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                ) : (
                                  <ArrowDownRight className="w-3.5 h-3.5" />
                                )}
                                {xirr}%
                              </div>
                            </div>
                          </td>
                        </tr>

                        <tr className="bg-[var(--fin-page-bg)]/40">
                          <td
                            colSpan={7}
                            className="p-0 border-b border-[var(--fin-border)]/60"
                          >
                            <div
                              className={`grid transition-all duration-300 ease-in-out ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                            >
                              <div className="overflow-hidden">
                                <div className="p-4 pl-14 pr-6">
                                  <div
                                    className="bg-[var(--fin-table-bg)] rounded-sm border border-[var(--fin-border)] overflow-hidden"
                                    style={{
                                      boxShadow:
                                        "0 4px 15px var(--fin-kpi-shadow)",
                                    }}
                                  >
                                    <div className="px-4 py-3 border-b border-[var(--fin-border-subtle)] bg-[var(--fin-page-bg)] flex items-center justify-between">
                                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--fin-muted-text)]">
                                        Transaction History
                                      </h4>
                                      <p className="text-[10px] font-bold text-[var(--fin-aux-text)]">
                                        {transactions.length} entries
                                      </p>
                                    </div>
                                    {transactions.length > 0 ? (
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                          <thead className="bg-[var(--fin-table-bg)] border-b border-[var(--fin-border-subtle)] text-[9px] uppercase tracking-widest text-[var(--fin-aux-text)] font-bold">
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
                                          <tbody className="divide-y divide-[var(--fin-table-row-border)]">
                                            {transactions.map(
                                              (t: any, tid: number) => (
                                                <tr
                                                  key={tid}
                                                  className="hover:bg-[var(--fin-page-bg)]/50 transition-colors"
                                                >
                                                  <td className="p-3 pl-4 text-[var(--fin-body-text)] font-medium whitespace-nowrap">
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
                                                  <td className="p-3 text-[var(--fin-table-row-text)] font-bold truncate max-w-[200px]">
                                                    {t.transaction_type ||
                                                      "Unknown"}
                                                  </td>
                                                  <td className="p-3 text-right font-black text-[var(--fin-heading-primary)] tabular-nums">
                                                    {formatCurrency(
                                                      t.amount || 0,
                                                    )}
                                                  </td>
                                                  <td className="p-3 text-right text-[var(--fin-muted-text)] font-medium tabular-nums">
                                                    ₹{t.nav || 0}
                                                  </td>
                                                  <td className="p-3 text-right text-[var(--fin-brand-600)] font-bold tabular-nums pr-4">
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
                                      <div className="p-6 text-center text-[var(--fin-aux-text)] text-xs font-medium">
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
            <div className="lg:hidden flex flex-col flex-1 overflow-auto bg-[var(--fin-page-bg)]/30 p-3 sm:p-4 scrollbar-thin">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 auto-rows-max">
                {filteredFunds.map((fund: any, i: number) => {
                  const isExpanded = expandedRow === i;
                  const schemeName = fund.fund_name || "N/A";
                  const folio = fund.folio_number || "N/A";
                  const category =
                    fund.asset_class || fund.category || "Mutual Fund";
                  const invested = fund.total_capital || 0;
                  const current = fund.current_value || 0;
                  const netPnl = fund.net_pnl || 0;
                  const xirr = fund.xirr_percent || 0;
                  const isPositive = netPnl >= 0;
                  const transactions = fund.transactions || [];

                  return (
                    <div
                      key={`mobile-${i}`}
                      className={`bg-[var(--fin-table-bg)] border transition-colors rounded-sm overflow-hidden flex flex-col ${isExpanded ? "border-[var(--fin-brand-300)] ring-1 ring-[var(--fin-brand-100)]" : "border-[var(--fin-border)]"}`}
                      style={{ boxShadow: "0 4px 15px var(--fin-kpi-shadow)" }}
                    >
                      {/* Card Header */}
                      <div className="p-3 sm:p-4 border-b border-[var(--fin-border-subtle)] flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[var(--fin-heading-primary)] text-sm leading-snug flex flex-wrap items-center gap-1.5">
                            {schemeName}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span className="inline-block px-2 py-0.5 bg-[var(--fin-skeleton-base)] text-[var(--fin-muted-text)] rounded text-[10px] font-bold font-mono tracking-wide">
                              Folio: {folio}
                            </span>
                            <span className="inline-block px-2 py-0.5 bg-[var(--fin-brand-50)] text-[var(--fin-brand-700)] border border-[var(--fin-brand-100)] rounded text-[10px] font-bold tracking-wide uppercase">
                              {category}
                            </span>
                            {fund.sip_status && (
                              <span
                                className={`text-[9px] font-bold uppercase rounded px-1.5 py-0.5 whitespace-nowrap ${
                                  fund.sip_status === "Active" ||
                                  fund.sip_status === "SIP"
                                    ? "text-[var(--fin-badge-success-text)] bg-[var(--fin-badge-success-bg)]"
                                    : "text-[var(--fin-badge-warning-text)] bg-[var(--fin-badge-warning-bg)]"
                                }`}
                              >
                                {fund.sip_status === "Active"
                                  ? "SIP"
                                  : fund.sip_status}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAnalyticsFund(fund);
                          }}
                          aria-label="View Fund Analytics"
                          className="p-1.5 text-[var(--fin-muted-text)] bg-[var(--fin-table-bg)] hover:text-[var(--fin-brand-600)] hover:bg-[var(--fin-brand-50)] rounded-sm transition-colors border border-[var(--fin-border)] hover:border-[var(--fin-brand-200)] shadow-sm shrink-0"
                        >
                          <BarChart2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Card Stats Grid */}
                      <div className="p-3 sm:p-4 grid grid-cols-2 gap-y-4 gap-x-3 bg-[var(--fin-page-bg)]/50">
                        <div>
                          <p className="text-[10px] font-black uppercase text-[var(--fin-aux-text)] tracking-wider">
                            Invested
                          </p>
                          <p className="text-sm font-bold text-[var(--fin-body-text)]">
                            {formatCurrency(invested)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase text-[var(--fin-aux-text)] tracking-wider">
                            Current
                          </p>
                          <p className="text-sm font-black text-[var(--fin-heading-primary)]">
                            {formatCurrency(current)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-[var(--fin-aux-text)] tracking-wider">
                            Units / NAV (Cur/Avg)
                          </p>
                          <p className="text-xs font-bold text-[var(--fin-table-row-text)]">
                            {fund.available_units?.toFixed(3) || "0"} U
                          </p>
                          <p className="text-[10px] font-bold text-[var(--fin-body-text)] mt-0.5">
                            Cur: ₹{(fund.current_nav ?? 0).toFixed(4)}
                          </p>
                          <p className="text-[9px] font-medium text-[var(--fin-aux-text)]">
                            Avg: ₹{(fund.avg_nav ?? 0).toFixed(4)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end">
                          <p className="text-[10px] font-black uppercase text-[var(--fin-aux-text)] tracking-wider">
                            Returns / Unrealised
                          </p>
                          <div
                            className={`flex items-center gap-0.5 text-xs font-black ${isPositive ? "text-[var(--fin-badge-success-text)]" : "text-[var(--fin-badge-danger-text)]"}`}
                          >
                            {isPositive ? (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowDownRight className="w-3.5 h-3.5" />
                            )}
                            {xirr}%
                          </div>
                          <span
                            className={`text-[10px] font-bold mt-0.5 tabular-nums ${isPositive ? "text-[var(--fin-badge-success-text)]" : "text-[var(--fin-badge-danger-text)]"}`}
                          >
                            {formatCurrency(netPnl)}
                          </span>
                          <div className="flex flex-col items-end text-[9px] font-bold text-[var(--fin-aux-text)]/80 mt-1 leading-tight select-none">
                            <span>
                              LT:{" "}
                              {formatCurrency(fund.unrealised_gains_lt || 0)}
                            </span>
                            <span>
                              ST:{" "}
                              {formatCurrency(fund.unrealised_gains_st || 0)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Expand/Collapse Trigger */}
                      <button
                        onClick={() => setExpandedRow(isExpanded ? null : i)}
                        className="w-full p-2.5 bg-[var(--fin-table-bg)] border-t border-[var(--fin-border-subtle)] text-xs font-bold text-[var(--fin-muted-text)] hover:text-[var(--fin-brand-600)] flex justify-center items-center gap-1 transition-colors mt-auto"
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
                          <div className="bg-[var(--fin-page-bg)] border-t border-[var(--fin-border-subtle)] p-2 sm:p-3 flex flex-col gap-2 max-h-64 overflow-y-auto scrollbar-thin">
                            {transactions.length > 0 ? (
                              transactions.map((t: any, tid: number) => (
                                <div
                                  key={tid}
                                  className="flex justify-between items-center bg-[var(--fin-table-bg)] p-2.5 sm:p-3 rounded-sm border border-[var(--fin-border-subtle)] shadow-sm"
                                >
                                  <div className="min-w-0 pr-2">
                                    <p className="text-xs font-bold text-[var(--fin-table-row-text)] truncate">
                                      {t.transaction_type || "Unknown"}
                                    </p>
                                    <p className="text-[10px] text-[var(--fin-muted-text)] mt-0.5">
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
                                    <p className="text-xs font-black text-[var(--fin-heading-primary)] tabular-nums">
                                      {formatCurrency(t.amount || 0)}
                                    </p>
                                    <p className="text-[10px] text-[var(--fin-brand-600)] font-bold tabular-nums">
                                      +{t.units?.toFixed(3) || "0"}{" "}
                                      <span className="text-[var(--fin-aux-text)] font-normal">
                                        @ ₹{t.nav || 0}
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-center text-[var(--fin-aux-text)] py-4 font-medium">
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
          className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-[var(--fin-table-bg)]/80 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0" onClick={handleCloseModal} />

          <div className="bg-[var(--fin-table-bg)] rounded-sm shadow-xl border border-[var(--fin-border)] w-full max-w-sm overflow-visible animate-in zoom-in-95 duration-200 relative z-10 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[var(--fin-border-subtle)] shrink-0">
              <h3
                id="cg-modal-title"
                className="font-black text-[var(--fin-heading-primary)] text-lg"
              >
                Capital Gains Report
              </h3>
              <button
                onClick={handleCloseModal}
                disabled={!!exportingFormat}
                className="p-1.5 text-[var(--fin-aux-text)] hover:text-[var(--fin-table-row-text)] hover:bg-[var(--fin-skeleton-base)] rounded-sm disabled:opacity-40 disabled:cursor-not-allowed"
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

              {/* Report Type Segmented Selector */}
              <div className="flex bg-[var(--fin-skeleton-base)]/80 p-1 rounded-sm mb-4 border border-[var(--fin-border)]/40 select-none">
                {[
                  { id: "FY", label: "FY" },
                  { id: "CY", label: "CY" },
                  { id: "CUSTOM", label: "Custom" },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      setCgReportType(type.id as any);
                      setCGNotif(null);
                    }}
                    disabled={!!exportingFormat}
                    className={`flex-1 py-1.5 text-xs font-black rounded-sm transition-all active:scale-95 disabled:opacity-50 ${
                      cgReportType === type.id
                        ? "bg-[var(--fin-table-bg)] text-[var(--fin-brand-700)] shadow-sm border border-[var(--fin-border)]/20"
                        : "text-[var(--fin-muted-text)] hover:text-[var(--fin-heading-tertiary)]"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              {cgReportType === "FY" && (
                <div className="relative animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <button
                    onClick={() => setIsFYSelectorOpen(!isFYSelectorOpen)}
                    disabled={!!exportingFormat}
                    className="w-full flex items-center justify-between p-3 bg-[var(--fin-page-bg)] border border-[var(--fin-border)] rounded-sm hover:border-[var(--fin-border)] transition-all focus:outline-none focus:ring-2 focus:ring-[var(--fin-table-shadow)] active:scale-[0.99]"
                  >
                    <span className="text-xs font-bold text-[var(--fin-muted-text)] uppercase tracking-widest">
                      Financial Year
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--fin-heading-tertiary)] tracking-tight">
                        {selectedFY}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-[var(--fin-muted-text)] transition-transform duration-200 ${isFYSelectorOpen ? "rotate-180" : ""}`}
                      />
                    </div>
                  </button>

                  {isFYSelectorOpen && (
                    <div className="absolute top-[110%] left-0 w-full bg-[var(--fin-table-bg)] border border-[var(--fin-border)] shadow-xl rounded-sm p-3 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between mb-3 border-b border-[var(--fin-border-subtle)] pb-2">
                        <button
                          onClick={() => setFyPage((p) => Math.max(0, p - 1))}
                          disabled={fyPage === 0}
                          className="p-1 text-[var(--fin-aux-text)] hover:text-[var(--fin-heading-primary)] disabled:opacity-30 disabled:hover:text-[var(--fin-aux-text)]"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] font-bold text-[var(--fin-muted-text)] uppercase tracking-widest">
                          Page {fyPage + 1} of {maxPages}
                        </span>
                        <button
                          onClick={() =>
                            setFyPage((p) => Math.min(maxPages - 1, p + 1))
                          }
                          disabled={fyPage === maxPages - 1}
                          className="p-1 text-[var(--fin-aux-text)] hover:text-[var(--fin-heading-primary)] disabled:opacity-30 disabled:hover:text-[var(--fin-aux-text)]"
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
                            className={`py-2 px-1 text-xs font-bold rounded-sm border transition-all ${selectedFY === fy ? "bg-[var(--fin-brand-50)] border-[var(--fin-brand-500)] text-[var(--fin-brand-700)] shadow-sm" : "bg-[var(--fin-table-bg)] border-[var(--fin-border)] text-[var(--fin-body-text)] hover:border-[var(--fin-border)] hover:bg-[var(--fin-page-bg)]"}`}
                          >
                            {fy}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {cgReportType === "CY" && (
                <div className="relative animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <button
                    onClick={() => setIsCYSelectorOpen(!isCYSelectorOpen)}
                    disabled={!!exportingFormat}
                    className="w-full flex items-center justify-between p-3 bg-[var(--fin-page-bg)] border border-[var(--fin-border)] rounded-sm hover:border-[var(--fin-border)] transition-all focus:outline-none focus:ring-2 focus:ring-[var(--fin-table-shadow)] active:scale-[0.99]"
                  >
                    <span className="text-xs font-bold text-[var(--fin-muted-text)] uppercase tracking-widest">
                      Calendar Year
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--fin-heading-tertiary)] tracking-tight">
                        {selectedCY}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-[var(--fin-muted-text)] transition-transform duration-200 ${isCYSelectorOpen ? "rotate-180" : ""}`}
                      />
                    </div>
                  </button>

                  {isCYSelectorOpen && (
                    <div className="absolute top-[110%] left-0 w-full bg-[var(--fin-table-bg)] border border-[var(--fin-border)] shadow-xl rounded-sm p-3 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between mb-3 border-b border-[var(--fin-border-subtle)] pb-2">
                        <button
                          onClick={() => setCyPage((p) => Math.max(0, p - 1))}
                          disabled={cyPage === 0}
                          className="p-1 text-[var(--fin-aux-text)] hover:text-[var(--fin-heading-primary)] disabled:opacity-30 disabled:hover:text-[var(--fin-aux-text)]"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] font-bold text-[var(--fin-muted-text)] uppercase tracking-widest">
                          Page {cyPage + 1} of {maxCYPages}
                        </span>
                        <button
                          onClick={() =>
                            setCyPage((p) => Math.min(maxCYPages - 1, p + 1))
                          }
                          disabled={cyPage === maxCYPages - 1}
                          className="p-1 text-[var(--fin-aux-text)] hover:text-[var(--fin-heading-primary)] disabled:opacity-30 disabled:hover:text-[var(--fin-aux-text)]"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {paginatedCYYears.map((cy) => (
                          <button
                            key={cy}
                            onClick={() => {
                              setSelectedCY(cy);
                              setIsCYSelectorOpen(false);
                              setCGNotif(null);
                            }}
                            className={`py-2 px-1 text-xs font-bold rounded-sm border transition-all ${selectedCY === cy ? "bg-[var(--fin-brand-50)] border-[var(--fin-brand-500)] text-[var(--fin-brand-700)] shadow-sm" : "bg-[var(--fin-table-bg)] border-[var(--fin-border)] text-[var(--fin-body-text)] hover:border-[var(--fin-border)] hover:bg-[var(--fin-page-bg)]"}`}
                          >
                            {cy}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {cgReportType === "CUSTOM" && (
                <div className="flex flex-col gap-3.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="flex flex-col">
                    <label className="block text-[10px] font-black text-[var(--fin-aux-text)] uppercase tracking-widest mb-1.5">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => {
                        setCustomStartDate(e.target.value);
                        setCGNotif(null);
                      }}
                      disabled={!!exportingFormat}
                      className="w-full px-3 py-2 bg-[var(--fin-page-bg)] border border-[var(--fin-border)] rounded-sm text-xs font-black text-[var(--fin-heading-tertiary)] tracking-tight focus:border-[var(--fin-brand-600)] focus:bg-[var(--fin-table-bg)] focus:ring-4 focus:ring-[var(--fin-brand-500)]/10 focus:outline-none transition-all cursor-pointer hover:bg-[var(--fin-skeleton-base)]/50"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="block text-[10px] font-black text-[var(--fin-aux-text)] uppercase tracking-widest mb-1.5">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => {
                        setCustomEndDate(e.target.value);
                        setCGNotif(null);
                      }}
                      disabled={!!exportingFormat}
                      className="w-full px-3 py-2 bg-[var(--fin-page-bg)] border border-[var(--fin-border)] rounded-sm text-xs font-black text-[var(--fin-heading-tertiary)] tracking-tight focus:border-[var(--fin-brand-600)] focus:bg-[var(--fin-table-bg)] focus:ring-4 focus:ring-[var(--fin-brand-500)]/10 focus:outline-none transition-all cursor-pointer hover:bg-[var(--fin-skeleton-base)]/50"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mt-4 shrink-0">
                <button
                  onClick={() => handleExportCG("pdf")}
                  disabled={
                    !!exportingFormat || isFYSelectorOpen || isCYSelectorOpen
                  }
                  className="flex flex-col items-center justify-center gap-2 p-3 rounded-sm border-2 border-[var(--fin-border-subtle)] hover:border-[var(--fin-badge-danger-border)] hover:bg-[var(--fin-badge-danger-bg)] text-[var(--fin-badge-danger-text)] disabled:opacity-50 active:scale-95 transition-all"
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
                  disabled={
                    !!exportingFormat || isFYSelectorOpen || isCYSelectorOpen
                  }
                  className="flex flex-col items-center justify-center gap-2 p-3 rounded-sm border-2 border-[var(--fin-border-subtle)] hover:border-[var(--fin-brand-200)] hover:bg-[var(--fin-brand-50)] text-[var(--fin-brand-600)] disabled:opacity-50 active:scale-95 transition-all"
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
    </div>
  );
}
