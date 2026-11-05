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
  Lock,
  Layers,
  PieChart,
  Wallet,
} from "lucide-react";
import { MOCK_ROLES } from "@/lib/mockDatabase";
import { setAuthCookies } from "@/lib/authClient";
import InvestorFluidBackground from "@/components/layouts/InvestorFluidBackground";
import { primeThemeCache } from "@/lib/primeThemeCache";

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string>("investor");
  const [isRedirecting, setIsRedirecting] = useState<string | null>(null);

  const handleSelectRole = async (roleKey: "admin" | "distributor" | "investor") => {
    setIsRedirecting(roleKey);
    setSelectedRole(roleKey);
    const session = MOCK_ROLES[roleKey];

    if (typeof window !== "undefined") {
      sessionStorage.setItem("finiq_mock_user", JSON.stringify(session));
      sessionStorage.setItem("finiq_current_role", roleKey);
      if (session.company_id) {
        localStorage.setItem("company_id", session.company_id);
      }
      // Populate auth cookies for consistent session reads across layouts
      setAuthCookies(
        session.token,
        "mock_refresh_token_demo",
        roleKey === "investor" ? "investor" : "staff",
        session.user_id,
      );
      // Prime theme cache with the original platform theme
      await primeThemeCache();
    }

    const destinations = {
      admin: "/admin",
      distributor: "/distributor",
      investor: "/investor",
    };

    setTimeout(() => {
      router.push(destinations[roleKey]);
    }, 250);
  };

  return (
    <div className="min-h-screen bg-[var(--fin-page-bg)] font-sans selection:bg-[var(--fin-brand-500)]/20 selection:text-[var(--fin-brand-700)] relative flex items-center justify-center overflow-x-hidden">
      {/* ─── NATIVE AMBIENCE & GRADIENT FOUNDATION ─── */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[var(--fin-page-bg)] via-[var(--fin-content-surface)] to-[var(--fin-skeleton-base)]" />
      <div className="absolute inset-0 z-0 opacity-[0.35] bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px] sm:[background-size:32px_32px] pointer-events-none" />

      {/* Fluid Interactive Canvas from Original Brand */}
      <div
        className="absolute top-0 left-0 w-full lg:w-[65%] h-full opacity-[0.85] pointer-events-none z-0"
        style={{
          maskImage: "linear-gradient(to right, black 40%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, black 40%, transparent 100%)",
        }}
      >
        <InvestorFluidBackground />
      </div>

      <div className="absolute -top-40 -left-40 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-[var(--fin-brand-500)]/20 rounded-full blur-[80px] sm:blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-0 right-0 w-[500px] sm:w-[800px] h-[500px] sm:h-[800px] bg-[var(--fin-brand-600)]/15 rounded-full blur-[100px] sm:blur-[120px] pointer-events-none z-0" />

      {/* Top Navbar */}
      <header className="absolute top-0 left-0 right-0 z-30 w-full max-w-[1600px] mx-auto px-6 sm:px-12 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--fin-brand-600)] to-[var(--fin-brand-800)] flex items-center justify-center shadow-lg shadow-[var(--fin-brand-900)]/20">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-[var(--fin-heading-primary)]">
              FinIQ
            </span>
            <span className="ml-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[var(--fin-brand-100)] text-[var(--fin-brand-700)] border border-[var(--fin-brand-200)] rounded-full">
              Demo Suite
            </span>
          </div>
        </div>

        <Link
          href="/architecture"
          className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--fin-table-bg)] hover:bg-[var(--fin-brand-50)] border border-[var(--fin-border)] text-xs font-semibold text-[var(--fin-brand-700)] transition-all shadow-sm hover:border-[var(--fin-brand-400)]"
        >
          <Server className="w-4 h-4 text-[var(--fin-brand-600)] group-hover:scale-110 transition-transform" />
          <span>Backend Architecture Documentary</span>
          <ArrowRight className="w-3.5 h-3.5 text-[var(--fin-brand-400)] group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </header>

      {/* ─── MAIN CONTENT CONTAINER ─── */}
      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 sm:px-12 lg:px-20 py-24 sm:py-28 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">
        
        {/* ─── LEFT COLUMN: HERO NARRATIVE & 3D FLOATING FEATURES ─── */}
        <div className="w-full lg:w-3/5 flex flex-col justify-center items-center md:items-start text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--fin-brand-100)] border border-[var(--fin-brand-200)] text-[var(--fin-brand-700)] text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[var(--fin-brand-600)]" />
            <span>Interactive Portfolio & Wealth Tech Demo</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-[var(--fin-heading-primary)] leading-[1.1] mb-6">
            Wealth Intelligence, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--fin-brand-600)] via-[var(--fin-brand-700)] to-[var(--fin-brand-900)]">
              Engineered.
            </span>
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-[var(--fin-muted-text)] font-medium max-w-xl leading-relaxed mb-10">
            A comprehensive, institutional-grade financial portfolio management platform engineered with multi-tier brokerage hierarchies, automated FIFO capital gains calculations, and high-precision telemetry.
          </p>

          {/* 3D Floating Feature Perspective Badges (from Original Project) */}
          <div className="hidden sm:grid grid-cols-3 gap-4 w-full max-w-xl">
            <div className="p-4 rounded-xl bg-[var(--fin-table-bg)] border border-[var(--fin-border)] shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-[var(--fin-brand-100)] flex items-center justify-center text-[var(--fin-brand-600)] mb-2">
                <PieChart className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-[var(--fin-heading-primary)]">Portfolio Engine</p>
              <p className="text-[11px] text-[var(--fin-muted-text)]">Live NAV tracking & asset allocation</p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--fin-table-bg)] border border-[var(--fin-border)] shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-[var(--fin-brand-100)] flex items-center justify-center text-[var(--fin-brand-600)] mb-2">
                <Layers className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-[var(--fin-heading-primary)]">FIFO Tax Engine</p>
              <p className="text-[11px] text-[var(--fin-muted-text)]">STCG & LTCG capital gains calculation</p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--fin-table-bg)] border border-[var(--fin-border)] shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-[var(--fin-brand-100)] flex items-center justify-center text-[var(--fin-brand-600)] mb-2">
                <Users className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-[var(--fin-heading-primary)]">Multi-Tier Hierarchy</p>
              <p className="text-[11px] text-[var(--fin-muted-text)]">Sub-broker commission distribution</p>
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN: FROSTED GLASS ROLE SELECTOR CARD ─── */}
        <div className="w-full lg:w-2/5 flex justify-center lg:justify-end relative z-20">
          <div
            className="w-full max-w-[460px] bg-[var(--fin-table-bg)]/95 backdrop-blur-3xl border border-[var(--fin-border)] shadow-[0_30px_80px_-15px_rgba(0,0,0,0.12)] rounded-[2.5rem] p-6 sm:p-8 lg:p-10 relative overflow-hidden"
            style={{ animation: "slideFadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--fin-brand-600)] to-transparent opacity-80" />

            <div className="mb-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--fin-brand-50)] text-[var(--fin-brand-700)] border border-[var(--fin-brand-200)] text-[10px] font-bold uppercase tracking-wider mb-2">
                One-Click Instant Access
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--fin-heading-primary)]">
                Select Portal Role
              </h2>
              <p className="text-xs sm:text-sm text-[var(--fin-body-text)] font-medium mt-1">
                Experience full functionality across all three platform access tiers.
              </p>
            </div>

            {/* Role Options */}
            <div className="space-y-3.5 mb-6">
              {/* Investor Role */}
              <button
                type="button"
                onClick={() => handleSelectRole("investor")}
                disabled={isRedirecting !== null}
                className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-start gap-4 group relative overflow-hidden ${
                  selectedRole === "investor"
                    ? "bg-[var(--fin-brand-50)] border-[var(--fin-brand-600)] shadow-md shadow-[var(--fin-brand-600)]/10"
                    : "bg-[var(--fin-table-bg)] border-[var(--fin-border)] hover:border-[var(--fin-brand-400)] hover:bg-[var(--fin-brand-50)]/50"
                }`}
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shrink-0 shadow-md shadow-emerald-500/20">
                  <Wallet className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[var(--fin-heading-primary)]">
                      Investor Portal
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Portfolio ₹1.85 Cr
                    </span>
                  </div>
                  <p className="text-xs text-[var(--fin-muted-text)] mt-0.5">
                    Aarav Mehta • Holdings, Capital Gains FIFO & SIPs
                  </p>
                </div>
                {isRedirecting === "investor" ? (
                  <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0 self-center" />
                ) : (
                  <ArrowRight className="w-4 h-4 text-[var(--fin-brand-400)] group-hover:text-[var(--fin-brand-600)] group-hover:translate-x-0.5 transition-all shrink-0 self-center" />
                )}
              </button>

              {/* Distributor Role */}
              <button
                type="button"
                onClick={() => handleSelectRole("distributor")}
                disabled={isRedirecting !== null}
                className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-start gap-4 group relative overflow-hidden ${
                  selectedRole === "distributor"
                    ? "bg-[var(--fin-brand-50)] border-[var(--fin-brand-600)] shadow-md shadow-[var(--fin-brand-600)]/10"
                    : "bg-[var(--fin-table-bg)] border-[var(--fin-border)] hover:border-[var(--fin-brand-400)] hover:bg-[var(--fin-brand-50)]/50"
                }`}
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[var(--fin-brand-600)] to-[var(--fin-brand-800)] flex items-center justify-center text-white shrink-0 shadow-md shadow-[var(--fin-brand-600)]/20">
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[var(--fin-heading-primary)]">
                      Distributor Hub
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[var(--fin-brand-100)] text-[var(--fin-brand-800)] border border-[var(--fin-brand-200)]">
                      AUM ₹24.5 Cr
                    </span>
                  </div>
                  <p className="text-xs text-[var(--fin-muted-text)] mt-0.5">
                    Rajesh Sharma • 18 HNI Clients & Sub-broker Hierarchy
                  </p>
                </div>
                {isRedirecting === "distributor" ? (
                  <div className="w-4 h-4 border-2 border-[var(--fin-brand-600)] border-t-transparent rounded-full animate-spin shrink-0 self-center" />
                ) : (
                  <ArrowRight className="w-4 h-4 text-[var(--fin-brand-400)] group-hover:text-[var(--fin-brand-600)] group-hover:translate-x-0.5 transition-all shrink-0 self-center" />
                )}
              </button>

              {/* Admin Role */}
              <button
                type="button"
                onClick={() => handleSelectRole("admin")}
                disabled={isRedirecting !== null}
                className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-start gap-4 group relative overflow-hidden ${
                  selectedRole === "admin"
                    ? "bg-[var(--fin-brand-50)] border-[var(--fin-brand-600)] shadow-md shadow-[var(--fin-brand-600)]/10"
                    : "bg-[var(--fin-table-bg)] border-[var(--fin-border)] hover:border-[var(--fin-brand-400)] hover:bg-[var(--fin-brand-50)]/50"
                }`}
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-800 flex items-center justify-center text-white shrink-0 shadow-md shadow-purple-600/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[var(--fin-heading-primary)]">
                      SuperAdmin Portal
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                      Audit & Telemetry
                    </span>
                  </div>
                  <p className="text-xs text-[var(--fin-muted-text)] mt-0.5">
                    Alex Morgan • Tenant Health, Audits & Theming
                  </p>
                </div>
                {isRedirecting === "admin" ? (
                  <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin shrink-0 self-center" />
                ) : (
                  <ArrowRight className="w-4 h-4 text-[var(--fin-brand-400)] group-hover:text-[var(--fin-brand-600)] group-hover:translate-x-0.5 transition-all shrink-0 self-center" />
                )}
              </button>
            </div>

            {/* Architecture Link & Security Badge */}
            <div className="pt-4 border-t border-[var(--fin-border)] flex flex-col items-center gap-3">
              <Link
                href="/architecture"
                className="w-full py-2.5 px-4 rounded-xl bg-[var(--fin-brand-50)] hover:bg-[var(--fin-brand-100)] border border-[var(--fin-brand-200)] flex items-center justify-center gap-2 text-xs font-bold text-[var(--fin-brand-700)] transition-colors"
              >
                <Server className="w-4 h-4 text-[var(--fin-brand-600)]" />
                <span>Explore Backend Architecture Documentary</span>
              </Link>

              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--fin-muted-text)] uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Fictional Dummy Data • Zero Real PAN/PII</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes slideFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes shine {
          0%   { left: -100%; }
          20%  { left: 200%; }
          100% { left: 200%; }
        }
      `,
        }}
      />
    </div>
  );
}
