"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/investor/LogoutButton";
import {
  LayoutDashboard,
  Users,
  UserSquare2,
  BarChart3,
  Calculator,
  Settings,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Menu,
  X,
  FilePieChart,
  Wallet,
  Network,
  TrendingUp,
  Target,
  PiggyBank,
  TrendingDown,
  ArrowRightLeft,
  RefreshCcw,
} from "lucide-react";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
}

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Menu States
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isCalculatorsOpen, setIsCalculatorsOpen] = useState(false);

  // Auto-expand menus if we are inside their respective routes
  useEffect(() => {
    if (pathname.startsWith("/distributor/reports")) {
      setIsReportsOpen(true);
    }
    if (pathname.startsWith("/distributor/calculators")) {
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
      <aside
        className={`h-screen bg-white/80 backdrop-blur-xl border-r border-slate-200 flex flex-col fixed left-0 top-0 z-50 transition-all duration-300 ease-in-out overflow-x-hidden
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} 
        ${isCollapsed ? "w-24" : "w-72"}`}
      >
        {/* Brand Header */}
        <div
          className={`p-8 pb-10 flex items-center ${isCollapsed ? "justify-center px-4" : "justify-between"}`}
        >
          <Link
            href="/distributor"
            className="flex items-center gap-3 group overflow-hidden"
          >
            <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-distributor-600 to-distributor-800 rounded-md flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
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
                <span className="text-[10px] font-bold text-distributor-600 uppercase tracking-widest mt-1 block">
                  Distributor
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
            href="/distributor"
            onClick={() => setIsMobileOpen(false)}
            className={`flex items-center overflow-hidden ${isCollapsed ? "justify-center" : "justify-between"} px-4 py-3 rounded-md transition-all duration-300 group ${
              pathname === "/distributor"
                ? "bg-distributor-600 text-white"
                : "text-slate-600 hover:bg-distributor-50 hover:text-distributor-700"
            }`}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard
                className={`w-5 h-5 shrink-0 transition-transform duration-300 ${pathname === "/distributor" ? "scale-110" : "group-hover:scale-110"}`}
              />
              {!isCollapsed && (
                <span className="font-bold text-sm tracking-tight whitespace-nowrap">
                  Dashboard
                </span>
              )}
            </div>
            {!isCollapsed && pathname === "/distributor" && (
              <div className="w-1.5 h-1.5 shrink-0 bg-white rounded-full" />
            )}
          </Link>

          {/* Investors */}
          <Link
            href="/distributor/clients"
            onClick={() => setIsMobileOpen(false)}
            className={`flex items-center overflow-hidden ${isCollapsed ? "justify-center" : "justify-between"} px-4 py-3 rounded-md transition-all duration-300 group ${
              pathname.startsWith("/distributor/clients")
                ? "bg-distributor-600 text-white"
                : "text-slate-600 hover:bg-distributor-50 hover:text-distributor-700"
            }`}
          >
            <div className="flex items-center gap-3">
              <Users
                className={`w-5 h-5 shrink-0 transition-transform duration-300 ${pathname.startsWith("/distributor/clients") ? "scale-110" : "group-hover:scale-110"}`}
              />
              {!isCollapsed && (
                <span className="font-bold text-sm tracking-tight whitespace-nowrap">
                  Investors
                </span>
              )}
            </div>
            {!isCollapsed && pathname.startsWith("/distributor/clients") && (
              <div className="w-1.5 h-1.5 shrink-0 bg-white rounded-full" />
            )}
          </Link>

          {/* User Management */}
          <Link
            href="/distributor/users"
            onClick={() => setIsMobileOpen(false)}
            className={`flex items-center overflow-hidden ${isCollapsed ? "justify-center" : "justify-between"} px-4 py-3 rounded-md transition-all duration-300 group ${
              pathname.startsWith("/distributor/users")
                ? "bg-distributor-600 text-white"
                : "text-slate-600 hover:bg-distributor-50 hover:text-distributor-700"
            }`}
          >
            <div className="flex items-center gap-3">
              <UserSquare2
                className={`w-5 h-5 shrink-0 transition-transform duration-300 ${pathname.startsWith("/distributor/users") ? "scale-110" : "group-hover:scale-110"}`}
              />
              {!isCollapsed && (
                <span className="font-bold text-sm tracking-tight whitespace-nowrap">
                  User Management
                </span>
              )}
            </div>
            {!isCollapsed && pathname.startsWith("/distributor/users") && (
              <div className="w-1.5 h-1.5 shrink-0 bg-white rounded-full" />
            )}
          </Link>

          {/* Reports (Nested Menu) */}
          <div className="space-y-1">
            <button
              onClick={handleReportsClick}
              className={`w-full flex items-center overflow-hidden ${isCollapsed ? "justify-center" : "justify-between"} px-4 py-3 rounded-md transition-all duration-300 group ${
                pathname.startsWith("/distributor/reports")
                  ? "bg-distributor-50 text-distributor-700"
                  : "text-slate-600 hover:bg-distributor-50 hover:text-distributor-700"
              }`}
            >
              <div className="flex items-center gap-3">
                <BarChart3
                  className={`w-5 h-5 shrink-0 transition-transform duration-300 ${pathname.startsWith("/distributor/reports") ? "scale-110 text-distributor-600" : "group-hover:scale-110"}`}
                />
                {!isCollapsed && (
                  <span className="font-bold text-sm tracking-tight whitespace-nowrap">
                    Reports
                  </span>
                )}
              </div>
              {!isCollapsed && (
                <ChevronDown
                  className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isReportsOpen ? "rotate-180 text-distributor-600" : "text-slate-400"}`}
                />
              )}
            </button>

            {!isCollapsed && isReportsOpen && (
              <div className="pl-4 pr-2 py-1 space-y-1 animate-[fadeIn_0.3s_ease-out]">
                <Link
                  href="/distributor/reports/hierarchy"
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition-all duration-200 ${pathname === "/distributor/reports/hierarchy" ? "bg-white text-distributor-700 ring-1 ring-distributor-100" : "text-slate-500 hover:text-distributor-600 hover:bg-white/50"}`}
                >
                  <Network className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold">Hierarchy Earnings</span>
                </Link>
                <Link
                  href="/distributor/reports/ledger"
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition-all duration-200 ${pathname === "/distributor/reports/ledger" ? "bg-white text-distributor-700 ring-1 ring-distributor-100" : "text-slate-500 hover:text-distributor-600 hover:bg-white/50"}`}
                >
                  <Wallet className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold">Broker Ledger</span>
                </Link>
                <Link
                  href="/distributor/reports/sips"
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition-all duration-200 ${pathname === "/distributor/reports/sips" ? "bg-white text-distributor-700 ring-1 ring-distributor-100" : "text-slate-500 hover:text-distributor-600 hover:bg-white/50"}`}
                >
                  <FilePieChart className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold">Active SIPs</span>
                </Link>
              </div>
            )}
          </div>

          {/* Calculators (Nested Menu) */}
          <div className="space-y-1">
            <button
              onClick={handleCalculatorsClick}
              className={`w-full flex items-center overflow-hidden ${isCollapsed ? "justify-center" : "justify-between"} px-4 py-3 rounded-md transition-all duration-300 group ${
                pathname.startsWith("/distributor/calculators")
                  ? "bg-distributor-50 text-distributor-700"
                  : "text-slate-600 hover:bg-distributor-50 hover:text-distributor-700"
              }`}
            >
              <div className="flex items-center gap-3">
                <Calculator
                  className={`w-5 h-5 shrink-0 transition-transform duration-300 ${pathname.startsWith("/distributor/calculators") ? "scale-110 text-distributor-600" : "group-hover:scale-110"}`}
                />
                {!isCollapsed && (
                  <span className="font-bold text-sm tracking-tight whitespace-nowrap">
                    Calculators
                  </span>
                )}
              </div>
              {!isCollapsed && (
                <ChevronDown
                  className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isCalculatorsOpen ? "rotate-180 text-distributor-600" : "text-slate-400"}`}
                />
              )}
            </button>

            {!isCollapsed && isCalculatorsOpen && (
              <div className="pl-4 pr-2 py-1 space-y-1 animate-[fadeIn_0.3s_ease-out]">
                <Link
                  href="/distributor/calculators/mf-returns"
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition-all duration-200 ${pathname === "/distributor/calculators/mf-returns" ? "bg-white text-distributor-700 ring-1 ring-distributor-100" : "text-slate-500 hover:text-distributor-600 hover:bg-white/50"}`}
                >
                  <TrendingUp className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold">MF Returns</span>
                </Link>
                <Link
                  href="/distributor/calculators/goal"
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition-all duration-200 ${pathname === "/distributor/calculators/goal" ? "bg-white text-distributor-700 ring-1 ring-distributor-100" : "text-slate-500 hover:text-distributor-600 hover:bg-white/50"}`}
                >
                  <Target className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold">Goal Planner</span>
                </Link>
                <Link
                  href="/distributor/calculators/fd"
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition-all duration-200 ${pathname === "/distributor/calculators/fd" ? "bg-white text-distributor-700 ring-1 ring-distributor-100" : "text-slate-500 hover:text-distributor-600 hover:bg-white/50"}`}
                >
                  <PiggyBank className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold">FD Calculator</span>
                </Link>
                <Link
                  href="/distributor/calculators/swp"
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition-all duration-200 ${pathname === "/distributor/calculators/swp" ? "bg-white text-distributor-700 ring-1 ring-distributor-100" : "text-slate-500 hover:text-distributor-600 hover:bg-white/50"}`}
                >
                  <TrendingDown className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold">SWP Calculator</span>
                </Link>
                <Link
                  href="/distributor/calculators/stp"
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition-all duration-200 ${pathname === "/distributor/calculators/stp" ? "bg-white text-distributor-700 ring-1 ring-distributor-100" : "text-slate-500 hover:text-distributor-600 hover:bg-white/50"}`}
                >
                  <ArrowRightLeft className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold">STP Calculator</span>
                </Link>
                <Link
                  href="/distributor/calculators/reverse-emi"
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition-all duration-200 ${pathname === "/distributor/calculators/reverse-emi" ? "bg-white text-distributor-700 ring-1 ring-distributor-100" : "text-slate-500 hover:text-distributor-600 hover:bg-white/50"}`}
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
          className={`p-4 mt-auto border-t border-slate-100 bg-white/50 flex ${isCollapsed ? "flex-col items-center gap-3" : "items-center gap-2"} shrink-0`}
        >
          {/* Settings Icon */}
          <Link
            href="/distributor/settings"
            title="Settings"
            className="p-2.5 text-slate-400 hover:text-distributor-600 hover:bg-distributor-50 rounded-lg transition-colors group shrink-0"
          >
            <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform duration-500" />
          </Link>

          {/* Collapse Icon */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
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
            className={`${isCollapsed ? "w-full flex justify-center" : "flex-1 min-w-0"}`}
          >
            {isCollapsed ? (
              <Link
                href="/distributor-portal"
                title="Sign Out"
                className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center justify-center"
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
              <LogoutButton portal="staff" redirectTo="/distributor-portal" />
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
