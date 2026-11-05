"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  TrendingUp,
  Users,
  ShieldCheck,
  Server,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Database,
  Cpu,
  Layers,
  Lock,
} from "lucide-react";
import { MOCK_ROLES, MockUserSession } from "@/lib/mockDatabase";
import { setAuthCookies } from "@/lib/authClient";
import InvestorFluidBackground from "@/components/layouts/InvestorFluidBackground";
import RoleSelector from "@/components/layouts/RoleSelector";

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string>("investor");
  const [isRedirecting, setIsRedirecting] = useState<string | null>(null);

  const handleSelectRole = (roleKey: "admin" | "distributor" | "investor") => {
    setIsRedirecting(roleKey);
    const session = MOCK_ROLES[roleKey];

    if (typeof window !== "undefined") {
      sessionStorage.setItem("finiq_mock_user", JSON.stringify(session));
      sessionStorage.setItem("finiq_current_role", roleKey);
      if (session.company_id) {
        localStorage.setItem("company_id", session.company_id);
      }
      // Populate auth cookies so legacy token readers stay functional
      setAuthCookies(
        session.token,
        "mock_refresh_token_demo",
        roleKey === "investor" ? "investor" : "staff",
        session.user_id,
      );
    }

    const destinations = {
      admin: "/admin",
      distributor: "/distributor",
      investor: "/investor",
    };

    setTimeout(() => {
      router.push(destinations[roleKey]);
    }, 200);
  };

  return (
    <div className="min-h-screen bg-[var(--fin-page-bg,#0a0f1d)] text-[var(--fin-heading-primary,#f8fafc)] font-sans relative flex flex-col justify-between overflow-x-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[var(--fin-page-bg,#0f172a)] via-[var(--fin-content-surface,#1e293b)] to-[var(--fin-page-bg,#0a0f1d)]" />
      <div className="absolute inset-0 z-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Top Navbar */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              FinIQ
            </span>
            <span className="ml-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full">
              Demo Suite
            </span>
          </div>
        </div>

        <Link
          href="/architecture"
          className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs font-semibold text-slate-200 transition-all shadow-sm hover:border-blue-500/50"
        >
          <Server className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
          <span>Backend Architecture</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 py-10 lg:py-16 flex-1 flex flex-col items-center justify-center">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Portfolio & Wealth Tech Demo</span>
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-6">
            Explore FinIQ with <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-teal-300 bg-clip-text text-transparent">
              Simulated Live Workflows
            </span>
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Choose a system role below to launch directly into an active,
            data-populated session. Under the hood, browser-side interception simulates
            all NestJS endpoints with zero backend dependencies.
          </p>
        </div>

        {/* 3 Prominent Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
          {/* 1. INVESTOR ROLE CARD */}
          <div
            onClick={() => handleSelectRole("investor")}
            className={`group relative flex flex-col justify-between p-7 rounded-3xl bg-slate-900/70 hover:bg-slate-900/90 border transition-all duration-300 cursor-pointer overflow-hidden ${
              selectedRole === "investor"
                ? "border-emerald-500/50 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500/30"
                : "border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Investor Portal
                </span>
              </div>

              <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                High-Net-Worth Investor
              </h2>
              <p className="text-xs text-slate-400 font-medium mb-5">
                Simulated Persona:{" "}
                <span className="text-slate-200 font-semibold">Aarav Mehta</span>{" "}
                (₹54.80 L AUM across 6 Funds)
              </p>

              <div className="space-y-2.5 pt-4 border-t border-slate-800/80 mb-8">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Real-time NAV & Asset Allocation Table</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Capital Gains (FIFO STCG/LTCG engine)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Active Systematic Flows (SIP, STP, SWP)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>1-Click PDF Report Export & Valuation</span>
                </div>
              </div>
            </div>

            <button
              disabled={isRedirecting !== null}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 group-hover:gap-3 transition-all"
            >
              <span>{isRedirecting === "investor" ? "Loading Dashboard..." : "Enter Investor Portal"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* 2. DISTRIBUTOR ROLE CARD */}
          <div
            onClick={() => handleSelectRole("distributor")}
            className={`group relative flex flex-col justify-between p-7 rounded-3xl bg-slate-900/70 hover:bg-slate-900/90 border transition-all duration-300 cursor-pointer overflow-hidden ${
              selectedRole === "distributor"
                ? "border-blue-500/50 shadow-xl shadow-blue-500/10 ring-1 ring-blue-500/30"
                : "border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Distributor Portal
                </span>
              </div>

              <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                Principal Wealth Distributor
              </h2>
              <p className="text-xs text-slate-400 font-medium mb-5">
                Simulated Persona:{" "}
                <span className="text-slate-200 font-semibold">Rajesh Sharma</span>{" "}
                (ARN-84920 | ₹3.13 Cr AUM)
              </p>

              <div className="space-y-2.5 pt-4 border-t border-slate-800/80 mb-8">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Multi-tier Sub-Broker Hierarchy & Splits</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Client Directory (18+ Simulated Investors)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Escrow Bank Accounts & Settlement Ledger</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Investor-to-Broker Interactive Mapping</span>
                </div>
              </div>
            </div>

            <button
              disabled={isRedirecting !== null}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 group-hover:gap-3 transition-all"
            >
              <span>{isRedirecting === "distributor" ? "Loading Dashboard..." : "Enter Distributor Portal"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* 3. ADMIN ROLE CARD */}
          <div
            onClick={() => handleSelectRole("admin")}
            className={`group relative flex flex-col justify-between p-7 rounded-3xl bg-slate-900/70 hover:bg-slate-900/90 border transition-all duration-300 cursor-pointer overflow-hidden ${
              selectedRole === "admin"
                ? "border-purple-500/50 shadow-xl shadow-purple-500/10 ring-1 ring-purple-500/30"
                : "border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  Admin Control
                </span>
              </div>

              <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                System Administrator
              </h2>
              <p className="text-xs text-slate-400 font-medium mb-5">
                Simulated Persona:{" "}
                <span className="text-slate-200 font-semibold">Alex Morgan</span>{" "}
                (Infrastructure & Theme Engine)
              </p>

              <div className="space-y-2.5 pt-4 border-t border-slate-800/80 mb-8">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Real-time System Audit & Ingestion Logs</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Database Pool & Redis Cache Telemetry</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Dynamic CSS Variable Theme Manager</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>BullMQ Asynchronous Job Worker Monitor</span>
                </div>
              </div>
            </div>

            <button
              disabled={isRedirecting !== null}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 group-hover:gap-3 transition-all"
            >
              <span>{isRedirecting === "admin" ? "Loading Dashboard..." : "Enter Admin Portal"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Technical Architecture Banner */}
        <div className="mt-12 w-full max-w-6xl p-6 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-850 to-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white mb-1">
                Evaluating Full-Stack Architecture?
              </h3>
              <p className="text-xs text-slate-400">
                Explore the technical deep-dive into the NestJS backend, BullMQ processing queues, FIFO tax algorithms, and PostgreSQL schema.
              </p>
            </div>
          </div>
          <Link
            href="/architecture"
            className="shrink-0 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-2"
          >
            <span>Explore Backend Architecture</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-6 py-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div>
          FinIQ Portfolio Management System • Demo Showcase Edition
        </div>
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Client Simulation Active
          </span>
          <span>100% Mock Data Guaranteed</span>
        </div>
      </footer>
    </div>
  );
}
