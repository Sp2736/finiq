"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

// ─── UTILITY ───
const formatCurrency = (val: number): string => {
  if (isNaN(val)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
};

const formatCompactCurrency = (val: number): string => {
  if (isNaN(val)) return "0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(val);
};

// ─── FINANCIAL MATH LOGIC ───
const calculateSTP = (
  principal: number,
  liquidRate: number,
  equityRate: number,
  months: number,
) => {

  const rLiquid = liquidRate / 12 / 100;
  const rEquity = equityRate / 12 / 100;

  const monthlySTP = principal / months;

  let liquidCorpus = principal;
  let equityCorpus = 0;

  let totalTransferred = 0;

  for (let m = 1; m <= months; m++) {

    // Prevent floating overflow
    const transfer =
      Math.min(monthlySTP, liquidCorpus);

    // Transfer out from liquid
    liquidCorpus -= transfer;

    // Transfer into equity
    equityCorpus += transfer;

    totalTransferred += transfer;

    // Remaining balances grow
    liquidCorpus *= (1 + rLiquid);

    equityCorpus *= (1 + rEquity);
  }

  liquidCorpus = Math.max(0, liquidCorpus);

  const remainingPrincipal =
    principal - totalTransferred;

  const liquidReturns =
    liquidCorpus - Math.max(0, remainingPrincipal);

  const equityReturns =
    equityCorpus - totalTransferred;

  const finalValue =
    liquidCorpus + equityCorpus;

  return {
    invested: principal,

    monthlySTP,

    totalTransferred,

    liquidReturns: Math.max(0, liquidReturns),

    equityReturns: Math.max(0, equityReturns),

    finalValue: Math.max(0, finalValue),
  };
}; // fix: transfer and growth sequence was initially vice versa

// ─── REUSABLE SYNCED SLIDER ───
interface SyncedSliderProps {
  label: string;
  value: number;
  setter: (val: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
}

const SyncedSlider: React.FC<SyncedSliderProps> = ({
  label,
  value,
  setter,
  min,
  max,
  step,
  unit,
}) => {
  const [localStr, setLocalStr] = useState<string>(value.toString());

  useEffect(() => {
    setLocalStr(value.toString());
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalStr(e.target.value);
    const num = parseFloat(e.target.value);
    if (!isNaN(num) && num >= 0) {
      setter(num);
    }
  };

  const handleBlur = () => {
    let num = parseFloat(localStr);
    if (isNaN(num)) num = min;
    if (num < min) num = min;
    if (num > max) num = max;
    setter(num);
    setLocalStr(num.toString());
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseFloat(e.target.value);
    setter(num);
    setLocalStr(num.toString());
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-xs font-black uppercase text-slate-500">
          {label}
        </label>
        <div className="flex items-center bg-distributor-50 px-3 py-1.5 rounded-lg border border-distributor-100 focus-within:border-distributor-500 transition-colors">
          {unit === "₹" && (
            <span className="text-sm font-black text-distributor-700 mr-1">
              ₹
            </span>
          )}
          <input
            type="number"
            value={localStr}
            onChange={handleTextChange}
            onBlur={handleBlur}
            className="bg-transparent text-sm font-black text-distributor-700 outline-none w-24 text-right appearance-none"
            style={{ MozAppearance: "textfield" }}
          />
          {unit !== "₹" && (
            <span className="text-sm font-black text-distributor-700 ml-1 whitespace-nowrap">
              {unit}
            </span>
          )}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleSliderChange}
        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-distributor-600"
      />
    </div>
  );
};

export default function STPCalculator() {
  // ─── STATE MANAGEMENT ───
  const [investment, setInvestment] = useState<number>(1000000); // Default ₹10 L
  const [liquidRate, setLiquidRate] = useState<number>(6.5); // Default 6.5%
  const [equityRate, setEquityRate] = useState<number>(12); // Default 12%
  const [duration, setDuration] = useState<number>(24); // Default 24 Months

  // ─── DYNAMIC CONFIG ───
  const limits = {
    INVESTMENT: { min: 10000, max: 500000000, step: 10000 }, // Max 50 Cr
    LIQUID_RATE: { min: 1, max: 15, step: 0.1 },
    EQUITY_RATE: { min: 1, max: 40, step: 0.1 },
    DURATION: { min: 1, max: 120, step: 1 }, // Max 120 Months
  };

  // ─── CORE COMPUTATIONS ───
  const results = useMemo(() => {
    return calculateSTP(investment, liquidRate, equityRate, duration);
  }, [investment, liquidRate, equityRate, duration]);

  // ─── DYNAMIC CHART DATA (MEDIAN LOGIC) ───
  const chartData = useMemo(() => {
    // Generate step sizes dynamically based on selected duration in months
    const baseStep =
      duration >= 60 ? 12 : duration >= 24 ? 6 : duration >= 10 ? 3 : 1;
    let plotIntervals: number[] = [];
    const start = duration - 2 * baseStep;

    // Shift window appropriately to always show exactly 5 bars with median targeted
    if (start >= 1) {
      plotIntervals = [
        duration - 2 * baseStep,
        duration - baseStep,
        duration,
        duration + baseStep,
        duration + 2 * baseStep,
      ];
    } else if (duration - baseStep >= 1) {
      plotIntervals = [
        duration - baseStep,
        duration,
        duration + baseStep,
        duration + 2 * baseStep,
        duration + 3 * baseStep,
      ];
    } else {
      plotIntervals = [
        duration,
        duration + baseStep,
        duration + 2 * baseStep,
        duration + 3 * baseStep,
        duration + 4 * baseStep,
      ];
    }

    return plotIntervals.map((m) => {
      const stepRes = calculateSTP(investment, liquidRate, equityRate, m);
      return {
        monthLabel: `${m} Mo`,
        duration: m,
        liquidReturns: stepRes.liquidReturns,
        equityReturns: stepRes.equityReturns,
        monthlySTP: stepRes.monthlySTP,
        finalValue: stepRes.finalValue,
      };
    });
  }, [investment, liquidRate, equityRate, duration]);

  // ─── CUSTOM RECHARTS TOOLTIP ───
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] min-w-[210px] text-xs z-50">
          <p className="font-bold text-slate-500 mb-2 border-b border-slate-100 pb-2 flex justify-between">
            <span>Duration: {data.duration} Months</span>
          </p>
          <div className="space-y-1.5">
            <div className="flex justify-between gap-4">
              <span className="text-slate-500 font-medium">Monthly STP</span>
              <span className="font-bold text-slate-700">
                {formatCurrency(data.monthlySTP)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500 font-medium">Liquid Returns</span>
              <span className="font-bold text-[#7c3aed]">
                {formatCurrency(data.liquidReturns)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500 font-medium">Equity Returns</span>
              <span className="font-bold text-[#059669]">
                {formatCurrency(data.equityReturns)}
              </span>
            </div>
            <div className="flex justify-between gap-4 pt-1.5 mt-1.5 border-t border-slate-100 border-dashed">
              <span className="font-bold text-slate-800">
                Total Future Value
              </span>
              <span className="font-black text-distributor-700">
                {formatCurrency(data.finalValue)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // ─── RENDER ───
  return (
    <div className="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500 gap-6 overflow-y-auto relative">
      {/* ─── HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 mb-1">
            STP <span className="text-distributor-600">Calculator</span>
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Simulate wealth creation with Systematic Transfer Plans.
          </p>
        </div>
      </div>

      {/* ─── RESPONSIVE MAIN GRID ─── */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8 shrink-0 w-full">
        {/* ─── INPUTS ─── */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-md border border-slate-200 shadow-sm flex flex-col justify-center relative z-20">
          <div className="z-10 space-y-8">
            <SyncedSlider
              label="Total Investment"
              value={investment}
              setter={setInvestment}
              min={limits.INVESTMENT.min}
              max={limits.INVESTMENT.max}
              step={limits.INVESTMENT.step}
              unit="₹"
            />
            <SyncedSlider
              label="Liquid Fund Growth (p.a)"
              value={liquidRate}
              setter={setLiquidRate}
              min={limits.LIQUID_RATE.min}
              max={limits.LIQUID_RATE.max}
              step={limits.LIQUID_RATE.step}
              unit="%"
            />
            <SyncedSlider
              label="Equity Fund Growth (p.a)"
              value={equityRate}
              setter={setEquityRate}
              min={limits.EQUITY_RATE.min}
              max={limits.EQUITY_RATE.max}
              step={limits.EQUITY_RATE.step}
              unit="%"
            />
            <SyncedSlider
              label="Time Period (Months)"
              value={duration}
              setter={setDuration}
              min={limits.DURATION.min}
              max={limits.DURATION.max}
              step={limits.DURATION.step}
              unit="Mo"
            />
          </div>
        </div>

        {/* ─── CHART ─── */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-md border border-slate-200 shadow-sm min-h-[350px] lg:min-h-0 lg:h-full flex flex-col relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="monthLabel"
                tick={{ fontSize: 11, fontWeight: 600, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                dy={12}
              />
              <YAxis
                tickFormatter={(val) => formatCompactCurrency(val)}
                tick={{ fontSize: 11, fontWeight: 500, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                width={70}
                label={{
                  value: "Returns Generated",
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: 11, fill: "#64748b", fontWeight: 700 },
                  dx: -5,
                }}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(61, 96, 171, 0.04)" }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#64748b",
                  paddingTop: "20px",
                }}
              />

              {/* Stacked Vertical Bars */}
              <Bar
                dataKey="liquidReturns"
                name="Liquid Returns"
                stackId="a"
                fill="#3d60ab"
                radius={[0, 0, 4, 4]}
                maxBarSize={60}
                animationDuration={800}
              />
              <Bar
                dataKey="equityReturns"
                name="Equity Returns"
                stackId="a"
                fill="#10b981" 
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
                animationDuration={800}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── SUMMARY CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 shrink-0 relative z-0">
        {[
          {
            label: "Total Investment",
            val: results.invested,
            color: "text-slate-900",
          },
          {
            label: "STP Per Month",
            val: results.monthlySTP,
            color: "text-slate-900",
          },
          {
            label: "Liquid Returns",
            val: results.liquidReturns,
            color: "text-[#3d60ab]",
          },
          {
            label: "Equity Returns",
            val: results.equityReturns,
            color: "text-[#059669]",
          }, // Premium Green
          {
            label: "Future Value",
            val: results.finalValue,
            color:
              "text-distributor-700 bg-distributor-50 -m-5 p-5 h-[calc(100%+40px)] rounded-md flex flex-col justify-center border border-distributor-100",
          },
        ].map((card, i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-md border border-slate-200 shadow-sm relative overflow-hidden"
          >
            <div className={card.color.includes("bg-") ? card.color : ""}>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest relative z-10">
                {card.label}
              </p>
              <p
                className={`text-xl sm:text-2xl font-black mt-1 tabular-nums relative z-10 truncate ${card.color.split(" ")[0]}`}
              >
                {formatCurrency(card.val)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
