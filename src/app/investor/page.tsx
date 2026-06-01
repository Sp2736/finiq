"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { UnifiedFund, ClientPortfolio, Transaction } from "@/types/investor";
import LogoutButton from "@/components/investor/LogoutButton";
import { usePortfolio } from "@/hooks/usePortfolio";
import { distributorService } from "@/services/distributor.service";
import { investorService } from "@/services/investor.service";

// Layout & UI
import InvestorSidebar from "@/components/investor/InvestorSidebar";
import GlobalStatsRibbon from "@/components/investor/GlobalStatsRibbon";
import FilterBar from "@/components/investor/FilterBar";
import DesktopFundTable from "@/components/investor/DesktopFundTable";
import MobileHoldings from "@/components/investor/MobileHoldings";
import MobileFundDetails from "@/components/investor/MobileFundDetails";
import FundAnalyticsModal from "@/components/distributor/clients/FundAnalyticsModal";

// Export & Icons
import {
  Download,
  BarChart2,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  FileSpreadsheet,
  Loader2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { generatePortfolioValuationPDF } from "@/lib/portfolioExport";
import { exportCapitalGains } from "@/lib/capitalGainsExport";
import { getDynamicFinancialYears, formatCurrency } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// INLINE NOTIFICATION COMPONENT
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
    info: "bg-distributor-50 border-investor-200 text-investor-700",
    warning: "bg-amber-50 border-amber-200 text-amber-700",
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
export default function UnifiedPortfolioApp() {
  const { portfolio, isLoading, error } = usePortfolio();

  const normalizedPortfolio = useMemo((): ClientPortfolio | null => {
    if (!portfolio) return null;
    const d = portfolio.data || portfolio;

    return {
      id: d.id || "investor-id",
      clientName: d.investor_name || d.clientName || "Investor",
      totalCapital: d.total_capital || d.invested_capital || d.totalCapital || 0,
      investedCapital: d.invested_capital || d.investedCapital || 0,
      currentValue: d.current_value || d.currentValue || 0,
      dividendPayout: d.dividend_payout || d.dividendPayout || 0,
      unrealisedGain:
        (d.unrealised_gains_lt || 0) + (d.unrealised_gains_st || 0) ||
        d.unrealisedGain ||
        0,
      unrealisedGainPercent: d.unrealised_gain_percent || d.abs_percent || 0,
      realisedGain: d.realised_gain || d.realisedGain || 0,
      netPL: d.net_pl || d.netPL || 0,
      todaysGain: d.todays_pnl || d.todaysGain || 0,
      todaysGainPercent: d.todays_pnl_percent ?? d.todaysGainPercent ?? 0,
      xirr: d.xirr_percent ?? d.xirr ?? 0,
      abs: d.abs_percent ?? d.abs ?? 0,
      avgHoldingDays: d.avg_days ?? d.avgHoldingDays ?? 0,
      funds: (d.funds || []).map(
        (f: any): UnifiedFund & { amfiCode?: string } => ({
          amfiCode: f.amfi_code || f.amfiCode || "N/A",
          folioNo: f.folio_number || f.folioNo || "N/A",
          fundName: f.fund_name || f.fundName || "Unknown Fund",
          category: f.category || "Equity",
          amc: f.amc || "AMC",
          statusTag:
            (f.sip_status === "Active" ? "SIP" : f.sip_status) ||
            f.statusTag ||
            "N/A",
          purchaseDate: f.purchase_date
            ? new Date(f.purchase_date).toLocaleDateString("en-GB")
            : f.purchaseDate,
          totalCapital: f.total_capital || f.invested_capital || 0,
          investedCapital: f.invested_capital || f.total_capital || 0,
          currentValue: f.current_value || f.currentValue || 0,
          availableUnits: f.available_units || f.availableUnits || 0,
          currentNAV: f.current_nav || f.currentNAV || 0,
          avgNAV: f.avg_nav || f.avgNAV || 0,
          dividendPayout: f.dividend_payout || f.dividendPayout || 0,
          unrealisedGain:
            (f.unrealised_gains_lt || 0) + (f.unrealised_gains_st || 0) ||
            f.unrealisedGain ||
            0,
          unrealisedGainPercent: f.abs_percent ?? f.unrealisedGainPercent ?? 0,
          realisedGain: f.realised_gain || 0,
          securityType: f.security_type || "Mutual Fund",
          sipStatus:
            (f.sip_status === "Active" ? "SIP" : f.sip_status) ||
            f.sipStatus ||
            "N/A",
          xirr: f.xirr_percent ?? f.xirr ?? 0,
          oneDayChange: f.todays_pnl || f.oneDayChange || 0,
          oneDayPercent: f.todays_pnl_percent || 0,
          valuationDate: f.valuation_date || new Date().toISOString(),
          avgHoldingDays: f.avg_days || 0,

          investorDetails: {
            name: d.investor_name || d.clientName || "Investor",
            pan: f.pan || "Not Available",
            dob: f.dob || "N/A",
            taxStatus: f.tax_status || "Resident Individual",
            holdingType: f.holding_nature || "Single",
          },

          contactDetails: {
            email: f.email || d.email || "N/A",
            mobile: f.mobile || d.mobile || "N/A",
            address: f.address || "N/A",
          },

          bankDetails: {
            bankName: f.bank_name || d.bank_name || "Bank Details Unavailable",
            accountNumber: f.account_number || d.account_number || "N/A",
            accountType: f.account_type || "Savings",
            branch: f.branch || d.branch || "N/A",
          },

          nomineeDetails: {
            name: f.nominee_name || "N/A",
            relation: f.nominee_relation || "N/A",
          },

          jointHolderDetails: f.joint_holder
            ? {
                name: f.joint_holder_name || "N/A",
                pan: f.joint_holder_pan || "N/A",
              }
            : null,

          transactions: (f.transactions || [])
            .sort((a: any, b: any) => {
              const dateA = new Date(a.transaction_date || 0).getTime();
              const dateB = new Date(b.transaction_date || 0).getTime();
              return dateB - dateA;
            })
            .map(
              (t: any, i: number): Transaction => ({
                id: i.toString(),
                transactionDate: t.transaction_date
                  ? new Date(t.transaction_date).toLocaleDateString("en-GB")
                  : t.transactionDate,
                transactionType:
                  t.transaction_type || t.transactionType || "Unknown",
                amount: t.amount || 0,
                sttCharges: t.stt_and_others || t.sttCharges || 0,
                nav: t.nav || 0,
                units: t.units || 0,
                balanceUnits: t.balanceUnits || 0,
                holdingDays: t.holdingDays || 0,
                capitalGain: t.unrealised_gains || t.capitalGain || 0,
              }),
            ),
        }),
      ),
    };
  }, [portfolio]);

  const [activeFilterType, setActiveFilterType] = useState<string>("All");
  const [activeFilterValue, setActiveFilterValue] = useState<string>("All");

  const [mobileActiveScreen, setMobileActiveScreen] = useState<"holdings" | "fund_details">("holdings");
  const [mobileSelectedFund, setMobileSelectedFund] = useState<UnifiedFund | null>(null);
  const [analyticsFund, setAnalyticsFund] = useState<UnifiedFund | null>(null);

  // ─── CAPITAL GAINS / PDF EXPORT STATES ──────────────────────────────────
  const financialYearOptions = useMemo(() => getDynamicFinancialYears(2010), []);
  const calendarYearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear; y >= 2010; y--) {
      years.push(y.toString());
    }
    return years;
  }, []);

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isCGModalOpen, setIsCGModalOpen] = useState(false);
  const [cgReportType, setCgReportType] = useState<"FY" | "CY" | "CUSTOM">("FY");
  const [selectedFY, setSelectedFY] = useState(financialYearOptions[0]);
  const [selectedCY, setSelectedCY] = useState(calendarYearOptions[0]);
  const [isFYSelectorOpen, setIsFYSelectorOpen] = useState(false);
  const [isCYSelectorOpen, setIsCYSelectorOpen] = useState(false);
  
  const [fyPage, setFyPage] = useState(0);
  const ITEMS_PER_PAGE = 6;
  const paginatedYears = financialYearOptions.slice(
    fyPage * ITEMS_PER_PAGE,
    (fyPage + 1) * ITEMS_PER_PAGE
  );
  const maxPages = Math.ceil(financialYearOptions.length / ITEMS_PER_PAGE);

  const [cyPage, setCyPage] = useState(0);
  const CY_ITEMS_PER_PAGE = 6;
  const paginatedCYYears = calendarYearOptions.slice(
    cyPage * CY_ITEMS_PER_PAGE,
    (cyPage + 1) * CY_ITEMS_PER_PAGE
  );
  const maxCYPages = Math.ceil(calendarYearOptions.length / CY_ITEMS_PER_PAGE);

  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [exportingFormat, setExportingFormat] = useState<"pdf" | "excel" | null>(null);
  const [cgNotif, setCGNotif] = useState<Notif | null>(null);

  // ─── PDF EXPORT LOGIC ───────────────────────────────────────────────────
  const handleExportHoldings = () => {
    setIsExportingPdf(true);
    setTimeout(() => {
      if (portfolio && normalizedPortfolio) {
        const INVESTOR_INFO = {
          name: normalizedPortfolio.clientName || "Investor",
          address: "",
          email: "",
          phone: "",
          logoBase64: "",
        };
        generatePortfolioValuationPDF(portfolio.data || portfolio, INVESTOR_INFO);
      }
      setIsExportingPdf(false);
    }, 500);
  };

  // ─── CAPITAL GAINS LOGIC ────────────────────────────────────────────────
  const handleCloseModal = () => {
    if (exportingFormat) return;
    setIsCGModalOpen(false);
    setIsFYSelectorOpen(false);
    setIsCYSelectorOpen(false);
    setCGNotif(null);
  };

  const getFYDates = (fy: string) => {
    const startYear = parseInt(fy.split("-")[0]);
    return {
      start_date: `${startYear}-04-01`,
      end_date: `${startYear + 1}-03-31`,
    };
  };

  const mapBackendToExportFormat = useCallback(
    (backendData: any[], currentPortfolio: any) => {
      const firstRow = backendData[0] || {};
      const invName =
        firstRow.investor_name || currentPortfolio?.clientName || "Investor";

      const mapped = {
        investorDetails: {
          name: invName,
          pan: firstRow.pan || currentPortfolio?.pan || "N/A",
          address: firstRow.address || currentPortfolio?.address || "Address Not Provided",
          mobile: firstRow.mobile || currentPortfolio?.mobile || "N/A",
          email: firstRow.email || currentPortfolio?.email || "N/A",
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
    []
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
      const res = await investorService.getCapitalGains({
        start_date,
        end_date,
      });

      const cgDataArray: any[] = res.data?.[0]?.get_capital_gains_vr || [];

      if (cgDataArray.length === 0) {
        const typeLabel =
          cgReportType === "FY"
            ? `FY ${selectedFY}`
            : cgReportType === "CY"
            ? `CY ${selectedCY}`
            : `Custom period`;
        setCGNotif({
          type: "info",
          message: `No capital Gains records found for ${typeLabel}. Please try a different range.`,
        });
        return;
      }

      const mappedData = mapBackendToExportFormat(cgDataArray, normalizedPortfolio);
      
      const INVESTOR_INFO = {
        name: normalizedPortfolio?.clientName || "Investor",
        address: "",
        email: "",
        phone: "",
        logoBase64: "",
      };

      await exportCapitalGains(format, mappedData, periodLabel, INVESTOR_INFO);
      setIsCGModalOpen(false);
    } catch (err: any) {
      console.error("Capital Gains fetch failed:", err);
      setCGNotif({
        type: "error",
        message:
          err?.message || "Failed to fetch Capital Gains data. Please try again.",
      });
    } finally {
      setExportingFormat(null);
    }
  };

  // ─── SMART BACKGROUND QUEUE STATE ───
  const prefetchQueue = useRef<string[]>([]);
  const isQueueInitialized = useRef(false);

  useEffect(() => {
    if (normalizedPortfolio?.funds && !isQueueInitialized.current) {
      const uniqueAmfiCodes = Array.from(
        new Set(
          normalizedPortfolio.funds
            .map((f) => f.amfiCode)
            .filter((code): code is string => Boolean(code) && code !== "N/A"),
        ),
      );
      prefetchQueue.current = uniqueAmfiCodes;
      isQueueInitialized.current = true;
    }
  }, [normalizedPortfolio]);

  useEffect(() => {
    let isActive = true;

    const processQueue = async () => {
      if (analyticsFund) return;

      while (prefetchQueue.current.length > 0 && isActive) {
        const code = prefetchQueue.current.shift();
        if (code) {
          distributorService.getFundReturns(code).catch(() => {});
          distributorService.getFundRiskStats(code).catch(() => {});
          distributorService.getFundSectorAllocation(code).catch(() => {});
          distributorService.getFundStyleBox(code).catch(() => {});
          distributorService.getFundHoldings(code).catch(() => {});
          distributorService.getFundMonthlyReturns(code).catch(() => {});
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }
    };

    processQueue();
    return () => { isActive = false; };
  }, [analyticsFund]);

  const handleOpenAnalytics = (fund: UnifiedFund) => {
    if (fund.amfiCode) {
      prefetchQueue.current = prefetchQueue.current.filter((c) => c !== fund.amfiCode);
    }
    setAnalyticsFund(fund);
  };

  const filterOptions = useMemo(() => {
    const options = new Set<string>();
    if (normalizedPortfolio?.funds) {
      normalizedPortfolio.funds.forEach((fund: any) => {
        if (activeFilterType === "Category/Industry") options.add(fund.category);
        if (activeFilterType === "AMC/Issuer") options.add(fund.amc);
        if (activeFilterType === "Tag" && fund.statusTag) options.add(fund.statusTag);
      });
    }
    return Array.from(options);
  }, [activeFilterType, normalizedPortfolio]);

  const filteredFunds = useMemo(() => {
    if (!normalizedPortfolio?.funds) return [];
    return normalizedPortfolio.funds.filter((fund: any) => {
      if (activeFilterType === "All" || activeFilterValue === "All") return true;
      if (activeFilterType === "Category/Industry") return fund.category === activeFilterValue;
      if (activeFilterType === "AMC/Issuer") return fund.amc === activeFilterValue;
      if (activeFilterType === "Tag") return fund.statusTag === activeFilterValue;
      return true;
    });
  }, [activeFilterType, activeFilterValue, normalizedPortfolio]);

  const getInitials = (name: string) => {
    if (!name || name === "Investor") return "IV";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-investor-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-bold text-sm tracking-wide uppercase">
          Decrypting Portfolio...
        </p>
      </div>
    );
  }

  if (error || !normalizedPortfolio) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-slate-50 px-4">
        <div className="bg-white p-6 rounded-md shadow-sm border border-rose-200 text-center max-w-sm w-full">
          <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <h3 className="text-slate-900 font-bold mb-2">Connection Error</h3>
          <p className="text-slate-500 text-sm mb-6">
            {error || "Could not retrieve portfolio data."}
          </p>
          <LogoutButton portal="investor" redirectTo="/login" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[100dvh] w-full overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 font-sans relative selection:bg-distributor-500/20 selection:text-investor-900">
      
      {/* ─── SIDEBAR NAVBAR ─── */}
      <InvestorSidebar 
        onExportHoldings={handleExportHoldings}
        onOpenCapitalGains={() => setIsCGModalOpen(true)}
        isExporting={isExportingPdf}
        isPortfolioLoaded={!!portfolio}
      />

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0 relative z-10 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-[0.35] bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        {/* ─── MOBILE VIEW ─── */}
        <div className="flex flex-col lg:hidden relative z-10 w-full h-full overflow-hidden">
          {mobileActiveScreen === "holdings" ? (
            <MobileHoldings
              client={normalizedPortfolio}
              filteredFunds={filteredFunds}
              activeFilterType={activeFilterType}
              setActiveFilterType={setActiveFilterType}
              activeFilterValue={activeFilterValue}
              setActiveFilterValue={setActiveFilterValue}
              filterOptions={filterOptions}
              onNavigateToFund={(fund) => {
                setMobileSelectedFund(fund);
                setMobileActiveScreen("fund_details");
              }}
            />
          ) : (
            mobileSelectedFund && (
              <MobileFundDetails
                fund={mobileSelectedFund}
                onBack={() => {
                  setMobileActiveScreen("holdings");
                  setMobileSelectedFund(null);
                }}
              />
            )
          )}
        </div>

        {/* ─── DESKTOP VIEW ─── */}
        <div className="hidden lg:flex flex-col relative z-10 px-4 sm:px-8 lg:px-12 py-6 max-w-[1800px] mx-auto space-y-3 w-full h-full overflow-hidden animate-[fadeIn_0.5s_ease-out]">
          <div className="shrink-0 flex justify-between items-end gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 mb-1">
                Portfolio <span className="text-investor-600">Overview</span>
              </h1>
              <p className="text-slate-500 font-medium mt-0 text-sm">
                Holistic view of your capital allocation and performance.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-distributor-100 text-investor-700 font-bold text-[10px]">
                  {getInitials(normalizedPortfolio.clientName)}
                </span>
                <h2 className="text-sm font-bold text-investor-700 tracking-wide uppercase">
                  {normalizedPortfolio.clientName}
                </h2>
              </div>
            </div>
            {/* The old cluster of action buttons has been cleanly removed from here */}
          </div>

          <div className="shrink-0">
            <GlobalStatsRibbon client={normalizedPortfolio} />
          </div>

          <div className="shrink-0">
            <FilterBar
              activeFilterType={activeFilterType}
              setActiveFilterType={setActiveFilterType}
              activeFilterValue={activeFilterValue}
              setActiveFilterValue={setActiveFilterValue}
              filterOptions={filterOptions}
              avgHoldingDays={normalizedPortfolio.avgHoldingDays}
            />
          </div>

          <div className="flex-1 min-h-0 pb-4 w-full">
            <DesktopFundTable
              funds={filteredFunds}
              onOpenAnalytics={handleOpenAnalytics}
            />
          </div>
        </div>
      </main>

      {/* ─── FUND ANALYTICS MODAL ─── */}
      {analyticsFund && (
        <FundAnalyticsModal
          fund={analyticsFund}
          onClose={() => setAnalyticsFund(null)}
        />
      )}

      {/* ─── CAPITAL GAINS MODAL (INVESTOR THEME) ─── */}
      {isCGModalOpen && (
        <div
          className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0" onClick={handleCloseModal} />

          <div className="bg-white rounded-sm shadow-xl border border-slate-200 w-full max-w-sm overflow-visible animate-in zoom-in-95 duration-200 relative z-10 flex flex-col">
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
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex flex-col overflow-y-visible">
              {cgNotif && (
                <div className="mb-4">
                  <InlineNotif
                    notif={cgNotif}
                    onDismiss={() => setCGNotif(null)}
                  />
                </div>
              )}

              {/* Report Type Segmented Selector */}
              <div className="relative flex bg-slate-100/80 p-1 rounded-sm mb-5 border border-slate-200/40 select-none z-0">
                <div
                  className="absolute top-1 bottom-1 w-[calc((100%-8px)/3)] bg-white rounded-sm shadow-sm border border-slate-200/40 transition-transform duration-300 ease-in-out -z-10"
                  style={{
                    left: "4px",
                    transform:
                      cgReportType === "FY"
                        ? "translateX(0)"
                        : cgReportType === "CY"
                        ? "translateX(100%)"
                        : "translateX(200%)",
                  }}
                />
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
                      setIsFYSelectorOpen(false);
                      setIsCYSelectorOpen(false);
                    }}
                    disabled={!!exportingFormat}
                    className={`relative z-10 flex-1 py-1.5 text-xs font-black rounded-sm transition-colors duration-300 active:scale-95 disabled:opacity-50 ${
                      cgReportType === type.id
                        ? "text-investor-700"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              {/* Dynamic Selection Area */}
              <div className="relative h-[165px] w-full z-20">
                
                {cgReportType === "FY" && (
                  <div className="relative animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <button
                      onClick={() => setIsFYSelectorOpen(!isFYSelectorOpen)}
                      disabled={!!exportingFormat}
                      className="w-full flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-sm hover:border-slate-300 transition-all focus:outline-none focus:ring-2 focus:ring-slate-900/10 active:scale-[0.99]"
                    >
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Financial Year
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 tracking-tight">
                          {selectedFY}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                            isFYSelectorOpen ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {isFYSelectorOpen && (
                      <div className="absolute top-[110%] left-0 w-full bg-white border border-slate-200 shadow-xl rounded-sm p-3 z-50 animate-in fade-in slide-in-from-top-2">
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
                              className={`py-2 px-1 text-xs font-bold rounded-sm border transition-all ${
                                selectedFY === fy
                                  ? "bg-distributor-50 border-investor-500 text-investor-700 shadow-sm"
                                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                              }`}
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
                      className="w-full flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-sm hover:border-slate-300 transition-all focus:outline-none focus:ring-2 focus:ring-slate-900/10 active:scale-[0.99]"
                    >
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Calendar Year
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 tracking-tight">
                          {selectedCY}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                            isCYSelectorOpen ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {isCYSelectorOpen && (
                      <div className="absolute top-[110%] left-0 w-full bg-white border border-slate-200 shadow-xl rounded-sm p-3 z-50 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                          <button
                            onClick={() => setCyPage((p) => Math.max(0, p - 1))}
                            disabled={cyPage === 0}
                            className="p-1 text-slate-400 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-400"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Page {cyPage + 1} of {maxCYPages}
                          </span>
                          <button
                            onClick={() =>
                              setCyPage((p) => Math.min(maxCYPages - 1, p + 1))
                            }
                            disabled={cyPage === maxCYPages - 1}
                            className="p-1 text-slate-400 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-400"
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
                              className={`py-2 px-1 text-xs font-bold rounded-sm border transition-all ${
                                selectedCY === cy
                                  ? "bg-distributor-50 border-investor-500 text-investor-700 shadow-sm"
                                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                              }`}
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
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
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
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs font-black text-slate-800 tracking-tight focus:border-investor-600 focus:bg-white focus:ring-4 focus:ring-investor-500/10 focus:outline-none transition-all cursor-pointer hover:bg-slate-100/50"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
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
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs font-black text-slate-800 tracking-tight focus:border-investor-600 focus:bg-white focus:ring-4 focus:ring-investor-500/10 focus:outline-none transition-all cursor-pointer hover:bg-slate-100/50"
                      />
                    </div>
                  </div>
                )}
                
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 mt-1 shrink-0">
                <button
                  onClick={() => handleExportCG("pdf")}
                  disabled={
                    !!exportingFormat || isFYSelectorOpen || isCYSelectorOpen
                  }
                  className="flex flex-col items-center justify-center gap-2 p-3 rounded-sm border-2 border-slate-100 hover:border-rose-200 hover:bg-rose-50 text-rose-600 disabled:opacity-50 active:scale-95 transition-all"
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
                  className="flex flex-col items-center justify-center gap-2 p-3 rounded-sm border-2 border-slate-100 hover:border-investor-200 hover:bg-distributor-50 text-investor-600 disabled:opacity-50 active:scale-95 transition-all"
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