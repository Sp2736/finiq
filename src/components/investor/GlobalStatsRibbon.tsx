"use client";

import React from 'react';
import { ClientPortfolio } from '@/types/investor';
import { formatCurrency, formatPercent, getStatusColor, formatCompactNumber } from '@/lib/utils';

interface GlobalStatsRibbonProps {
  client: ClientPortfolio;
  useCompactValues?: boolean;
}

export default function GlobalStatsRibbon({ client, useCompactValues = false }: GlobalStatsRibbonProps) {
  // Helper to dynamically format based on the user role / prop
  const getFormattedValue = (val: number) => {
    if (val === undefined || val === null) return "₹0";
    
    // If true (Distributor View) -> Use Cr/L/K
    if (useCompactValues) {
      return val < 0 
        ? `-${formatCompactNumber(Math.abs(val))}` 
        : formatCompactNumber(val);
    }
    
    // If false (Investor Dashboard) -> Use Exact Values
    return formatCurrency(val);
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-md border border-slate-200/60 shadow-sm overflow-x-auto custom-scrollbar">
      <div className="flex w-max min-w-full divide-x divide-slate-100 p-1.5">
        {[
          { label: "Invested Capital", value: getFormattedValue(client.investedCapital), title: formatCurrency(client.investedCapital) },
          { label: "Current Value", value: getFormattedValue(client.currentValue), title: formatCurrency(client.currentValue), highlight: true },
          { label: "Unrealised Gains", value: getFormattedValue(client.unrealisedGain), title: formatCurrency(client.unrealisedGain), sub: `(${formatPercent(client.unrealisedGainPercent)})`, valNum: client.unrealisedGain },
          { label: "Realised Gains", value: getFormattedValue(client.realisedGain), title: formatCurrency(client.realisedGain), valNum: client.realisedGain },
          { label: "Dividend Payout", value: getFormattedValue(client.dividendPayout), title: formatCurrency(client.dividendPayout), valNum: client.dividendPayout },
          { label: "Net P&L Amount", value: getFormattedValue(client.netPL), title: formatCurrency(client.netPL), valNum: client.netPL },
          { label: "XIRR / ABS", value: `${client.xirr}% / ${client.abs}%`, title: `${client.xirr}% / ${client.abs}%`, valNum: client.xirr },
        ].map((stat, idx) => (
          <div key={idx} className="flex-1 px-4 py-2.5 min-w-[130px]" title={stat.title}>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-1.5">
              <p className={`text-lg font-black tabular-nums tracking-tight ${stat.highlight ? 'text-primary' : (stat.valNum !== undefined ? getStatusColor(stat.valNum) : 'text-slate-900')}`}>
                {stat.value}
              </p>
              {stat.sub && (
                <span className={`text-[10px] font-bold ${stat.valNum !== undefined ? getStatusColor(stat.valNum) : ''}`}>{stat.sub}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}