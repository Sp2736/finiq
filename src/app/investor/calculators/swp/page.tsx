"use client";

import GoBackButton from "@/components/investor/GoBackButton";
import React, { useState, useMemo, useEffect } from "react";
import {
  AreaChart,
  Area,
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
const calculateSWP = (
  principal: number,
  monthlyWithdrawal: number,
  rate: number,
  years: number,
) => {
  let corpus = principal;

  const r = rate / 12 / 100;
  const totalMonths = years * 12;

  let totalWithdrawn = 0;
  let depletionMonth: number | null = null;

  for (let m = 1; m <= totalMonths; m++) {
    // Withdraw first
    if (corpus >= monthlyWithdrawal) {
      corpus -= monthlyWithdrawal;
      totalWithdrawn += monthlyWithdrawal;
    } else {
      totalWithdrawn += corpus;
      corpus = 0;
      depletionMonth = m;
      break;
    }

    // Remaining corpus grows
    corpus *= 1 + r;
  }

  const totalReturns = corpus + totalWithdrawn - principal;

  return {
    invested: principal,

    withdrawn: totalWithdrawn,

    finalValue: Math.max(0, corpus),

    totalReturns: Math.max(0, totalReturns),

    isDepleted: corpus <= 1,

    depletionMonth,
  };
}; // fix: the sequence of withdrawal and corpus reduction was wrong

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

export default function SWPCalculator() {
  // ─── STATE MANAGEMENT ───
  const [investment, setInvestment] = useState<number>(5000000); // Default ₹50L
  const [withdrawal, setWithdrawal] = useState<number>(25000); // Default ₹25k / mo
  const [rate, setRate] = useState<number>(10); // Default 10% p.a
  const [duration, setDuration] = useState<number>(10); // Default 10 Yrs

  // ─── DYNAMIC CONFIG ───
  const limits = {
    INVESTMENT: { min: 10000, max: 500000000, step: 10000 }, // Max 50 Cr
    WITHDRAWAL: { min: 1000, max: 1000000, step: 500 }, // Max 10 L / mo
    RATE: { min: 1, max: 30, step: 0.1 },
    DURATION: { min: 1, max: 40, step: 1 },
  };

  // ─── CORE COMPUTATIONS ───
  const results = useMemo(() => {
    return calculateSWP(investment, withdrawal, rate, duration);
  }, [investment, withdrawal, rate, duration]);

  // ─── DYNAMIC CHART DATA (MEDIAN LOGIC) ───
  const chartData = useMemo(() => {
    const baseStep = duration >= 15 ? 5 : duration >= 5 ? 2 : 1;
    let plotIntervals: number[] = [];
    const start = duration - 2 * baseStep;

    // Use the exact same sliding median window approach
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

    return plotIntervals.map((y) => {
      const stepRes = calculateSWP(investment, withdrawal, rate, y);
      return {
        yearLabel: `${y} Yr`,
        duration: y,
        corpus: stepRes.finalValue,
        withdrawn: stepRes.withdrawn,
      };
    });
  }, [investment, withdrawal, rate, duration]);

  // ─── CUSTOM RECHARTS TOOLTIP ───
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] min-w-[200px] text-xs z-50">
          <p className="font-bold text-slate-500 mb-2 border-b border-slate-100 pb-2 flex justify-between">
            <span>Duration: {data.duration} Years</span>
            <span className="text-distributor-600">{rate}% p.a</span>
          </p>
          <div className="space-y-1.5">
            <div className="flex justify-between gap-4">
              <span className="text-slate-500 font-medium">
                Initial Investment
              </span>
              <span className="font-bold text-slate-700">
                {formatCurrency(investment)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500 font-medium">
                Total Withdrawn
              </span>
              <span className="font-bold text-emerald-600">
                {formatCurrency(data.withdrawn)}
              </span>
            </div>
            <div className="flex justify-between gap-4 pt-1.5 mt-1.5 border-t border-slate-100 border-dashed">
              <span className="font-bold text-slate-800">Remaining Corpus</span>
              <span
                className={`font-black ${data.corpus > 0 ? "text-distributor-700" : "text-red-500"}`}
              >
                {formatCurrency(data.corpus)}
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
            SWP <span className="text-distributor-600">Calculator</span>
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Analyze the sustainability of your systematic withdrawals.
          </p>
        </div>
        <div className="flex justify-end">
          <GoBackButton fallbackRoute="/investor" />
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
              label="Withdrawal Per Month"
              value={withdrawal}
              setter={setWithdrawal}
              min={limits.WITHDRAWAL.min}
              max={limits.WITHDRAWAL.max}
              step={limits.WITHDRAWAL.step}
              unit="₹"
            />
            <SyncedSlider
              label="Expected Return Rate (p.a)"
              value={rate}
              setter={setRate}
              min={limits.RATE.min}
              max={limits.RATE.max}
              step={limits.RATE.step}
              unit="%"
            />
            <SyncedSlider
              label="Time Period (Years)"
              value={duration}
              setter={setDuration}
              min={limits.DURATION.min}
              max={limits.DURATION.max}
              step={limits.DURATION.step}
              unit="Yr"
            />
          </div>
        </div>

        {/* ─── CHART ─── */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-md border border-slate-200 shadow-sm min-h-[350px] lg:min-h-0 lg:h-full flex flex-col relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="yearLabel"
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
                  value: "Value Generated",
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: 11, fill: "#64748b", fontWeight: 700 },
                  dx: -5,
                }}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: "rgba(61, 96, 171, 0.1)",
                  strokeWidth: 2,
                  fill: "transparent",
                }}
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

              {/* Unstacked Areas for SWP to clearly show corpus depletion vs total withdrawn */}
              <Area
                type="monotone"
                dataKey="corpus"
                name="Remaining Corpus"
                stroke="#3d60ab"
                strokeWidth={3}
                fill="url(#colorCorpus)"
                animationDuration={800}
              />
              <Area
                type="monotone"
                dataKey="withdrawn"
                name="Total Withdrawn"
                stroke="#10b981"
                strokeWidth={3}
                fill="url(#colorWithdrawn)"
                fillOpacity={0.1}
                animationDuration={800}
              />

              {/* Gradients for aesthetics */}
              <defs>
                <linearGradient id="colorCorpus" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3d60ab" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3d60ab" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorWithdrawn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── SUMMARY CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0 relative z-0">
        {[
          {
            label: "Total Investment",
            val: investment,
            color: "text-slate-900",
          },
          {
            label: "Monthly Withdrawal",
            val: withdrawal,
            color: "text-slate-900",
          },
          {
            label: "Total Withdrawn",
            val: results.withdrawn,
            color: "text-emerald-600",
          },
          {
            label: "Final Corpus Value",
            val: results.finalValue,
            color: `bg-distributor-50 -m-5 p-5 h-[calc(100%+40px)] rounded-md flex flex-col justify-center border border-distributor-100 ${results.isDepleted ? "text-red-500" : "text-distributor-700"}`,
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
                className={`text-xl sm:text-2xl lg:text-3xl font-black mt-1 tabular-nums relative z-10 truncate ${card.color.split(" ")[0]}`}
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
