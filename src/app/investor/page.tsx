"use client";

import React, { useState, useMemo } from 'react';
import { UnifiedFund, ClientPortfolio, Transaction } from "@/types/investor";
import LogoutButton from "@/components/investor/LogoutButton";
import { usePortfolio } from "@/hooks/usePortfolio";

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

  // --- DATA NORMALIZER (Transforms API snake_case to Frontend camelCase) ---
  const normalizedPortfolio = useMemo((): ClientPortfolio | null => {
    if (!portfolio) return null;
    const d = portfolio.data || portfolio; 
    
    return {
      id: d.id || "investor-id",
      clientName: d.investor_name || d.clientName || "Investor",
      totalCapital: d.total_capital || d.invested_capital || d.totalCapital || 0,
      investedCapital: d.invested_capital || d.investedCapital || 0,
      currentValue: d.current_value || d.currentValue || 0,
      dividendPayout: d.dividend_payout || d.dividendPayout || 0,
      unrealisedGain: (d.unrealised_gains_lt || 0) + (d.unrealised_gains_st || 0) || d.unrealisedGain || 0,
      unrealisedGainPercent: d.unrealised_gain_percent || d.abs_percent || 0,
      realisedGain: d.realised_gain || d.realisedGain || 0,
      netPL: d.net_pl || d.netPL || 0,
      todaysGain: d.todays_pnl || d.todaysGain || 0,
      todaysGainPercent: d.todays_pnl_percent ?? d.todaysGainPercent ?? 0,
      xirr: d.xirr_percent ?? d.xirr ?? 0,
      abs: d.abs_percent ?? d.abs ?? 0,
      avgHoldingDays: d.avg_days ?? d.avgHoldingDays ?? 0,
      funds: (d.funds || []).map((f: any): UnifiedFund => ({
        folioNo: f.folio_number || f.folioNo || "N/A",
        fundName: f.fund_name || f.fundName || "Unknown Fund",
        category: f.category || "Equity",
        amc: f.amc || "AMC",
        statusTag: f.sip_status || f.statusTag || "N/A",
        purchaseDate: f.purchase_date ? new Date(f.purchase_date).toLocaleDateString('en-GB') : f.purchaseDate,
        totalCapital: f.total_capital || f.invested_capital || 0,
        investedCapital: f.invested_capital || f.total_capital || 0,
        currentValue: f.current_value || f.currentValue || 0,
        availableUnits: f.available_units || f.availableUnits || 0,
        currentNAV: f.current_nav || f.currentNAV || 0,
        avgNAV: f.avg_nav || f.avgNAV || 0,
        dividendPayout: f.dividend_payout || f.dividendPayout || 0,
        unrealisedGain: (f.unrealised_gains_lt || 0) + (f.unrealised_gains_st || 0) || f.unrealisedGain || 0,
        unrealisedGainPercent: f.abs_percent ?? f.unrealisedGainPercent ?? 0,
        realisedGain: f.realised_gain || 0,
        securityType: f.security_type || "Mutual Fund",
        sipStatus: f.sip_status || f.sipStatus || "N/A",
        xirr: f.xirr_percent ?? f.xirr ?? 0,
        oneDayChange: f.todays_pnl || f.oneDayChange || 0,
        oneDayPercent: f.todays_pnl_percent || 0,
        valuationDate: f.valuation_date || new Date().toISOString(),
        avgHoldingDays: f.avg_days || 0,
        
        investorDetails: {
          name: d.investor_name || d.clientName || "Investor",
          pan: f.pan || "Not Available",
          dob: f.dob || "N/A",
          taxStatus: f.tax_status || "Resident Individual",
          holdingType: f.holding_nature || "Single",
        },

        contactDetails: {
          email: f.email || d.email || "N/A",
          mobile: f.mobile || d.mobile || "N/A",
          address: f.address || "N/A"
        },

        bankDetails: {
          bankName: f.bank_name || d.bank_name || "Bank Details Unavailable",
          accountNumber: f.account_number || d.account_number || "N/A",
          accountType: f.account_type || "Savings",
          branch: f.branch || d.branch || "N/A"
        },

        nomineeDetails: {
          name: f.nominee_name || "N/A",
          relation: f.nominee_relation || "N/A"
        },

        jointHolderDetails: f.joint_holder ? {
          name: f.joint_holder_name || "N/A",
          pan: f.joint_holder_pan || "N/A"
        } : null,

        transactions: (f.transactions || [])
          .sort((a: any, b: any) => {
            const dateA = new Date(a.transaction_date || 0).getTime();
            const dateB = new Date(b.transaction_date || 0).getTime();
            return dateB - dateA;
          })
          .map((t: any, i: number): Transaction => ({
            id: i.toString(),
            transactionDate: t.transaction_date ? new Date(t.transaction_date).toLocaleDateString('en-GB') : t.transactionDate,
            transactionType: t.transaction_type || t.transactionType || "Unknown",
            amount: t.amount || 0,
            sttCharges: t.stt_and_others || t.sttCharges || 0,
            nav: t.nav || 0,
            units: t.units || 0,
            balanceUnits: t.balanceUnits || 0,
            holdingDays: t.holdingDays || 0,
            capitalGain: t.unrealised_gains || t.capitalGain || 0
          }))
      }))
    };
  }, [portfolio]);

  // --- SHARED STATE ---
  const [activeFilterType, setActiveFilterType] = useState<string>("All");
  const [activeFilterValue, setActiveFilterValue] = useState<string>("All");

  // --- MOBILE SPECIFIC STATE ---
  const [mobileActiveScreen, setMobileActiveScreen] = useState<'holdings' | 'fund_details'>('holdings');
  const [mobileSelectedFund, setMobileSelectedFund] = useState<UnifiedFund | null>(null);

  // --- FILTER LOGIC ---
  const filterOptions = useMemo(() => {
    const options = new Set<string>();
    if (normalizedPortfolio?.funds) {
      normalizedPortfolio.funds.forEach((fund: any) => {
        if (activeFilterType === "Category/Industry") options.add(fund.category);
        if (activeFilterType === "AMC/Issuer") options.add(fund.amc);
        if (activeFilterType === "Tag" && fund.statusTag) options.add(fund.statusTag);
      });
    }
    return Array.from(options);
  }, [activeFilterType, normalizedPortfolio]);

  const filteredFunds = useMemo(() => {
    if (!normalizedPortfolio?.funds) return [];
    return normalizedPortfolio.funds.filter((fund: any) => {
      if (activeFilterType === "All" || activeFilterValue === "All") return true;
      if (activeFilterType === "Category/Industry") return fund.category === activeFilterValue;
      if (activeFilterType === "AMC/Issuer") return fund.amc === activeFilterValue;
      if (activeFilterType === "Tag") return fund.statusTag === activeFilterValue;
      return true;
    });
  }, [activeFilterType, activeFilterValue, normalizedPortfolio]);

  // --- HELPER: Initials ---
  const getInitials = (name: string) => {
    if (!name || name === "Investor") return "IV";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

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
  if (error || !normalizedPortfolio) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-slate-50 px-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-rose-200 text-center max-w-sm w-full">
          <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h3 className="text-slate-900 font-bold mb-2">Connection Error</h3>
          <p className="text-slate-500 text-sm mb-6">{error || "Could not retrieve portfolio data."}</p>
          <LogoutButton portal="investor" redirectTo="/login" />
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
            client={normalizedPortfolio}
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
      {/* TIGHTENED LAYOUT: py-4 and space-y-3 instead of py-8 and space-y-6 */}
      <div className="hidden lg:flex flex-col relative z-10 px-4 sm:px-8 lg:px-12 py-4 max-w-[1800px] mx-auto space-y-3 animate-[fadeIn_0.5s_ease-out] h-full">
        
        {/* Header */}
        <div className="shrink-0 flex justify-between items-end gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              Portfolio <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-600 to-primary/80">Overview</span>
            </h1>
            <p className="text-slate-500 font-medium mt-0 text-sm">Holistic view of your capital allocation and performance.</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px]">
                {getInitials(normalizedPortfolio.clientName)}
              </span>
              <h2 className="text-sm font-bold text-indigo-700 tracking-wide uppercase">{normalizedPortfolio.clientName}</h2>
            </div>
          </div>
          <div className="mb-2">
              <LogoutButton portal="investor" redirectTo="/login" />
          </div>
        </div>

        <div className="shrink-0">
          <GlobalStatsRibbon client={normalizedPortfolio} />
        </div>
        
        <div className="shrink-0">
          <FilterBar 
            activeFilterType={activeFilterType}
            setActiveFilterType={setActiveFilterType}
            activeFilterValue={activeFilterValue}
            setActiveFilterValue={setActiveFilterValue}
            filterOptions={filterOptions}
            avgHoldingDays={normalizedPortfolio.avgHoldingDays}
          />
        </div>
        
        <div className="flex-1 min-h-0 pb-4 w-full">
          <DesktopFundTable funds={filteredFunds} />
        </div>
      </div>
    </div>
  );
}