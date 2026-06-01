"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/investor/LogoutButton";
import {
  LayoutDashboard,
  BarChart3,
  Calculator,
  Settings,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Menu,
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

  return (
    <>
      {/* Mobile Hamburger */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2.5 bg-white border border-slate-200 rounded-md shadow-sm text-slate-600"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      {/* Note: changed 'fixed' to 'fixed lg:relative' so it sits perfectly in your flex-row page layout without overlapping */}
      <aside
        className={`h-screen bg-white/80 backdrop-blur-xl border-r border-slate-200 flex flex-col fixed lg:relative left-0 top-0 z-50 transition-all duration-300 ease-in-out overflow-x-hidden flex-shrink-0
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} 
        ${isCollapsed ? "w-24" : "w-72"}`}
      >
        {/* Brand Header */}
        <div
          className={`p-8 pb-10 flex items-center ${
            isCollapsed ? "justify-center px-4" : "justify-between"
          }`}
        >
          <Link
            href="/investor"
            className="flex items-center gap-3 group overflow-hidden"
          >
            <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-investor-600 to-investor-800 rounded-md flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            {!isCollapsed && (
              <div className="animate-[fadeIn_0.2s_ease-in] whitespace-nowrap">
                <span className="text-xl font-black tracking-tight text-slate-900 block leading-none">
                  FinIQ
                </span>
                <span className="text-[10px] font-bold text-investor-600 uppercase tracking-widest mt-1 block">
                  Investor
                </span>
              </div>
            )}
          </Link>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
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
                ? "bg-distributor-600 text-white shadow-md shadow-investor-600/20"
                : "text-slate-600 hover:bg-distributor-50 hover:text-investor-700"
            }`}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard
                className={`w-5 h-5 shrink-0 transition-transform duration-300 ${
                  pathname === "/investor" ? "scale-110" : "group-hover:scale-110"
                }`}
              />
              {!isCollapsed && (
                <span className="font-bold text-sm tracking-tight whitespace-nowrap">
                  Dashboard
                </span>
              )}
            </div>
            {!isCollapsed && pathname === "/investor" && (
              <div className="w-1.5 h-1.5 shrink-0 bg-white rounded-full" />
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
                  ? "bg-distributor-50 text-investor-700"
                  : "text-slate-600 hover:bg-distributor-50 hover:text-investor-700"
              }`}
            >
              <div className="flex items-center gap-3">
                <BarChart3
                  className={`w-5 h-5 shrink-0 transition-transform duration-300 ${
                    isReportsOpen ? "scale-110 text-investor-600" : "group-hover:scale-110"
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
                    isReportsOpen ? "rotate-180 text-investor-600" : "text-slate-400"
                  }`}
                />
              )}
            </button>

            {!isCollapsed && isReportsOpen && (
              <div className="pl-4 pr-2 py-1 space-y-1 animate-[fadeIn_0.3s_ease-out]">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onExportHoldings();
                    setIsMobileOpen(false);
                  }}
                  disabled={!isPortfolioLoaded || isExporting}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-md transition-all duration-200 text-slate-500 hover:text-investor-600 hover:bg-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 shrink-0 animate-spin text-investor-600" />
                  ) : (
                    <Download className="w-4 h-4 shrink-0" />
                  )}
                  <span className="text-xs font-bold whitespace-nowrap">Holdings Report</span>
                </button>
                
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenCapitalGains();
                    setIsMobileOpen(false);
                  }}
                  disabled={!isPortfolioLoaded}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-md transition-all duration-200 text-slate-500 hover:text-investor-600 hover:bg-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold whitespace-nowrap">Capital Gains</span>
                </button>
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
                  ? "bg-distributor-50 text-investor-700"
                  : "text-slate-600 hover:bg-distributor-50 hover:text-investor-700"
              }`}
            >
              <div className="flex items-center gap-3">
                <Calculator
                  className={`w-5 h-5 shrink-0 transition-transform duration-300 ${
                    pathname.startsWith("/investor/calculators")
                      ? "scale-110 text-investor-600"
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
                    isCalculatorsOpen ? "rotate-180 text-investor-600" : "text-slate-400"
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
                      ? "bg-white text-investor-700 ring-1 ring-investor-100"
                      : "text-slate-500 hover:text-investor-600 hover:bg-white/50"
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
                      ? "bg-white text-investor-700 ring-1 ring-investor-100"
                      : "text-slate-500 hover:text-investor-600 hover:bg-white/50"
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
                      ? "bg-white text-investor-700 ring-1 ring-investor-100"
                      : "text-slate-500 hover:text-investor-600 hover:bg-white/50"
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
                      ? "bg-white text-investor-700 ring-1 ring-investor-100"
                      : "text-slate-500 hover:text-investor-600 hover:bg-white/50"
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
                      ? "bg-white text-investor-700 ring-1 ring-investor-100"
                      : "text-slate-500 hover:text-investor-600 hover:bg-white/50"
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
                      ? "bg-white text-investor-700 ring-1 ring-investor-100"
                      : "text-slate-500 hover:text-investor-600 hover:bg-white/50"
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
          className={`p-4 mt-auto border-t border-slate-100 bg-white/50 flex ${
            isCollapsed ? "flex-col items-center gap-3" : "items-center gap-2"
          } shrink-0`}
        >
          {/* Settings Icon (Placeholder routing for future) */}
          <Link
            href="#"
            title="Settings"
            className="p-2.5 text-slate-400 hover:text-investor-600 hover:bg-distributor-50 rounded-md transition-colors group shrink-0"
          >
            <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform duration-500" />
          </Link>

          {/* Collapse Icon */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors shrink-0"
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
              <Link
                href="/login"
                title="Sign Out"
                className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors flex items-center justify-center"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  ></path>
                </svg>
              </Link>
            ) : (
              <LogoutButton portal="investor" redirectTo="/login" />
            )}
          </div>
        </div>
      </aside>
    </>
  );
}