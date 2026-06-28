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
import CalculatorNavDropdown from "@/components/investor/CalculatorNavDropdown";

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
const calculateRequiredSIP = (goal: number, rate: number, years: number) => {
  const r = rate / 12 / 100;
  const n = years * 12;

  if (r === 0) return goal / n;

  const numerator = goal;
  const denominator = ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  return numerator / denominator;
};

const calculateRequiredLumpsum = (
  goal: number,
  rate: number,
  years: number,
) => {
  const r = rate / 100;
  const n = 12; // Monthly compounding frequency

  if (r === 0) return goal;
  return goal / Math.pow(1 + r,years);
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
        <label className="text-xs font-black uppercase text-[var(--fin-muted-text)]">
          {label}
        </label>
        <div className="flex items-center bg-[var(--fin-brand-50)] px-3 py-1.5 rounded-md border border-[var(--fin-brand-100)] focus-within:border-[var(--fin-brand-500)] transition-colors">
          {unit === "₹" && (
            <span className="text-sm font-black text-[var(--fin-brand-700)] mr-1">
              ₹
            </span>
          )}
          <input
            type="number"
            value={localStr}
            onChange={handleTextChange}
            onBlur={handleBlur}
            className="bg-transparent text-sm font-black text-[var(--fin-brand-700)] outline-none w-24 text-right appearance-none"
            style={{ MozAppearance: "textfield" }}
          />
          {unit !== "₹" && (
            <span className="text-sm font-black text-[var(--fin-brand-700)] ml-1 whitespace-nowrap">
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
        className="w-full h-1.5 bg-[var(--fin-skeleton-base)] rounded-md appearance-none cursor-pointer accent-[var(--fin-brand-600)]"
      />
    </div>
  );
};

import { useChartTheme } from "@/hooks/useChartTheme";

export default function GoalCalculator() {
  // ─── STATE MANAGEMENT ───
  const [mode, setMode] = useState<"SIP" | "LUMPSUM">("SIP");
  const [goal, setGoal] = useState<number>(1500000);
  const [rate, setRate] = useState<number>(12);
  const [duration, setDuration] = useState<number>(10);

  // ─── DYNAMIC CHART COLORS ───
  const chartColors = useChartTheme();

  // ─── CORE COMPUTATIONS ───
  const results = useMemo(() => {
    let requiredAmount = 0;
    let investedAmount = 0;

    if (mode === "SIP") {
      requiredAmount = calculateRequiredSIP(goal, rate, duration);
      investedAmount = requiredAmount * (duration * 12);
    } else {
      requiredAmount = calculateRequiredLumpsum(goal, rate, duration);
      investedAmount = requiredAmount;
    }

    const estimatedReturns = goal - investedAmount;

    return {
      required: Math.max(0, requiredAmount),
      invested: Math.max(0, investedAmount),
      returns: Math.max(0, estimatedReturns),
    };
  }, [mode, goal, rate, duration]);

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

    // Shift window appropriately so duration is centered when possible
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
      const reqAmount =
        mode === "SIP"
          ? calculateRequiredSIP(goal, rate, y)
          : calculateRequiredLumpsum(goal, rate, y);

      return {
        yearLabel: `${y} Yr`,
        duration: y,
        required: reqAmount,
        goalAmount: goal,
      };
    });
  }, [mode, goal, rate, duration]);

  // ─── CUSTOM RECHARTS TOOLTIP ───
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[var(--fin-table-bg)] p-3 rounded-md border border-[var(--fin-border)] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] min-w-[180px] text-xs z-50">
          <p className="font-bold text-[var(--fin-muted-text)] mb-2 border-b border-[var(--fin-border-subtle)] pb-2">
            Duration: {data.duration} Years
          </p>
          <div className="space-y-1.5">
            <div className="flex justify-between gap-4">
              <span className="text-[var(--fin-muted-text)] font-medium">Target Goal</span>
              <span className="font-bold text-[var(--fin-table-row-text)]">
                {formatCurrency(data.goalAmount)}
              </span>
            </div>
            <div className="flex justify-between gap-4 pt-1.5 mt-1.5 border-t border-[var(--fin-border-subtle)] border-dashed">
              <span className="font-bold text-[var(--fin-heading-tertiary)]">Required {mode}</span>
              <span className="font-black text-[var(--fin-brand-700)]">
                {formatCurrency(data.required)}
              </span>
              {/** fix: handle the required mode: remove lumpsum div */}
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
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-[var(--fin-heading-primary)] mb-1">
            Goal <span className="text-[var(--fin-brand-600)]">Calculator</span>
          </h1>
          <p className="text-sm font-medium text-[var(--fin-muted-text)]">
            Find out how much to invest to reach your target.
          </p>
        </div>
        <div className="flex items-center gap-3 justify-end">
          <CalculatorNavDropdown />
          <GoBackButton fallbackRoute="/investor" />
        </div>
      </div>

      {/* ─── RESPONSIVE MAIN GRID ─── */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8 shrink-0 w-full">
        {/* ─── INPUTS ─── */}
        <div className="lg:col-span-5 bg-[var(--fin-table-bg)] p-6 sm:p-8 rounded-md border relative z-20"
             style={{ borderColor: 'var(--fin-kpi-border)', boxShadow: '0 4px 15px var(--fin-kpi-shadow)' }}>
          {/* Mode Selector */}
          <div className="space-y-3 mb-8 z-20">
            <label className="text-xs font-black uppercase text-[var(--fin-muted-text)]">
              Investment Mode
            </label>
            <CalculatorSelect
              options={[
                { value: "SIP", label: "Monthly SIP" },
                { value: "LUMPSUM", label: "One-Time Lumpsum" },
              ]}
              value={mode}
              onChange={(val) => setMode(val as "SIP" | "LUMPSUM")}
            />
          </div>

          <div className="z-10 space-y-8">
            <SyncedSlider
              label="Target Goal Amount"
              value={goal}
              setter={setGoal}
              min={10000}
              max={500000000}
              step={10000}
              unit="₹"
            />
            <SyncedSlider
              label="Expected Return (p.a)"
              value={rate}
              setter={setRate}
              min={1}
              max={30}
              step={0.1}
              unit="%"
            />
            <SyncedSlider
              label="Time Period (Years)"
              value={duration}
              setter={setDuration}
              min={1}
              max={40}
              step={1}
              unit="Yr"
            />
          </div>
        </div>

        {/* ─── CHART ─── */}
        <div className="lg:col-span-7 bg-[var(--fin-table-bg)] p-6 sm:p-8 rounded-md border min-h-[350px] lg:min-h-0 lg:h-full flex flex-col relative z-10"
             style={{ borderColor: 'var(--fin-kpi-border)', boxShadow: '0 4px 15px var(--fin-kpi-shadow)' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={chartColors.grid}
              />
              <XAxis
                dataKey="yearLabel"
                tick={{ fontSize: 11, fontWeight: 600, fill: chartColors.text }}
                axisLine={false}
                tickLine={false}
                dy={12}
              />
              <YAxis
                tickFormatter={(val) => formatCompactCurrency(val)}
                tick={{ fontSize: 11, fontWeight: 500, fill: chartColors.textMuted }}
                axisLine={false}
                tickLine={false}
                width={70}
                label={{
                  value: `Required ${mode}`,
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: 11, fill: chartColors.text, fontWeight: 700 },
                  dx: -5,
                }}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: chartColors.tooltipBg }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: chartColors.text,
                  paddingTop: "20px",
                }}
              />

              {/* Using a single solid color for all bars */}
              <Bar
                dataKey="required"
                name={`Required ${mode === "SIP" ? "Monthly SIP" : "Lumpsum"}`}
                fill={chartColors.color1}
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
          { label: "Target Goal", val: goal, color: "text-[var(--fin-heading-primary)]" },
          {
            label: "Total Invested",
            val: results.invested,
            color: "text-[var(--fin-heading-primary)]",
          },
          {
            label: "Estimated Returns",
            val: results.returns,
            color: "text-[var(--fin-chart-color-4)]",
          },
          {
            label: mode === "SIP" ? "Required SIP / Mo" : "Required Lumpsum",
            val: results.required,
            color:
              "text-[var(--fin-brand-700)] bg-[var(--fin-brand-50)] -m-5 p-5 h-[calc(100%+40px)] rounded-md flex flex-col justify-center border border-[var(--fin-brand-100)]",
          },
        ].map((card, i) => (
          <div
            key={i}
            className="bg-[var(--fin-table-bg)] p-5 rounded-md border relative overflow-hidden"
            style={{ borderColor: 'var(--fin-kpi-border)', boxShadow: '0 4px 15px var(--fin-kpi-shadow)' }}
          >
            <div className={card.color.includes("bg-") ? card.color : ""}>
              <p className="text-[10px] font-black uppercase text-[var(--fin-aux-text)] tracking-widest relative z-10">
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
