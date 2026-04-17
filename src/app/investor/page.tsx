"use client";

import React, { useState, useMemo } from 'react';
import { UnifiedFund } from "@/types/investor";
import LogoutButton from "@/components/investor/LogoutButton";
import { usePortfolio } from "@/hooks/usePortfolio"; // <-- Import the new hook

// Desktop Components
import GlobalStatsRibbon from "@/components/investor/GlobalStatsRibbon";
import FilterBar from "@/components/investor/FilterBar";
import DesktopFundTable from "@/components/investor/DesktopFundTable";

// Mobile Components
import MobileHoldings from "@/components/investor/MobileHoldings";
import MobileFundDetails from "@/components/investor/MobileFundDetails";

export default function UnifiedPortfolioApp() {
  // --- REAL DATA FETCHING ---
  const { portfolio, isLoading, error } = usePortfolio();

  // --- SHARED STATE ---
  const [activeFilterType, setActiveFilterType] = useState<string>("All");
  const [activeFilterValue, setActiveFilterValue] = useState<string>("All");

  // --- MOBILE SPECIFIC STATE ---
  const [mobileActiveScreen, setMobileActiveScreen] = useState<'holdings' | 'fund_details'>('holdings');
  const [mobileSelectedFund, setMobileSelectedFund] = useState<UnifiedFund | null>(null);

  // --- FILTER LOGIC (Updated for dynamic data) ---
  const filterOptions = useMemo(() => {
    const options = new Set<string>();
    if (portfolio?.funds) {
      portfolio.funds.forEach(fund => {
        if (activeFilterType === "Category/Industry") options.add(fund.category);
        if (activeFilterType === "AMC/Issuer") options.add(fund.amc);
        if (activeFilterType === "Tag" && fund.statusTag) options.add(fund.statusTag);
      });
    }
    return Array.from(options);
  }, [activeFilterType, portfolio]);

  const filteredFunds = useMemo(() => {
    if (!portfolio?.funds) return [];
    return portfolio.funds.filter(fund => {
      if (activeFilterType === "All" || activeFilterValue === "All") return true;
      if (activeFilterType === "Category/Industry") return fund.category === activeFilterValue;
      if (activeFilterType === "AMC/Issuer") return fund.amc === activeFilterValue;
      if (activeFilterType === "Tag") return fund.statusTag === activeFilterValue;
      return true;
    });
  }, [activeFilterType, activeFilterValue, portfolio]);

  // --- RENDER: LOADING STATE ---
  if (isLoading) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-bold text-sm tracking-wide uppercase">Decrypting Portfolio...</p>
      </div>
    );
  }

  // --- RENDER: ERROR STATE ---
  if (error || !portfolio) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-slate-50 px-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-rose-200 text-center max-w-sm w-full">
          <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h3 className="text-slate-900 font-bold mb-2">Connection Error</h3>
          <p className="text-slate-500 text-sm mb-6">{error || "Could not retrieve portfolio data."}</p>
          <LogoutButton />
        </div>
      </div>
    );
  }

  // --- RENDER: MAIN DASHBOARD ---
  return (
    <div className="h-[100dvh] overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 font-sans relative selection:bg-indigo-500/20 selection:text-indigo-900">
      <div className="fixed inset-0 z-0 opacity-[0.35] bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      
      {/* --- MOBILE/TABLET VIEW --- */}
      <div className="flex flex-col lg:hidden relative z-10 w-full bg-slate-50 h-full">
        {mobileActiveScreen === 'holdings' ? (
          <MobileHoldings 
            client={portfolio}
            filteredFunds={filteredFunds}
            activeFilterType={activeFilterType}
            setActiveFilterType={setActiveFilterType}
            activeFilterValue={activeFilterValue}
            setActiveFilterValue={setActiveFilterValue}
            filterOptions={filterOptions}
            onNavigateToFund={(fund) => {
              setMobileSelectedFund(fund);
              setMobileActiveScreen('fund_details');
            }}
          />
        ) : (
          mobileSelectedFund && (
            <MobileFundDetails 
              fund={mobileSelectedFund}
              onBack={() => {
                setMobileActiveScreen('holdings');
                setMobileSelectedFund(null);
              }}
            />
          )
        )}
      </div>
      
      {/* --- DESKTOP VIEW --- */}
      <div className="hidden lg:flex flex-col relative z-10 px-4 sm:px-8 lg:px-12 py-8 max-w-[1800px] mx-auto space-y-6 animate-[fadeIn_0.5s_ease-out] h-full">
        
        {/* Header */}
        <div className="shrink-0 flex justify-between items-end gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">
              Portfolio <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-600 to-primary/80">Overview</span>
            </h1>
            <p className="text-slate-500 font-medium mt-1">Holistic view of your capital allocation and performance.</p>
            <div className="mt-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px]">
                {/* Fallback to 'BM' if no name is available, otherwise grab first initials */}
                {portfolio.clientName ? portfolio.clientName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'BM'}
              </span>
              <h2 className="text-sm font-bold text-indigo-700 tracking-wide uppercase">{portfolio.clientName}</h2>
            </div>
          </div>
          <div className="mb-2">
              <LogoutButton />
          </div>
        </div>

        <div className="shrink-0">
          <GlobalStatsRibbon client={portfolio} />
        </div>
        
        <div className="shrink-0">
          <FilterBar 
            activeFilterType={activeFilterType}
            setActiveFilterType={setActiveFilterType}
            activeFilterValue={activeFilterValue}
            setActiveFilterValue={setActiveFilterValue}
            filterOptions={filterOptions}
            avgHoldingDays={portfolio.avgHoldingDays}
          />
        </div>
        
        <div className="flex-1 min-h-0 pb-4 w-full">
          <DesktopFundTable funds={filteredFunds} />
        </div>
      </div>
    </div>
  );
}