"use client";

import React, { useState, useMemo } from "react";
import { X, ChevronDown, ChevronLeft, ChevronRight, AlertTriangle, Info } from "lucide-react";
import { exportCapitalGains } from "@/lib/capitalGainsExport";
import { getDynamicFinancialYears } from "@/lib/utils";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useParams } from "next/navigation";

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
    error: "bg-[var(--fin-badge-danger-bg)] border-[var(--fin-badge-danger-border)] text-[var(--fin-badge-danger-text)]",
    info: "bg-[var(--fin-brand-50)] border-[var(--fin-brand-200)] text-[var(--fin-brand-700)]",
    warning: "bg-[var(--fin-badge-warning-bg)] border-[var(--fin-badge-warning-border)] text-[var(--fin-badge-warning-text)]",
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

interface CapitalGainsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CapitalGainsModal({ isOpen, onClose }: CapitalGainsModalProps) {
  const { portfolio } = usePortfolio();
  const params = useParams();
  const targetInvestorId = (params?.id as string) || "me";
  
  const financialYearOptions = useMemo(() => getDynamicFinancialYears(2010), []);
  const calendarYearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear; y >= 2010; y--) {
      years.push(y.toString());
    }
    return years;
  }, []);

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

  if (!isOpen) return null;

  const handleCloseModal = () => {
    if (exportingFormat) return;
    onClose();
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
      const rawP = portfolio?.data || portfolio;
      const investorName = rawP?.investor_name || rawP?.clientName || "Investor";
      await exportCapitalGains(
        format,
        targetInvestorId,
        investorName,
        start_date,
        end_date,
        periodLabel,
        undefined
      );
      handleCloseModal();
    } catch (err: any) {
      console.error("Capital Gains fetch failed:", err);
      setCGNotif({
        type: "error",
        message:
          err?.message || "Failed to export Capital Gains data. Please try again.",
      });
    } finally {
      setExportingFormat(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[var(--fin-table-bg)]/80 backdrop-blur-sm animate-in fade-in duration-200"
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

        <div className="p-5 flex flex-col overflow-y-visible">
          {cgNotif && (
            <div className="mb-4">
              <InlineNotif notif={cgNotif} onDismiss={() => setCGNotif(null)} />
            </div>
          )}

          {/* Report Type Segmented Selector */}
          <div className="relative flex bg-[var(--fin-skeleton-base)]/80 p-1 rounded-sm mb-5 border border-[var(--fin-border)]/40 select-none z-0">
            <div
              className="absolute top-1 bottom-1 w-[calc((100%-8px)/3)] bg-[var(--fin-table-bg)] rounded-sm shadow-sm border border-[var(--fin-border)]/40 transition-transform duration-300 ease-in-out -z-10"
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
                    ? "text-[var(--fin-brand-700)]"
                    : "text-[var(--fin-muted-text)] hover:text-[var(--fin-heading-tertiary)]"
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
                      className={`w-4 h-4 text-[var(--fin-muted-text)] transition-transform duration-200 ${
                        isFYSelectorOpen ? "rotate-180" : ""
                      }`}
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
                          className={`py-2 px-1 text-xs font-bold rounded-sm border transition-all ${
                            selectedFY === fy
                              ? "bg-[var(--fin-brand-50)] border-[var(--fin-brand-500)] text-[var(--fin-brand-700)] shadow-sm"
                              : "bg-[var(--fin-table-bg)] border-[var(--fin-border)] text-[var(--fin-body-text)] hover:border-[var(--fin-border)] hover:bg-[var(--fin-page-bg)]"
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
                      className={`w-4 h-4 text-[var(--fin-muted-text)] transition-transform duration-200 ${
                        isCYSelectorOpen ? "rotate-180" : ""
                      }`}
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
                          className={`py-2 px-1 text-xs font-bold rounded-sm border transition-all ${
                            selectedCY === cy
                              ? "bg-[var(--fin-brand-50)] border-[var(--fin-brand-500)] text-[var(--fin-brand-700)] shadow-sm"
                              : "bg-[var(--fin-table-bg)] border-[var(--fin-border)] text-[var(--fin-body-text)] hover:border-[var(--fin-border)] hover:bg-[var(--fin-page-bg)]"
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
          </div>

          <div className="mt-4 flex gap-3 z-0 shrink-0">
            <button
              onClick={() => handleExportCG("pdf")}
              disabled={!!exportingFormat}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[var(--fin-brand-600)] text-[var(--fin-btn-primary-text)] font-semibold text-sm rounded-sm hover:bg-[var(--fin-brand-700)] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm focus:ring-2 focus:ring-offset-1 focus:ring-[var(--fin-brand-500)]"
            >
              Export PDF
            </button>
            <button
              onClick={() => handleExportCG("excel")}
              disabled={!!exportingFormat}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[var(--fin-table-bg)] text-[var(--fin-table-row-text)] font-semibold text-sm rounded-sm border border-[var(--fin-border)] hover:bg-[var(--fin-page-bg)] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm focus:ring-2 focus:ring-offset-1 focus:ring-[var(--fin-brand-500)]"
            >
              Export Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
