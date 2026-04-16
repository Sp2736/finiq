"use client";

import React from 'react';
import { ClientPortfolio } from '@/types/investor';
import { formatCurrency, formatPct, getColorClass } from '@/lib/utils';

export default function GlobalStatsRibbon({ client }: { client: ClientPortfolio }) {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-sm overflow-x-auto custom-scrollbar">
      <div className="flex w-max min-w-full divide-x divide-slate-100 p-2">
        {[
          { label: "Invested Capital", value: formatCurrency(client.investedCapital) },
          { label: "Current Value", value: formatCurrency(client.currentValue), highlight: true },
          { label: "Unrealised Gains", value: formatCurrency(client.unrealisedGain), sub: `(${formatPct(client.unrealisedGainPercent)})`, valNum: client.unrealisedGain },
          { label: "Realised Gains", value: formatCurrency(client.realisedGain), valNum: client.realisedGain },
          { label: "Dividend Payout", value: formatCurrency(client.dividendPayout), valNum: client.dividendPayout },
          { label: "Net P&L Amount", value: formatCurrency(client.netPL), valNum: client.netPL },
          { label: "XIRR / ABS", value: `${client.xirr}% / ${client.absReturn}%`, valNum: client.xirr },
        ].map((stat, idx) => (
          <div key={idx} className="flex-1 px-6 py-4 min-w-[160px]">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <p className={`text-xl font-black tabular-nums tracking-tight ${stat.highlight ? 'text-primary' : (stat.valNum !== undefined ? getColorClass(stat.valNum) : 'text-slate-900')}`}>
                {stat.value}
              </p>
              {stat.sub && (
                <span className={`text-xs font-bold ${stat.valNum !== undefined ? getColorClass(stat.valNum) : ''}`}>{stat.sub}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}