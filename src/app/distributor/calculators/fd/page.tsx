"use client";

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
import { CalculatorSelect } from "../CalculatorSelect";

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

// ─── TYPES ───
type FDType = "CUMULATIVE" | "MONTHLY" | "QUARTERLY" | "HALF_YEARLY" | "YEARLY";

const FD_TYPE_OPTIONS: { label: string; value: FDType }[] = [
  { label: "Reinvestment (Cumulative)", value: "CUMULATIVE" },
  { label: "Monthly Payout", value: "MONTHLY" },
  { label: "Quarterly Payout", value: "QUARTERLY" },
  { label: "Half-Yearly Payout", value: "HALF_YEARLY" },
  { label: "Yearly Payout", value: "YEARLY" },
];

// ─── FINANCIAL MATH LOGIC ───
const calculateFD = (
  principal: number,
  rate: number,
  years: number,
  type: FDType,
) => {
  const r = rate / 100;

  let maturity = principal;
  let totalInterest = 0;
  let periodicPayout = 0;
  let avgAnnualReturn = 0;

  if (type === "CUMULATIVE") {
    const n = 4;

    maturity =
      principal * Math.pow(1 + r / n, n * years);

    totalInterest = maturity - principal;

    avgAnnualReturn = totalInterest / years;

    periodicPayout = 0;
  } else {
    totalInterest = principal * r * years;
    
    avgAnnualReturn = principal * r;
    
    if (type === "MONTHLY")
      periodicPayout = (principal * r) / 12;
    
    if (type === "QUARTERLY")
      periodicPayout = (principal * r) / 4;
    
    if (type === "HALF_YEARLY")
      periodicPayout = (principal * r) / 2;
    
    if (type === "YEARLY")
      periodicPayout = principal * r;

    maturity = principal - totalInterest + periodicPayout; // fix: for the maturity sum
  }

  return {
    invested: principal,
    totalInterest,
    maturity,
    periodicPayout,
    avgAnnualReturn,
  };
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
        <div className="flex items-center bg-distributor-50 px-3 py-1.5 rounded-md border border-distributor-100 focus-within:border-distributor-500 transition-colors">
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

export default function FDCalculator() {
  // ─── STATE MANAGEMENT ───
  const [fdType, setFdType] = useState<FDType>("CUMULATIVE");
  const [investment, setInvestment] = useState<number>(100000); // Default ₹1 L
  const [rate, setRate] = useState<number>(7.5); // Default 7.5%
  const [duration, setDuration] = useState<number>(5); // Default 5 Yrs

  // ─── DYNAMIC CONFIG ───
  const limits = {
    INVESTMENT: { min: 1000, max: 100000000, step: 1000 },
    RATE: { min: 1, max: 15, step: 0.1 },
    DURATION: { min: 1, max: 30, step: 1 },
  };

  // ─── CORE COMPUTATIONS ───
  const results = useMemo(() => {
    return calculateFD(investment, rate, duration, fdType);
  }, [investment, rate, duration, fdType]);

  // ─── DYNAMIC CHART DATA ───
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
      const stepRes = calculateFD(investment, rate, y, fdType);
      return {
        yearLabel: `${y} Yr`,
        duration: y,
        invested: stepRes.invested,
        interest: stepRes.totalInterest,
        maturity: fdType === "CUMULATIVE" ? stepRes.maturity : stepRes.invested,
      };
    });
  }, [investment, rate, duration, fdType]);

  // ─── CUSTOM RECHARTS TOOLTIP ───
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const typeLabel =
        FD_TYPE_OPTIONS.find((o) => o.value === fdType)?.label || "";

      return (
        <div className="bg-white p-3 rounded-md border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] min-w-[200px] text-xs z-50">
          <p className="font-bold text-slate-500 mb-2 border-b border-slate-100 pb-2 flex justify-between">
            <span>Duration: {data.duration} Years</span>
            <span className="text-distributor-600">{rate}% p.a</span>
          </p>
          <div className="space-y-1.5">
            <div className="flex justify-between gap-4">
              <span className="text-slate-500 font-medium">Principal</span>
              <span className="font-bold text-slate-700">
                {formatCurrency(data.invested)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500 font-medium">
                Interest Earned
              </span>
              <span className="font-bold text-distributor-600">
                {formatCurrency(data.interest)}
              </span>
            </div>
            <div className="flex justify-between gap-4 pt-1.5 mt-1.5 border-t border-slate-100 border-dashed">
              <span className="font-bold text-slate-800">Total Maturity</span>
              <span className="font-black text-distributor-700">
                {formatCurrency(
                  data.maturity + (fdType === "CUMULATIVE" ? 0 : data.interest),
                )}
              </span>
            </div>
            <p className="text-[9px] text-slate-400 font-medium uppercase mt-2 pt-2 border-t border-slate-100">
              {typeLabel}
            </p>
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
            Fixed <span className="text-distributor-600">Deposits</span>
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Calculate secure returns with accurate compounding rules.
          </p>
        </div>
      </div>

      {/* ─── RESPONSIVE MAIN GRID ─── */}
      {/* Changed from `grid lg:grid-cols-12 flex-1 min-h-0` to stack beautifully on mobile */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8 shrink-0 w-full">
        {/* ─── INPUTS ─── */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-md border relative z-20"
             style={{ borderColor: 'var(--fin-kpi-border)', boxShadow: '0 4px 15px var(--fin-kpi-shadow)' }}>
          <div className="space-y-3 mb-8 z-20">
            <label className="text-xs font-black uppercase text-slate-500">
              Type of Fixed Deposit
            </label>
            <CalculatorSelect
              options={FD_TYPE_OPTIONS}
              value={fdType}
              onChange={(val) => setFdType(val as FDType)}
            />
          </div>

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
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-md border min-h-[350px] lg:min-h-0 lg:h-full flex flex-col relative z-10"
             style={{ borderColor: 'var(--fin-kpi-border)', boxShadow: '0 4px 15px var(--fin-kpi-shadow)' }}>
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
                  value: "Wealth Value",
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

              <Area
                type="monotone"
                dataKey="invested"
                name="Principal Invested"
                stackId="1"
                stroke="none"
                fill="var(--fin-chart-color-1)"
                animationDuration={800}
              />
              <Area
                type="monotone"
                dataKey="interest"
                name="Total Interest"
                stackId="1"
                stroke="none"
                fill="var(--fin-chart-color-4)"
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── SUMMARY CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0 relative z-0">
        {[
          {
            label: "Invested Amount",
            val: results.invested,
            color: "text-slate-900",
          },
          {
            label:
              fdType === "CUMULATIVE"
                ? "Est. Returns (Per Year)"
                : `Payout (${fdType.replace("_", " ")})`,
            val:
              fdType === "CUMULATIVE"
                ? results.avgAnnualReturn
                : results.periodicPayout,
            color: "text-[var(--fin-chart-color-4)]",
          },
          {
            label: "Total Interest Earned",
            val: results.totalInterest,
            color: "text-slate-900",
          },
          {
            label:
              fdType === "CUMULATIVE"
                ? "Total Maturity Amount"
                : "Principal Returned (Maturity)",
            val:
              results.maturity +
              (fdType === "CUMULATIVE" ? 0 : results.totalInterest),
            color:
              "text-distributor-700 bg-distributor-50 -m-5 p-5 h-[calc(100%+40px)] rounded-md flex flex-col justify-center border border-distributor-100",
          },
        ].map((card, i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-md border relative overflow-hidden"
            style={{ borderColor: 'var(--fin-kpi-border)', boxShadow: '0 4px 15px var(--fin-kpi-shadow)' }}
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
