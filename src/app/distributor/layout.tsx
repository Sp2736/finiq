"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/distributor/Sidebar";
import { ThemeProvider } from "@/context/ThemeContext";
import { MOCK_ROLES } from "@/lib/mockDatabase";
import { setAuthCookies } from "@/lib/authClient";

export default function DistributorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Ensure mock distributor session exists so direct URL visits / reloads never break
    try {
      const existing = sessionStorage.getItem("finiq_mock_user");
      if (!existing) {
        const session = MOCK_ROLES.distributor;
        sessionStorage.setItem("finiq_mock_user", JSON.stringify(session));
        sessionStorage.setItem("finiq_current_role", "distributor");
        if (session.company_id) {
          localStorage.setItem("company_id", session.company_id);
        }
        setAuthCookies(session.token, "mock_refresh_token_staff", "staff", session.user_id);
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
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Initializing Distributor Workspace...</span>
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
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

        <main
          className={`flex-1 relative transition-all duration-300 ease-in-out h-screen overflow-hidden
          ${isCollapsed ? "lg:ml-24" : "lg:ml-72"}`}
        >
          <div className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay" />
          <div className="w-full h-full max-w-[1600px] mx-auto p-4 sm:p-5 md:p-6 lg:p-8 flex flex-col relative z-10">
            {children}
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}
