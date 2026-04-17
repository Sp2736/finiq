"use client";

import React, { useState, useMemo } from 'react';
import { CURRENT_CLIENT } from "@/types/mockInvestorData";
import { UnifiedFund } from "@/types/investor";
import LogoutButton from "@/components/investor/LogoutButton";

// Desktop Components
import GlobalStatsRibbon from "@/components/investor/GlobalStatsRibbon";
import FilterBar from "@/components/investor/FilterBar";
import DesktopFundTable from "@/components/investor/DesktopFundTable";

// Mobile Components
import MobileHoldings from "@/components/investor/MobileHoldings";
import MobileFundDetails from "@/components/investor/MobileFundDetails";

export default function UnifiedPortfolioApp() {
  // --- SHARED STATE ---
  const [activeFilterType, setActiveFilterType] = useState<string>("All");
  const [activeFilterValue, setActiveFilterValue] = useState<string>("All");

  // --- MOBILE SPECIFIC STATE ---
  const [mobileActiveScreen, setMobileActiveScreen] = useState<'holdings' | 'fund_details'>('holdings');
  const [mobileSelectedFund, setMobileSelectedFund] = useState<UnifiedFund | null>(null);

  // --- FILTER LOGIC ---
  const filterOptions = useMemo(() => {
    const options = new Set<string>();
    CURRENT_CLIENT.funds.forEach(fund => {
      if (activeFilterType === "Category/Industry") options.add(fund.category);
      if (activeFilterType === "AMC/Issuer") options.add(fund.amc);
      if (activeFilterType === "Tag" && fund.statusTag) options.add(fund.statusTag);
    });
    return Array.from(options);
  }, [activeFilterType]);

  const filteredFunds = CURRENT_CLIENT.funds.filter(fund => {
    if (activeFilterType === "All" || activeFilterValue === "All") return true;
    if (activeFilterType === "Category/Industry") return fund.category === activeFilterValue;
    if (activeFilterType === "AMC/Issuer") return fund.amc === activeFilterValue;
    if (activeFilterType === "Tag") return fund.statusTag === activeFilterValue;
    return true;
  });

  return (
    <div className="h-[100dvh] overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 font-sans relative selection:bg-indigo-500/20 selection:text-indigo-900">
      {/* Background matching Login Page */}
      <div className="fixed inset-0 z-0 opacity-[0.35] bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      
      {/* ========================================================= */}
      {/* =================== MOBILE/TABLET VIEW (< 1024px) ========= */}
      {/* ========================================================= */}
      <div className="flex flex-col lg:hidden relative z-10 w-full bg-slate-50 h-full">
        
        {mobileActiveScreen === 'holdings' ? (
          <MobileHoldings 
            client={CURRENT_CLIENT}
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
      

      {/* ========================================================= */}
      {/* =================== DESKTOP VIEW (>= 1024px) ============== */}
      {/* ========================================================= */}
      <div className="hidden lg:flex flex-col relative z-10 px-4 sm:px-8 lg:px-12 py-8 max-w-[1800px] mx-auto space-y-6 animate-[fadeIn_0.5s_ease-out] h-full">
        
        {/* Header */}
        <div className="shrink-0 flex justify-between items-end gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">
              Portfolio <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-600 to-primary/80">Overview</span>
            </h1>
            <p className="text-slate-500 font-medium mt-1">Holistic view of your capital allocation and performance.</p>
            <div className="mt-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px]">BM</span>
              <h2 className="text-sm font-bold text-indigo-700 tracking-wide uppercase">{CURRENT_CLIENT.clientName}</h2>
            </div>
          </div>
          <div className="mb-2">
              <LogoutButton />
          </div>
        </div>

        <div className="shrink-0">
          <GlobalStatsRibbon client={CURRENT_CLIENT} />
        </div>
        
        <div className="shrink-0">
          <FilterBar 
            activeFilterType={activeFilterType}
            setActiveFilterType={setActiveFilterType}
            activeFilterValue={activeFilterValue}
            setActiveFilterValue={setActiveFilterValue}
            filterOptions={filterOptions}
            avgHoldingDays={CURRENT_CLIENT.avgHoldingDays}
          />
        </div>
        
        <div className="flex-1 min-h-0 pb-4 w-full">
          <DesktopFundTable funds={filteredFunds} />
        </div>
      </div>
    </div>
  );
}