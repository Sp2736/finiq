"use client";

import { ClientPortfolio } from '@/types/investor';
import { formatCurrency, formatPercent, getStatusColor, formatCompactNumber } from '@/lib/utils';

interface GlobalStatsRibbonProps {
  client: ClientPortfolio;
  useCompactValues?: boolean;
}

export default function GlobalStatsRibbon({ client, useCompactValues = true }: GlobalStatsRibbonProps) {
  // Helper to format values compactly (K, L, Cr) universally across the ribbon
  const getFormattedValue = (val: number) => {
    if (val === undefined || val === null) return "₹0";

    return val < 0
      ? `-${formatCompactNumber(Math.abs(val))}`
      : formatCompactNumber(val);
  };

  return (
    <div
      className="backdrop-blur-xl rounded-md overflow-x-auto custom-scrollbar border"
      style={{ backgroundColor: 'var(--fin-ribbon-bg)', borderColor: 'var(--fin-ribbon-border)', boxShadow: '0 4px 15px var(--fin-kpi-shadow)' }}
    >
      <div className="flex w-max min-w-full divide-x divide-[var(--fin-table-row-border)] p-1.5">
        {[
          { label: "Invested Capital", value: getFormattedValue(client.investedCapital), title: formatCurrency(client.investedCapital) },
          { label: "Current Value", value: getFormattedValue(client.currentValue), title: formatCurrency(client.currentValue), highlight: true },
          {
            label: "Unrealised Gains",
            value: getFormattedValue(client.unrealisedGain),
            valNum: client.unrealisedGain,
            subStats: (client.unrealisedGainLT !== undefined || client.unrealisedGainST !== undefined) ? (
              <div className="mt-1 flex gap-2.5 text-[9px] font-bold text-[var(--fin-aux-text)]/80 leading-none select-none">
                <span>LT: {getFormattedValue(client.unrealisedGainLT ?? 0)}</span>
                <span>ST: {getFormattedValue(client.unrealisedGainST ?? 0)}</span>
              </div>
            ) : null
          },
          { label: "Realised Gains", value: getFormattedValue(client.realisedGain), title: formatCurrency(client.realisedGain), valNum: client.realisedGain },
          { label: "Dividend Payout", value: getFormattedValue(client.dividendPayout), title: formatCurrency(client.dividendPayout), valNum: client.dividendPayout },
          { label: "Net P&L Amount", value: getFormattedValue(client.netPL), title: formatCurrency(client.netPL), valNum: client.netPL },
          { label: "XIRR / ABS", value: `${client.xirr}% / ${client.abs}%`, title: `${client.xirr}% / ${client.abs}%`, valNum: client.xirr },
        ].map((stat, idx) => (
          <div key={idx} className="flex-1 px-4 py-2.5 min-w-max whitespace-nowrap" title={stat.title}>
            <p className="text-[9px] font-black uppercase tracking-widest mb-1 truncate" style={{ color: 'var(--fin-ribbon-label)' }}>
              {stat.label}
            </p>
            <div className="flex items-baseline gap-1.5">
              <p className={`text-lg sm:text-xl font-black tabular-nums tracking-tight ${stat.highlight ? '' : (stat.valNum !== undefined ? getStatusColor(stat.valNum) : '')}`} style={stat.highlight ? { color: 'var(--fin-ribbon-highlight-value)' } : (stat.valNum !== undefined ? {} : { color: 'var(--fin-ribbon-value)' })}>
                {stat.value}
              </p>
            </div>
            {stat.subStats}
          </div>
        ))}
      </div>
    </div>
  );
}