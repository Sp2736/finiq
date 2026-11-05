"use client";

import React, { useEffect, useState } from "react";
import { ThemeProvider } from "@/context/ThemeContext";
import InvestorSidebar from "@/components/investor/InvestorSidebar";
import { MOCK_ROLES } from "@/lib/mockDatabase";
import { setAuthCookies } from "@/lib/authClient";

export default function InvestorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Ensure mock investor session exists so direct URL visits / reloads never break
    try {
      const existing = sessionStorage.getItem("finiq_mock_user");
      if (!existing) {
        const session = MOCK_ROLES.investor;
        sessionStorage.setItem("finiq_mock_user", JSON.stringify(session));
        sessionStorage.setItem("finiq_current_role", "investor");
        if (session.company_id) {
          localStorage.setItem("company_id", session.company_id);
        }
        setAuthCookies(session.token, undefined, "investor", session.user_id);
      }
    } catch (e) {
      console.warn("Storage check exception:", e);
    }
    setIsReady(true);
  }, []);

  if (!isReady) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--fin-page-bg,#0a0f1d)] text-slate-400 text-sm">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span>Initializing Portfolio Workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div
        className="flex h-screen overflow-hidden selection:bg-[var(--fin-brand-100)] selection:text-[var(--fin-brand-900)]"
        style={{ backgroundColor: "var(--fin-page-bg)" }}
      >
        <InvestorSidebar />

        <main className="flex-1 relative h-screen overflow-hidden">
          <div className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay" />
          <div className="w-full h-full max-w-[1700px] mx-auto flex flex-col relative z-10 overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}
