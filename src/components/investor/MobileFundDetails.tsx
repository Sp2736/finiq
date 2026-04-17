"use client";

import React, { useState } from 'react';
import { UnifiedFund } from '@/types/investor';
import { formatCurrency, getStatusColor } from '@/lib/utils';
import Badge from './Badge';

interface MobileFundDetailsProps {
  fund: UnifiedFund;
  onBack: () => void;
}

export default function MobileFundDetails({ fund, onBack }: MobileFundDetailsProps) {
  const [mobileActiveTab, setMobileActiveTab] = useState<'details' | 'transactions' | 'folios'>('details');
  const [mobileTxFilter, setMobileTxFilter] = useState("All");

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* Header (Sticky / Fixed) */}
      <div className="shrink-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200 pt-6 shadow-sm">
        <div className="px-4 md:px-8 py-4 flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 -ml-1.5 text-slate-900 hover:bg-slate-100 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="font-bold text-slate-900 text-sm md:text-base leading-tight truncate flex-1">{fund.fundName}</h2>
        </div>

        {/* Tab System */}
        <div className="flex px-4 md:px-8 gap-6 md:gap-8">
          {['details', 'transactions', 'folios'].map(tab => (
            <button
              key={tab}
              onClick={() => setMobileActiveTab(tab as any)}
              className={`py-3 text-[11px] md:text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${mobileActiveTab === tab ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content (Scrollable) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-8 py-5 pb-32">
        
        {/* TAB 1: DETAILS */}
        {mobileActiveTab === 'details' && (
          <div className="space-y-4 md:space-y-6 animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Current Value</p>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{formatCurrency(fund.currentValue)}</h2>
              <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-y-5 gap-x-4">
                <div>
                  <p className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase">Invested</p>
                  <p className="text-sm md:text-base font-bold text-slate-700">{formatCurrency(fund.investedCapital)}</p>
                </div>
                <div>
                  <p className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase">Total Gain</p>
                  <p className={`text-sm md:text-base font-bold ${getStatusColor(fund.unrealisedGain)}`}>{formatCurrency(fund.unrealisedGain)}</p>
                </div>
                <div>
                  <p className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase">XIRR</p>
                  <p className="text-sm md:text-base font-bold text-indigo-600">{fund.xirr ?? 0}%</p>
                </div>
                <div>
                  <p className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase">1 Day Change</p>
                  <p className={`text-sm md:text-base font-bold ${getStatusColor(fund.oneDayChange)}`}>
                    {fund.oneDayChange > 0 ? '+' : ''}{formatCurrency(fund.oneDayChange)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 md:gap-6">
              <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm h-full">
                <h3 className="text-xs md:text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Fund Metrics</h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                  <div>
                    <p className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase">Available Units</p>
                    <p className="text-sm md:text-base font-medium text-slate-800">{fund.availableUnits ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase">Avg Holding Days</p>
                    <p className="text-sm md:text-base font-medium text-slate-800">{fund.avgHoldingDays ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase">Current NAV</p>
                    <p className="text-sm md:text-base font-medium text-slate-800">₹{fund.currentNAV ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase">Avg NAV</p>
                    <p className="text-sm md:text-base font-medium text-slate-800">₹{fund.avgNAV ?? 0}</p>
                  </div>
                  <div className="col-span-2 mt-2 pt-3 border-t border-slate-50 flex justify-between">
                    <p className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase">Valuation Date</p>
                    <p className="text-xs md:text-sm font-bold text-slate-600">{fund.valuationDate || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white h-48 md:h-full rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center flex-col gap-2 min-h-[160px]">
                <span className="text-3xl">📊</span>
                <p className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest">Performance Chart</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TRANSACTIONS */}
        {mobileActiveTab === 'transactions' && (
          <div className="animate-[fadeIn_0.2s_ease-out]">
            <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 md:-mx-8 md:px-8">
              {['All', 'SIP', 'LUMPSUM', 'REDEMPTION'].map(type => (
                <button 
                  key={type}
                  onClick={() => setMobileTxFilter(type)}
                  className={`flex-shrink-0 px-4 md:px-5 py-1.5 md:py-2 rounded-full text-[11px] md:text-xs font-bold uppercase tracking-wider transition-colors border ${mobileTxFilter === type ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="space-y-3 md:space-y-4">
              {fund.transactions && fund.transactions.length > 0 ? (
                fund.transactions
                  .filter(tx => mobileTxFilter === 'All' || tx.transactionType === mobileTxFilter || tx.transactionType.includes(mobileTxFilter))
                  .map(tx => (
                    <div key={tx.id} className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-xs md:text-sm font-bold text-slate-900 mb-1">{tx.transactionDate}</p>
                          <span className={`text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded uppercase border ${tx.transactionType.includes('SIP') || tx.transactionType.includes('ADDITIONAL') ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                            {tx.transactionType}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm md:text-base font-black text-slate-900">{formatCurrency(tx.amount)}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                        <p className="text-[10px] md:text-xs text-slate-500 font-medium">Units: <span className="font-bold text-slate-700">{tx.units}</span></p>
                        <p className="text-[10px] md:text-xs text-slate-500 font-medium">NAV: <span className="font-bold text-slate-700">₹{tx.nav}</span></p>
                      </div>
                    </div>
                ))
              ) : (
                <div className="text-center py-10 text-slate-500 text-sm font-medium">No transactions found.</div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: FOLIOS */}
        {mobileActiveTab === 'folios' && (
          <div className="space-y-4 md:space-y-6 md:grid md:grid-cols-2 md:gap-6 animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden md:col-span-1 md:mt-6">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                <h3 className="text-[11px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Investor Details</h3>
              </div>
              <div className="p-4 md:p-5 space-y-3">
                {/* Applied Optional Chaining here */}
                <div className="flex justify-between"><span className="text-xs md:text-sm text-slate-500">Name</span><span className="text-xs md:text-sm font-bold text-slate-900">{fund.investorDetails?.name || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-xs md:text-sm text-slate-500">PAN</span><span className="text-xs md:text-sm font-bold text-slate-900">{fund.investorDetails?.pan || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-xs md:text-sm text-slate-500">Holding Nature</span><span className="text-xs md:text-sm font-bold text-slate-900">{fund.investorDetails?.holdingType || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-xs md:text-sm text-slate-500">Tax Status</span><span className="text-xs md:text-sm font-bold text-slate-900">{fund.investorDetails?.taxStatus || 'N/A'}</span></div>
              </div>
            </div>

            <div className="space-y-4 md:space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                  <h3 className="text-[11px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Bank Details</h3>
                </div>
                <div className="p-4 md:p-5 space-y-3">
                  {/* Applied Optional Chaining here */}
                  <div className="flex justify-between"><span className="text-xs md:text-sm text-slate-500">Bank Name</span><span className="text-xs md:text-sm font-bold text-slate-900">{fund.bankDetails?.bankName || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-xs md:text-sm text-slate-500">Account No.</span><span className="text-xs md:text-sm font-bold text-slate-900">{fund.bankDetails?.accountNumber || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-xs md:text-sm text-slate-500">Branch</span><span className="text-xs md:text-sm font-bold text-slate-900">{fund.bankDetails?.branch || 'N/A'}</span></div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                  <h3 className="text-[11px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Nominee Details</h3>
                </div>
                <div className="p-4 md:p-5 flex justify-between">
                  {/* Applied Optional Chaining here */}
                  <span className="text-xs md:text-sm text-slate-500">{fund.nomineeDetails?.relation || 'N/A'}</span>
                  <span className="text-xs md:text-sm font-bold text-slate-900">{fund.nomineeDetails?.name || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Sticky CTA */}
      {mobileActiveTab === 'details' && (
        <div className="absolute bottom-0 left-0 right-0 p-4 md:px-8 bg-white/90 backdrop-blur-xl border-t border-slate-200 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] z-50">
          <div className="flex gap-3 md:gap-6 max-w-2xl mx-auto">
            
          </div>
        </div>
      )}
    </div>
  );
}