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
import { CalculatorSelect } from "../CalculatorSelect";
import GoBackButton from "@/components/investor/GoBackButton";
import CalculatorNavDropdown from "@/components/investor/CalculatorNavDropdown"


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
const calculateSIP = (p: number, rate: number, years: number) => {
  const r = rate / 12 / 100;
  const n = years * 12;
  const invested = p * n;

  if (r === 0) return { invested, returns: 0, total: invested };

  const total = p * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  return { invested, returns: Math.max(0, total - invested), total };
};

const calculateLumpsum = (p: number, rate: number, years: number) => {
  const r = rate / 100;
  const n = 12; // Monthly compounding
  const invested = p;

  if (r === 0) return { invested, returns: 0, total: invested };

  const total = p * Math.pow(1 + r, years); // FIXED: formula for lumpsum compounding
  return { invested, returns: Math.max(0, total - invested), total };
};

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
        <div className="flex items-center bg-investor-50 px-3 py-1.5 rounded-md border border-distributor-100 focus-within:border-distributor-500 transition-colors">
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
        className="w-full h-1.5 bg-slate-200 rounded-md appearance-none cursor-pointer accent-distributor-600"
      />
    </div>
  );
};

export default function MFReturnsCalculator() {
  // ─── STATE MANAGEMENT ───
  const [mode, setMode] = useState<"SIP" | "LUMPSUM">("SIP");
  const [investment, setInvestment] = useState<number>(10000); // Default ₹10k SIP
  const [rate, setRate] = useState<number>(12); // Default 12%
  const [duration, setDuration] = useState<number>(10); // Default 10 Yrs

  // ─── DYNAMIC CONFIG ───
  const limits = useMemo(
    () => ({
      INVESTMENT:
        mode === "SIP"
          ? { min: 500, max: 1000000, step: 500 }
          : { min: 1000, max: 50000000, step: 1000 },
      RATE: { min: 1, max: 40, step: 0.1 },
      DURATION: { min: 1, max: 40, step: 1 },
    }),
    [mode],
  );

  // Handle Mode Switch cleanly
  const handleModeSwitch = (newMode: "SIP" | "LUMPSUM") => {
    if (newMode === mode) return;
    setMode(newMode);
    setInvestment(newMode === "SIP" ? 10000 : 100000);
  };

  // ─── CORE COMPUTATIONS ───
  const results = useMemo(() => {
    return mode === "SIP"
      ? calculateSIP(investment, rate, duration)
      : calculateLumpsum(investment, rate, duration);
  }, [mode, investment, rate, duration]);

  // ─── DYNAMIC CHART DATA (MEDIAN LOGIC) ───
  const chartData = useMemo(() => {
    const baseStep = duration >= 15 ? 5 : duration >= 5 ? 2 : 1;
    let plotIntervals: number[] = [];
    const start = duration - 2 * baseStep;

    // Calculate strictly the next multiples of 5 after the selected duration
    const next1 = Math.ceil((duration + 1) / 5) * 5;
    const next2 = next1 + 5;
    const next3 = next2 + 5;
    const next4 = next3 + 5;

    if (start >= 1) {
      plotIntervals = [
        duration - 2 * baseStep,
        duration - baseStep,
        duration,
        next1, // 1st multiple of 5 after duration
        next2, // 2nd multiple of 5 after duration
      ];
    } else if (duration - baseStep >= 1) {
      plotIntervals = [
        duration - baseStep,
        duration,
        next1,
        next2,
        next3,
      ];
    } else {
      plotIntervals = [
        duration,
        next1,
        next2,
        next3,
        next4,
      ];
    }

    return plotIntervals.map((y) => {
      const stepRes =
        mode === "SIP"
          ? calculateSIP(investment, rate, y)
          : calculateLumpsum(investment, rate, y);

      return {
        yearLabel: `${y} Yr`,
        duration: y,
        invested: stepRes.invested,
        returns: stepRes.returns,
        total: stepRes.total,
      };
    });
  }, [mode, investment, rate, duration]);

  // ─── CUSTOM RECHARTS TOOLTIP ───
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-md border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] min-w-[180px] text-xs z-50">
          <p className="font-bold text-slate-500 mb-2 border-b border-slate-100 pb-2">
            Duration: {data.duration} Years
          </p>
          <div className="space-y-1.5">
            <div className="flex justify-between gap-4">
              <span className="text-slate-500 font-medium">Invested</span>
              <span className="font-bold text-slate-700">
                {formatCurrency(data.invested)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500 font-medium">Est. Returns</span>
              <span className="font-bold text-distributor-600">
                {formatCurrency(data.returns)}
              </span>
            </div>
            <div className="flex justify-between gap-4 pt-1.5 mt-1.5 border-t border-slate-100 border-dashed">
              <span className="font-bold text-slate-800">Total Value</span>
              <span className="font-black text-distributor-700">
                {formatCurrency(data.total)}
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
            Mutual Fund <span className="text-investor-600">Returns</span>
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Project your wealth growth with precision compounding.
          </p>
        </div>
        <div className="flex items-center gap-3 justify-end">
          <CalculatorNavDropdown />
          <GoBackButton fallbackRoute="/investor" />
        </div>
      </div>

      {/* ─── RESPONSIVE MAIN GRID ─── */}
      {/* Changed to shrink-0 to prevent collapsing on mobile/tablets */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8 shrink-0 w-full">
        {/* ─── INPUTS ─── */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-md border border-slate-200 shadow-sm flex flex-col justify-center relative z-20">
          {/* Mode Selector */}
          <div className="space-y-3 mb-8 z-20">
            <label className="text-xs font-black uppercase text-slate-500">
              Investment Mode
            </label>
            <CalculatorSelect
              options={[
                { value: "SIP", label: "Monthly SIP" },
                { value: "LUMPSUM", label: "One-Time Lumpsum" },
              ]}
              value={mode}
              onChange={(val) => handleModeSwitch(val as "SIP" | "LUMPSUM")}
            />
          </div>

          <div className="z-10 space-y-8">
            <SyncedSlider
              label={
                mode === "SIP" ? "Monthly Investment" : "Lumpsum Investment"
              }
              value={investment}
              setter={setInvestment}
              min={limits.INVESTMENT.min}
              max={limits.INVESTMENT.max}
              step={limits.INVESTMENT.step}
              unit="₹"
            />
            <SyncedSlider
              label="Expected Return (p.a)"
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
        {/* Enforced min height to prevent squishing on mobile views */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-md border border-slate-200 shadow-sm min-h-[360px] flex flex-col relative z-10">
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
                  value: "Wealth Generated",
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

              <Bar
                dataKey="invested"
                name="Total Invested"
                stackId="a"
                fill="#3d60ab"
                radius={[0, 0, 4, 4]}
                maxBarSize={60}
                animationDuration={800}
              />
              <Bar
                dataKey="returns"
                name="Estimated Returns"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0 relative z-0">
        {[
          {
            label: mode === "SIP" ? "Monthly SIP" : "One-time Lumpsum",
            val: investment,
            color: "text-slate-900",
          },
          {
            label: "Total Invested",
            val: results.invested,
            color: "text-slate-900",
          },
          {
            label: "Est. Returns",
            val: results.returns,
            color: "text-emerald-600",
          },
          {
            label: "Total Wealth Value",
            val: results.total,
            color:
              "text-distributor-700 bg-investor-50 -m-5 p-5 h-[calc(100%+40px)] rounded-md flex flex-col justify-center border border-distributor-100",
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
