"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/investor/LogoutButton";
import { exportTransactionReport } from "@/lib/transactionReportExport";
import {
  LayoutDashboard,
  BarChart3,
  Calculator,
  Settings,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Menu,
  Repeat,
  X,
  TrendingUp,
  Target,
  PiggyBank,
  TrendingDown,
  ArrowRightLeft,
  RefreshCcw,
  Download,
  FileText,
  Loader2,
} from "lucide-react";
import { investorService } from "@/services/investor.service";


interface InvestorSidebarProps {
  onExportHoldings: () => void;
  onOpenCapitalGains: () => void;
  isExporting: boolean;
  isPortfolioLoaded: boolean;
}

export default function InvestorSidebar({
  onExportHoldings,
  onOpenCapitalGains,
  isExporting,
  isPortfolioLoaded,
}: InvestorSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Menu States
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isCalculatorsOpen, setIsCalculatorsOpen] = useState(false);

  // Report States
  const [isExportingTxn, setIsExportingTxn] = useState(false);

  // Dynamic Logo State
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  // Extract and format logo from local storage
  useEffect(() => {
    try {
      let storedLogo = localStorage.getItem("company-logo-inv");

      if (
        storedLogo &&
        storedLogo !== "null" &&
        storedLogo !== "undefined" &&
        storedLogo.length > 20
      ) {
        // Append prefix if missing for proper rendering
        if (!storedLogo.startsWith("data:image")) {
          storedLogo = `data:image/png;base64,${storedLogo}`;
        }
        setCompanyLogo(storedLogo);
      } else {
        console.warn("Sidebar: No valid logo found in local storage.");
      }
    } catch (err) {
      console.error("Sidebar: Error retrieving logo.", err);
    }
  }, []);

  // Auto-expand menus if we are inside their respective routes
  useEffect(() => {
    if (pathname.startsWith("/investor/calculators")) {
      setIsCalculatorsOpen(true);
    }
  }, [pathname]);

  const handleReportsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isCollapsed) {
      setIsCollapsed(false);
      setIsReportsOpen(true);
    } else {
      setIsReportsOpen(!isReportsOpen);
    }
  };

  const handleCalculatorsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isCollapsed) {
      setIsCollapsed(false);
      setIsCalculatorsOpen(true);
    } else {
      setIsCalculatorsOpen(!isCalculatorsOpen);
    }
  };

  const handleTransactionExport = async () => {
    setIsExportingTxn(true);
    try {
      await exportTransactionReport("me", "Investor", undefined);
    } catch (err: any) {
      console.error("Error exporting transaction report:", err);
    } finally {
      setIsExportingTxn(false);
    }
  };

  return (
    <>
      {/* Mobile Hamburger */}
      <button
        onClick={() => setIsMobileOpen(true)}
        style={{ backgroundColor: 'var(--fin-sidebar-mobile-btn-bg)', borderColor: 'var(--fin-sidebar-mobile-btn-border)', color: 'var(--fin-sidebar-mobile-btn-text)' }}
        className="lg:hidden fixed top-4 right-4 z-50 p-2.5 border rounded-md shadow-sm"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 backdrop-blur-sm z-40"
          style={{ backgroundColor: 'var(--fin-sidebar-mobile-backdrop)' }}
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      {/* Note: changed 'fixed' to 'fixed lg:relative' so it sits perfectly in your flex-row page layout without overlapping */}
      <aside
        style={{ backgroundColor: 'var(--fin-sidebar-bg)', borderColor: 'var(--fin-sidebar-border)' }}
        className={`h-screen backdrop-blur-xl border-r flex flex-col fixed lg:relative left-0 top-0 z-50 transition-all duration-300 ease-in-out overflow-x-hidden flex-shrink-0
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} 
        ${isCollapsed ? "w-24" : "w-72"}`}
      >
        {/* ─── BRAND HEADER ─── */}
        <div
          className={`relative p-8 pb-10 flex items-center ${isCollapsed ? "justify-center px-4" : "justify-center w-full"}`}
        >
          <Link
            href={
              pathname.startsWith("/investor") ? "/investor" : "/distributor"
            }
            className="flex items-center group overflow-hidden w-full justify-center"
          >
            <div
              className={`shrink-0 transition-all duration-300 flex items-center justify-center ${isCollapsed ? "w-10 h-10" : "w-32 h-16"}`}
            >
              {companyLogo ? (
                <img
                  src={companyLogo}
                  alt="Company Logo"
                  className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-theme-btnPrimaryBg rounded-md flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
                  <span className="text-theme-btnPrimaryText font-bold text-[10px]">
                    LOGO
                  </span>
                </div>
              )}
            </div>
          </Link>

          {!isCollapsed && (
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden absolute top-8 right-4 text-theme-textMuted"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Area */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto overflow-x-hidden scrollbar-none pb-4">
          {/* Dashboard */}
          <Link
            href="/investor"
            onClick={() => setIsMobileOpen(false)}
            className={`flex items-center overflow-hidden ${
              isCollapsed ? "justify-center" : "justify-between"
            } px-4 py-3 rounded-md transition-all duration-300 group ${
              pathname === "/investor"
                ? "bg-[var(--fin-sidebar-item-active-bg)] text-[var(--fin-sidebar-item-active-text)] shadow-md shadow-[var(--fin-sidebar-item-active-bg)]/20"
                : "text-[var(--fin-sidebar-item-default-text)] hover:bg-[var(--fin-sidebar-item-hover-bg)] hover:text-[var(--fin-sidebar-item-hover-text)]"
            }`}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard
                className={`w-5 h-5 shrink-0 transition-transform duration-300 ${
                  pathname === "/investor"
                    ? "scale-110"
                    : "group-hover:scale-110"
                }`}
              />
              {!isCollapsed && (
                <span className="font-bold text-sm tracking-tight whitespace-nowrap">
                  Dashboard
                </span>
              )}
            </div>
            {!isCollapsed && pathname === "/investor" && (
              <div className="w-1.5 h-1.5 shrink-0 bg-[var(--fin-sidebar-item-active-dot)] rounded-full" />
            )}
          </Link>

          {/* Reports (Nested Menu using Action Buttons instead of Links) */}
          <div className="space-y-1">
            <button
              onClick={handleReportsClick}
              className={`w-full flex items-center overflow-hidden ${
                isCollapsed ? "justify-center" : "justify-between"
              } px-4 py-3 rounded-md transition-all duration-300 group ${
                isReportsOpen
                  ? "bg-[var(--fin-sidebar-group-active-bg)] text-[var(--fin-sidebar-group-active-text)]"
                  : "text-[var(--fin-sidebar-item-default-text)] hover:bg-[var(--fin-sidebar-item-hover-bg)] hover:text-[var(--fin-sidebar-item-hover-text)]"
              }`}
            >
              <div className="flex items-center gap-3">
                <BarChart3
                  className={`w-5 h-5 shrink-0 transition-transform duration-300 ${
                    isReportsOpen
                      ? "scale-110 text-[var(--fin-sidebar-section-accent)]"
                      : "group-hover:scale-110"
                  }`}
                />
                {!isCollapsed && (
                  <span className="font-bold text-sm tracking-tight whitespace-nowrap">
                    Reports
                  </span>
                )}
              </div>
              {!isCollapsed && (
                <ChevronDown
                  className={`w-4 h-4 shrink-0 transition-transform duration-300 ${
                    isReportsOpen
                      ? "rotate-180 text-[var(--fin-sidebar-chevron-open)]"
                      : "text-[var(--fin-sidebar-chevron-closed)]"
                  }`}
                />
              )}
            </button>

            {!isCollapsed && isReportsOpen && (
              <div className="pl-4 pr-2 py-1 space-y-1 animate-[fadeIn_0.3s_ease-out]">
                <button
                  onClick={handleTransactionExport}
                  disabled={isExportingTxn}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-md transition-all duration-200 text-[var(--fin-sidebar-sub-item-text)] hover:text-[var(--fin-sidebar-sub-item-hover-text)] hover:bg-[var(--fin-sidebar-sub-item-hover-bg)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExportingTxn ? (
                    <Loader2 className="w-4 h-4 shrink-0 animate-spin text-[var(--fin-sidebar-section-accent)]" />
                  ) : (
                    <Download className="w-4 h-4 shrink-0" />
                  )}
                  <span className="text-xs font-bold whitespace-nowrap cursor-pointer">
                    {isExportingTxn ? "Generating..." : "Transaction Report"}
                  </span>
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onExportHoldings();
                    setIsMobileOpen(false);
                  }}
                  disabled={!isPortfolioLoaded || isExporting}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-md transition-all duration-200 text-[var(--fin-sidebar-sub-item-text)] hover:text-[var(--fin-sidebar-sub-item-hover-text)] hover:bg-[var(--fin-sidebar-sub-item-hover-bg)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 shrink-0 animate-spin text-[var(--fin-sidebar-section-accent)]" />
                  ) : (
                    <Download className="w-4 h-4 shrink-0" />
                  )}
                  <span className="text-xs cursor-pointer font-bold whitespace-nowrap">
                    Holdings Report
                  </span>
                </button>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenCapitalGains();
                    setIsMobileOpen(false);
                  }}
                  disabled={!isPortfolioLoaded}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-md transition-all duration-200 text-[var(--fin-sidebar-sub-item-text)] hover:text-[var(--fin-sidebar-sub-item-hover-text)] hover:bg-[var(--fin-sidebar-sub-item-hover-bg)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span className="text-xs cursor-pointer font-bold whitespace-nowrap">
                    Capital Gains
                  </span>
                </button>
                <Link
                  href="/investor/reports/systematic-transactions"
                  onClick={() => setIsMobileOpen(false)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md transition-all duration-200 ${
                    pathname === "/investor/reports/systematic-transactions"
                      ? "bg-[var(--fin-sidebar-sub-item-active-bg)] text-[var(--fin-sidebar-sub-item-active-text)] ring-1 ring-[var(--fin-sidebar-sub-item-active-ring)]"
                      : "text-[var(--fin-sidebar-sub-item-text)] hover:text-[var(--fin-sidebar-sub-item-hover-text)] hover:bg-[var(--fin-sidebar-sub-item-hover-bg)]"
                  }`}
                >
                  <Repeat className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold whitespace-nowrap">
                    Systematic Transactions
                  </span>
                </Link>
              </div>
            )}
          </div>

          {/* Calculators (Nested Menu) */}
          <div className="space-y-1">
            <button
              onClick={handleCalculatorsClick}
              className={`w-full flex items-center overflow-hidden ${
                isCollapsed ? "justify-center" : "justify-between"
              } px-4 py-3 rounded-md transition-all duration-300 group ${
                pathname.startsWith("/investor/calculators")
                  ? "bg-[var(--fin-sidebar-group-active-bg)] text-[var(--fin-sidebar-group-active-text)]"
                  : "text-[var(--fin-sidebar-item-default-text)] hover:bg-[var(--fin-sidebar-item-hover-bg)] hover:text-[var(--fin-sidebar-item-hover-text)]"
              }`}
            >
              <div className="flex items-center gap-3">
                <Calculator
                  className={`w-5 h-5 shrink-0 transition-transform duration-300 ${
                    pathname.startsWith("/investor/calculators")
                      ? "scale-110 text-[var(--fin-sidebar-section-accent)]"
                      : "group-hover:scale-110"
                  }`}
                />
                {!isCollapsed && (
                  <span className="font-bold text-sm tracking-tight whitespace-nowrap">
                    Calculators
                  </span>
                )}
              </div>
              {!isCollapsed && (
                <ChevronDown
                  className={`w-4 h-4 shrink-0 transition-transform duration-300 ${
                    isCalculatorsOpen
                      ? "rotate-180 text-[var(--fin-sidebar-chevron-open)]"
                      : "text-[var(--fin-sidebar-chevron-closed)]"
                  }`}
                />
              )}
            </button>

            {!isCollapsed && isCalculatorsOpen && (
              <div className="pl-4 pr-2 py-1 space-y-1 animate-[fadeIn_0.3s_ease-out]">
                <Link
                  href="/investor/calculators/mf-returns"
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition-all duration-200 ${
                    pathname === "/investor/calculators/mf-returns"
                      ? "bg-[var(--fin-sidebar-sub-item-active-bg)] text-[var(--fin-sidebar-sub-item-active-text)] ring-1 ring-[var(--fin-sidebar-sub-item-active-ring)]"
                      : "text-[var(--fin-sidebar-sub-item-text)] hover:text-[var(--fin-sidebar-sub-item-hover-text)] hover:bg-[var(--fin-sidebar-sub-item-hover-bg)]"
                  }`}
                >
                  <TrendingUp className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold">MF Returns</span>
                </Link>
                <Link
                  href="/investor/calculators/goal"
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition-all duration-200 ${
                    pathname === "/investor/calculators/goal"
                      ? "bg-[var(--fin-sidebar-sub-item-active-bg)] text-[var(--fin-sidebar-sub-item-active-text)] ring-1 ring-[var(--fin-sidebar-sub-item-active-ring)]"
                      : "text-[var(--fin-sidebar-sub-item-text)] hover:text-[var(--fin-sidebar-sub-item-hover-text)] hover:bg-[var(--fin-sidebar-sub-item-hover-bg)]"
                  }`}
                >
                  <Target className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold">Goal Planner</span>
                </Link>
                <Link
                  href="/investor/calculators/fd"
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition-all duration-200 ${
                    pathname === "/investor/calculators/fd"
                      ? "bg-[var(--fin-sidebar-sub-item-active-bg)] text-[var(--fin-sidebar-sub-item-active-text)] ring-1 ring-[var(--fin-sidebar-sub-item-active-ring)]"
                      : "text-[var(--fin-sidebar-sub-item-text)] hover:text-[var(--fin-sidebar-sub-item-hover-text)] hover:bg-[var(--fin-sidebar-sub-item-hover-bg)]"
                  }`}
                >
                  <PiggyBank className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold">FD Calculator</span>
                </Link>
                <Link
                  href="/investor/calculators/swp"
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition-all duration-200 ${
                    pathname === "/investor/calculators/swp"
                      ? "bg-[var(--fin-sidebar-sub-item-active-bg)] text-[var(--fin-sidebar-sub-item-active-text)] ring-1 ring-[var(--fin-sidebar-sub-item-active-ring)]"
                      : "text-[var(--fin-sidebar-sub-item-text)] hover:text-[var(--fin-sidebar-sub-item-hover-text)] hover:bg-[var(--fin-sidebar-sub-item-hover-bg)]"
                  }`}
                >
                  <TrendingDown className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold">SWP Calculator</span>
                </Link>
                <Link
                  href="/investor/calculators/stp"
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition-all duration-200 ${
                    pathname === "/investor/calculators/stp"
                      ? "bg-[var(--fin-sidebar-sub-item-active-bg)] text-[var(--fin-sidebar-sub-item-active-text)] ring-1 ring-[var(--fin-sidebar-sub-item-active-ring)]"
                      : "text-[var(--fin-sidebar-sub-item-text)] hover:text-[var(--fin-sidebar-sub-item-hover-text)] hover:bg-[var(--fin-sidebar-sub-item-hover-bg)]"
                  }`}
                >
                  <ArrowRightLeft className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold">STP Calculator</span>
                </Link>
                <Link
                  href="/investor/calculators/reverse-emi"
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition-all duration-200 ${
                    pathname === "/investor/calculators/reverse-emi"
                      ? "bg-[var(--fin-sidebar-sub-item-active-bg)] text-[var(--fin-sidebar-sub-item-active-text)] ring-1 ring-[var(--fin-sidebar-sub-item-active-ring)]"
                      : "text-[var(--fin-sidebar-sub-item-text)] hover:text-[var(--fin-sidebar-sub-item-hover-text)] hover:bg-[var(--fin-sidebar-sub-item-hover-bg)]"
                  }`}
                >
                  <RefreshCcw className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold">Reverse EMI</span>
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* ─── COMPACT BOTTOM ACTIONS ROW ─── */}
        <div
          style={{ backgroundColor: 'var(--fin-sidebar-footer-bg)', borderColor: 'var(--fin-sidebar-footer-border)' }}
          className={`p-4 mt-auto border-t flex ${
            isCollapsed ? "flex-col items-center gap-3" : "items-center gap-2"
          } shrink-0`}
        >

          {/* Collapse Icon */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-2.5 text-[var(--fin-sidebar-collapse-icon-color)] hover:text-[var(--fin-sidebar-collapse-icon-hover)] hover:bg-[var(--fin-sidebar-item-hover-bg)] rounded-md transition-colors shrink-0"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>

          {/* Logout Button */}
          <div
            className={`${
              isCollapsed ? "w-full flex justify-center" : "flex-1 min-w-0"
            }`}
          >
            {isCollapsed ? (
              <LogoutButton portal="investor" redirectTo="/login" isCollapsed={true} />
            ) : (
              <LogoutButton portal="investor" redirectTo="/login" />
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
