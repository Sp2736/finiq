"use client";

import React from 'react';
import { ClientPortfolio } from '@/types/investor';
import { formatCurrency, formatPercent, getStatusColor } from '@/lib/utils';

export default function GlobalStatsRibbon({ client }: { client: ClientPortfolio }) {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-md border border-slate-200/60 shadow-sm overflow-x-auto custom-scrollbar">
      {/* Reduced outer padding to p-1.5 */}
      <div className="flex w-max min-w-full divide-x divide-slate-100 p-1.5">
        {[
          { label: "Invested Capital", value: formatCurrency(client.investedCapital) },
          { label: "Current Value", value: formatCurrency(client.currentValue), highlight: true },
          { label: "Unrealised Gains", value: formatCurrency(client.unrealisedGain), sub: `(${formatPercent(client.unrealisedGainPercent)})`, valNum: client.unrealisedGain },
          { label: "Realised Gains", value: formatCurrency(client.realisedGain), valNum: client.realisedGain },
          { label: "Dividend Payout", value: formatCurrency(client.dividendPayout), valNum: client.dividendPayout },
          { label: "Net P&L Amount", value: formatCurrency(client.netPL), valNum: client.netPL },
          { label: "XIRR / ABS", value: `${client.xirr}% / ${client.abs}%`, valNum: client.xirr },
        ].map((stat, idx) => (
          /* Reduced inner padding and minimum width */
          <div key={idx} className="flex-1 px-4 py-2.5 min-w-[130px]">
            {/* Reduced label font size and bottom margin */}
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-1.5">
              {/* Reduced main value font size from text-xl to text-lg */}
              <p className={`text-lg font-black tabular-nums tracking-tight ${stat.highlight ? 'text-primary' : (stat.valNum !== undefined ? getStatusColor(stat.valNum) : 'text-slate-900')}`}>
                {stat.value}
              </p>
              {stat.sub && (
                /* Reduced percentage text size */
                <span className={`text-[10px] font-bold ${stat.valNum !== undefined ? getStatusColor(stat.valNum) : ''}`}>{stat.sub}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}