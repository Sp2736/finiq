"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Users,
  ShieldCheck,
  Server,
  ArrowRight,
  Lock,
  Wallet,
} from "lucide-react";
import InvestorFluidBackground from "@/components/layouts/InvestorFluidBackground";
import { MOCK_ROLES } from "@/lib/mockDatabase";
import { setAuthCookies } from "@/lib/authClient";
import { primeThemeCache } from "@/lib/primeThemeCache";

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string>("investor");
  const [isRedirecting, setIsRedirecting] = useState<string | null>(null);

  // Clean up any stale/outdated slate theme cache from previous iterations
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("finiq_active_theme");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (
            parsed.theme_name === "FinIQ Modern Slate" ||
            parsed.active_theme_id === "th-slate-01" ||
            parsed.theme_variables?.["--fin-page-bg"] === "#0f172a"
          ) {
            localStorage.removeItem("finiq_active_theme");
            document.documentElement.style.cssText = "";
            Array.from(document.documentElement.style).forEach((prop) => {
              if (prop.startsWith("--fin-")) {
                document.documentElement.style.removeProperty(prop);
              }
            });
          }
        } catch (_) {}
      }
    }
  }, []);

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
      setAuthCookies(
        session.token,
        "mock_refresh_token_demo",
        roleKey === "investor" ? "investor" : "staff",
        session.user_id,
      );
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

      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 sm:px-12 lg:px-20 py-10 lg:py-16 flex flex-col lg:flex-row items-center justify-between gap-10 md:gap-12 lg:gap-20">
        {/* ─── LEFT COLUMN: GRAPHICS & TEXT (ORIGINAL FINIQ HERO & 3D STACK) ─── */}
        <div className="w-full lg:w-3/5 flex flex-col justify-center items-center md:items-start">
          <div className="inline-flex items-center justify-center lg:justify-start gap-3 mb-6 lg:mb-8">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md bg-gradient-to-br from-[var(--fin-brand-500)] to-[var(--fin-brand-700)] flex items-center justify-center shadow-lg shadow-[var(--fin-brand-600)]/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-[var(--fin-table-bg)]/30 transform -skew-x-12 -translate-x-full animate-[shine_4s_infinite]" />
              <svg
                className="w-6 h-6 sm:w-7 sm:h-7 text-[var(--fin-btn-primary-text)] relative z-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <div className="text-3xl sm:text-4xl lg:text-3xl font-black tracking-tight text-[var(--fin-heading-primary)]">
              FinIQ{" "}
              <span className="text-[var(--fin-brand-600)] font-light">
                | Demo Suite
              </span>
            </div>
          </div>

          <div className="hidden md:block w-full">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-[var(--fin-heading-primary)] leading-[1.1] mb-4 sm:mb-6">
              Financial Edge, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--fin-brand-500)] via-[var(--fin-brand-600)] to-[var(--fin-brand-400)]">
                Refined.
              </span>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-[var(--fin-body-text)] font-medium max-w-xl leading-relaxed mb-8 sm:mb-12">
              The exclusive platform built for investors and distributors to manage, analyze,
              and scale portfolios with absolute precision.
            </p>

            {/* 3D Perspective Visual Stack (Original Project Element) */}
            <div className="relative w-full max-w-lg h-48 sm:h-64 perspective-1000">
              <div className="absolute top-6 sm:top-10 left-6 sm:left-10 w-full h-40 sm:h-48 bg-[var(--fin-table-bg)]/80 border-2 border-[var(--fin-border-subtle)] rounded-3xl transform rotate-x-12 -rotate-y-12 rotate-z-6 shadow-2xl backdrop-blur-md p-6 overflow-hidden">
                <svg
                  className="w-full h-full opacity-60 text-[var(--fin-brand-500)]"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <pattern
                    id="grid"
                    width="10"
                    height="10"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 10 0 L 0 0 0 10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                    />
                  </pattern>
                  <rect width="100" height="100" fill="url(#grid)" />
                </svg>
              </div>

              <div className="absolute top-0 left-0 w-[90%] h-32 sm:h-40 bg-[var(--fin-table-bg)]/90 border-2 border-[var(--fin-border-subtle)] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] rounded-3xl transform rotate-x-12 -rotate-y-12 rotate-z-6 backdrop-blur-xl p-4 sm:p-6 flex flex-col justify-between overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-[var(--fin-brand-500)]/15 to-transparent opacity-100" />
                <div className="flex justify-between items-center relative z-10">
                  <div className="h-2.5 w-16 sm:w-20 bg-[var(--fin-heading-primary)]/80 rounded-full" />
                  <div className="flex gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--fin-badge-success-text)] animate-pulse shadow-[0_0_12px_var(--fin-badge-success-text)]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--fin-heading-primary)]" />
                  </div>
                </div>
                <div className="w-[120%] -ml-[10%] h-16 sm:h-20 relative z-10">
                  <svg
                    viewBox="0 0 200 50"
                    className="w-full h-full overflow-visible"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0,25 C30,10 50,40 80,25 C110,10 140,45 170,25 C190,15 200,25 200,25"
                      fill="none"
                      stroke="url(#wave-grad)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      className="drop-shadow-[0_8px_8px_var(--fin-brand-500)] transition-all duration-1000 group-hover:stroke-[var(--fin-brand-500)]"
                    />
                    <defs>
                      <linearGradient
                        id="wave-grad"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        <stop
                          offset="0%"
                          stopColor="var(--fin-brand-500)"
                          stopOpacity="0.5"
                        />
                        <stop
                          offset="50%"
                          stopColor="var(--fin-brand-500)"
                          stopOpacity="1"
                        />
                        <stop
                          offset="100%"
                          stopColor="var(--fin-brand-500)"
                          stopOpacity="0.5"
                        />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

              <div className="absolute -top-4 sm:-top-6 right-0 sm:right-8 bg-[var(--fin-table-bg)] border-2 border-[var(--fin-border-subtle)] rounded-md shadow-xl shadow-[0_8px_24px_var(--fin-modal-shadow)] p-3 sm:p-4 transform rotate-x-12 -rotate-y-12 rotate-z-6 animate-[float_6s_ease-in-out_infinite]">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[var(--fin-badge-success-bg)] flex items-center justify-center border border-[var(--fin-badge-success-border)]">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--fin-badge-success-text)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[9px] sm:text-[10px] font-extrabold text-[var(--fin-aux-text)] uppercase tracking-wider">
                      Demo Suite
                    </p>
                    <p className="text-xs sm:text-sm font-extrabold text-[var(--fin-heading-primary)]">
                      Instant Access
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN: LOGIN CARD (ORIGINAL FROSTED SHELL WITH ROLE SELECTOR) ─── */}
        <div className="w-full lg:w-2/5 flex justify-center lg:justify-end relative z-20">
          <div
            className="w-full max-w-[440px] md:max-w-[500px] lg:max-w-[440px] bg-[var(--fin-table-bg)]/95 backdrop-blur-3xl border border-[var(--fin-border-subtle)] shadow-[0_30px_80px_-15px_rgba(0,0,0,0.15)] rounded-[2.5rem] p-6 sm:p-10 lg:p-12 relative overflow-hidden"
            style={{ animation: "slideFadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--fin-brand-600)] to-transparent opacity-80" />

            <div style={{ animation: "fadeIn 0.4s ease-out forwards" }}>
              <div className="mb-6 sm:mb-8 text-center lg:text-left">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--fin-heading-primary)] mb-2">
                  Welcome to FinIQ
                </h2>
                <p className="text-sm text-[var(--fin-body-text)] font-medium">
                  Select a portal role below to explore the interactive live demo.
                </p>
              </div>

              {/* 3 Role Selection Cards */}
              <div className="space-y-3.5 mb-6">
                {/* Investor Role */}
                <button
                  type="button"
                  onClick={() => handleSelectRole("investor")}
                  disabled={isRedirecting !== null}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between group ${
                    selectedRole === "investor"
                      ? "bg-[var(--fin-brand-50)] border-[var(--fin-brand-600)] shadow-sm"
                      : "bg-[var(--fin-content-surface)] border-[var(--fin-border)] hover:border-[var(--fin-brand-400)] hover:bg-[var(--fin-brand-50)]/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--fin-brand-100)] text-[var(--fin-brand-700)] flex items-center justify-center shrink-0">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[var(--fin-heading-primary)]">
                          Investor Portal
                        </span>
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ₹1.85 Cr
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--fin-muted-text)] mt-0.5">
                        Aarav Mehta • Holdings & FIFO Taxes
                      </p>
                    </div>
                  </div>
                  {isRedirecting === "investor" ? (
                    <div className="w-4 h-4 border-2 border-[var(--fin-brand-600)] border-t-transparent rounded-full animate-spin shrink-0" />
                  ) : (
                    <ArrowRight className="w-4 h-4 text-[var(--fin-brand-400)] group-hover:text-[var(--fin-brand-600)] group-hover:translate-x-0.5 transition-all shrink-0" />
                  )}
                </button>

                {/* Distributor Role */}
                <button
                  type="button"
                  onClick={() => handleSelectRole("distributor")}
                  disabled={isRedirecting !== null}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between group ${
                    selectedRole === "distributor"
                      ? "bg-[var(--fin-brand-50)] border-[var(--fin-brand-600)] shadow-sm"
                      : "bg-[var(--fin-content-surface)] border-[var(--fin-border)] hover:border-[var(--fin-brand-400)] hover:bg-[var(--fin-brand-50)]/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--fin-brand-100)] text-[var(--fin-brand-700)] flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[var(--fin-heading-primary)]">
                          Distributor Hub
                        </span>
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-[var(--fin-brand-100)] text-[var(--fin-brand-800)] border border-[var(--fin-brand-200)]">
                          ₹24.5 Cr
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--fin-muted-text)] mt-0.5">
                        Rajesh Sharma • 18 HNI Clients
                      </p>
                    </div>
                  </div>
                  {isRedirecting === "distributor" ? (
                    <div className="w-4 h-4 border-2 border-[var(--fin-brand-600)] border-t-transparent rounded-full animate-spin shrink-0" />
                  ) : (
                    <ArrowRight className="w-4 h-4 text-[var(--fin-brand-400)] group-hover:text-[var(--fin-brand-600)] group-hover:translate-x-0.5 transition-all shrink-0" />
                  )}
                </button>

                {/* Admin Role */}
                <button
                  type="button"
                  onClick={() => handleSelectRole("admin")}
                  disabled={isRedirecting !== null}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between group ${
                    selectedRole === "admin"
                      ? "bg-[var(--fin-brand-50)] border-[var(--fin-brand-600)] shadow-sm"
                      : "bg-[var(--fin-content-surface)] border-[var(--fin-border)] hover:border-[var(--fin-brand-400)] hover:bg-[var(--fin-brand-50)]/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--fin-brand-100)] text-[var(--fin-brand-700)] flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[var(--fin-heading-primary)]">
                          SuperAdmin
                        </span>
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-200">
                          Telemetry
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--fin-muted-text)] mt-0.5">
                        Alex Morgan • Audits & Health
                      </p>
                    </div>
                  </div>
                  {isRedirecting === "admin" ? (
                    <div className="w-4 h-4 border-2 border-[var(--fin-brand-600)] border-t-transparent rounded-full animate-spin shrink-0" />
                  ) : (
                    <ArrowRight className="w-4 h-4 text-[var(--fin-brand-400)] group-hover:text-[var(--fin-brand-600)] group-hover:translate-x-0.5 transition-all shrink-0" />
                  )}
                </button>
              </div>

              {/* Architecture Link */}
              <div className="pt-4 border-t border-[var(--fin-border)] flex flex-col items-center gap-3">
                <Link
                  href="/architecture"
                  className="w-full py-2.5 px-4 rounded-xl bg-[var(--fin-brand-50)] hover:bg-[var(--fin-brand-100)] border border-[var(--fin-brand-200)] flex items-center justify-center gap-2 text-xs font-bold text-[var(--fin-brand-700)] transition-colors"
                >
                  <Server className="w-4 h-4 text-[var(--fin-brand-600)]" />
                  <span>Backend Architecture Documentary</span>
                </Link>
              </div>
            </div>

            {/* Footer with Security Badge */}
            <div className="mt-6 pt-4 border-t border-[var(--fin-border)]/80 flex flex-col items-center justify-center gap-2">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-[var(--fin-muted-text)] uppercase tracking-widest">
                <svg
                  className="w-4 h-4 text-[var(--fin-badge-success-text)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <span>End-to-End Encrypted Simulation</span>
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
        @keyframes float {
          0%, 100% { transform: translateY(0)     rotateX(12deg) rotateY(-12deg) rotateZ(6deg); }
          50%       { transform: translateY(-10px) rotateX(12deg) rotateY(-12deg) rotateZ(6deg); }
        }
        .perspective-1000 { perspective: 1000px; }
      `,
        }}
      />
    </div>
  );
}
