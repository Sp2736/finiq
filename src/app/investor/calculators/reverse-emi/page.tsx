"use client";

import GoBackButton from "@/components/investor/GoBackButton";
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

// fix: check for the formulae for expected returns and recovered value

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
const calculateEMI = (principal: number, annualRate: number, years: number) => {
  if (principal <= 0 || years <= 0) {
    return {
      principal: 0,
      emi: 0,
      totalInterest: 0,
      totalRepayment: 0,
    };
  }

  const r = annualRate / 12 / 100; // monthly interest rate
  const n = years * 12; // total number of months

  let emi: number;

  if (r === 0) {
    emi = principal / n;
  } else {
    emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }

  const totalRepayment = emi * n;
  const totalInterest = totalRepayment - principal; // always >= 0 when r >= 0

  return {
    principal: Number(principal.toFixed(2)),
    emi: Number(emi.toFixed(2)),
    totalInterest: Number(totalInterest.toFixed(2)),
    totalRepayment: Number(totalRepayment.toFixed(2)),
  };
};

const calculateRequiredSIP = (
  targetAmount: number,
  annualRate: number,
  years: number,
) => {
  if (targetAmount <= 0 || years <= 0) {
    return {
      requiredSIP:      0,
      totalInvested:    0,
      wealthGained:     0,
      corpusAtMaturity: 0,
    };
  }

  const r = annualRate / 12 / 100;
  const n = years * 12;

  let rawSIP: number;

  if (r === 0) {
    rawSIP = targetAmount / n;
  } else {
    // Annuity-due (start of month) as seen from example
    const fvFactor = ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    rawSIP = targetAmount / fvFactor;
  }

  // FIX: Round SIP to whole rupee first, then recompute FV from it
  const requiredSIP = Math.round(rawSIP);

  // FIX: Recompute actual corpus from the rounded SIP (not targetAmount)
  const corpusAtMaturity = r === 0
    ? requiredSIP * n
    : requiredSIP * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);

  const totalInvested = requiredSIP * n;

  // FIX: Exp. Returns = what the SIP actually grew to, minus what you put in
  const wealthGained = corpusAtMaturity - totalInvested;

  return {
    requiredSIP:      Number(requiredSIP.toFixed(2)),
    totalInvested:    Number(Math.max(0, totalInvested).toFixed(2)),
    wealthGained:     Number(Math.max(0, wealthGained).toFixed(2)),
    corpusAtMaturity: Number(Math.max(0, corpusAtMaturity).toFixed(2)),
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

export default function ReverseEMICalculator() {
  // ─── STATE MANAGEMENT ───
  // Loan States
  const [loan, setLoan] = useState<number>(5000000); // Default ₹50 L
  const [loanRate, setLoanRate] = useState<number>(8.5); // Default 8.5%
  const [tenure, setTenure] = useState<number>(15); // Default 15 Years

  // SIP Offset States
  const [sipRate, setSipRate] = useState<number>(12); // Default 12%

  // ─── DYNAMIC CONFIG ───
  const limits = {
    LOAN: { min: 50000, max: 200000000, step: 50000 }, // Max 20 Cr
    LOAN_RATE: { min: 1, max: 20, step: 0.1 },
    TENURE: { min: 1, max: 40, step: 1 },
    SIP_RATE: { min: 1, max: 30, step: 0.1 },
  };

  // ─── CORE COMPUTATIONS ───
  const loanResults = useMemo(() => {
    return calculateEMI(loan, loanRate, tenure);
  }, [loan, loanRate, tenure]);

  const sipInterestOffset = useMemo(() => {
    return calculateRequiredSIP(loanResults.totalInterest, sipRate, tenure);
  }, [loanResults.totalInterest, sipRate, tenure]);

  const sipTotalOffset = useMemo(() => {
    return calculateRequiredSIP(loanResults.totalRepayment, sipRate, tenure);
  }, [loanResults.totalRepayment, sipRate, tenure]);

  // ─── DYNAMIC CHART DATA (MEDIAN LOGIC) ───
  const chartData = useMemo(() => {
    const baseStep = tenure >= 15 ? 5 : tenure >= 5 ? 2 : 1;
    let plotIntervals: number[] = [];
    const start = tenure - 2 * baseStep;

    // Calculate strictly the next multiples of 5 after the selected tenure
    const next1 = Math.ceil((tenure + 1) / 5) * 5;
    const next2 = next1 + 5;
    const next3 = next2 + 5;
    const next4 = next3 + 5;

    if (start >= 1) {
      plotIntervals = [
        tenure - 2 * baseStep,
        tenure - baseStep,
        tenure,
        next1, // 1st multiple of 5 after tenure
        next2, // 2nd multiple of 5 after tenure
      ];
    } else if (tenure - baseStep >= 1) {
      plotIntervals = [
        tenure - baseStep,
        tenure,
        next1,
        next2,
        next3,
      ];
    } else {
      plotIntervals = [
        tenure,
        next1,
        next2,
        next3,
        next4,
      ];
    }

    return plotIntervals.map((y) => {
      const stepRes = calculateEMI(loan, loanRate, y);
      return {
        yearLabel: `${y} Yr`,
        duration: y,
        principal: stepRes.principal,
        totalInterest: stepRes.totalInterest,
        totalRepayment: stepRes.totalRepayment,
        emi: stepRes.emi,
      };
    });
  }, [loan, loanRate, tenure]);

  // ─── CUSTOM RECHARTS TOOLTIP ───
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-md border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] min-w-[210px] text-xs z-50">
          <p className="font-bold text-slate-500 mb-2 border-b border-slate-100 pb-2 flex justify-between">
            <span>Duration: {data.duration} Years</span>
          </p>
          <div className="space-y-1.5">
            <div className="flex justify-between gap-4">
              <span className="text-slate-500 font-medium">Monthly EMI</span>
              <span className="font-bold text-slate-700">
                {formatCurrency(data.emi)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500 font-medium">Principal</span>
              <span className="font-bold text-[#10b981]">
                {formatCurrency(data.principal)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500 font-medium">Total Interest</span>
              <span className="font-bold text-[#8b5cf6]">
                {formatCurrency(data.totalInterest)}
              </span>
            </div>
            <div className="flex justify-between gap-4 pt-1.5 mt-1.5 border-t border-slate-100 border-dashed">
              <span className="font-bold text-slate-800">Total Repayment</span>
              <span className="font-black text-distributor-700">
                {formatCurrency(data.totalRepayment)}
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
            Reverse <span className="text-investor-600">EMI</span>
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Calculate loan repayment and formulate a SIP offset strategy.
          </p>
        </div>
        <div className="flex justify-end">
          <GoBackButton fallbackRoute="/investor" />
        </div>
      </div>

      {/* =========================================
          SECTION 1: LOAN EMI CALCULATOR
      ========================================= */}
      <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 shrink-0">
        {/* ─── LOAN INPUTS ─── */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-md border border-slate-200 shadow-sm flex flex-col justify-center relative">
          <div className="z-10 space-y-8">
            <SyncedSlider
              label="Loan Amount"
              value={loan}
              setter={setLoan}
              min={limits.LOAN.min}
              max={limits.LOAN.max}
              step={limits.LOAN.step}
              unit="₹"
            />
            <SyncedSlider
              label="Rate of Interest (p.a)"
              value={loanRate}
              setter={setLoanRate}
              min={limits.LOAN_RATE.min}
              max={limits.LOAN_RATE.max}
              step={limits.LOAN_RATE.step}
              unit="%"
            />
            <SyncedSlider
              label="Loan Tenure (Years)"
              value={tenure}
              setter={setTenure}
              min={limits.TENURE.min}
              max={limits.TENURE.max}
              step={limits.TENURE.step}
              unit="Yr"
            />
          </div>
        </div>

        {/* ─── LOAN CHART ─── */}
        <div className="lg:col-span-7 bg-white p-6 rounded-md border border-slate-200 shadow-sm h-[360px] flex flex-col relative z-0">
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
                  value: "Repayment Value",
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
                dataKey="principal"
                name="Principal Amount"
                stackId="a"
                fill="#10b981"
                radius={[0, 0, 4, 4]}
                maxBarSize={60}
                animationDuration={800}
              />
              <Bar
                dataKey="totalInterest"
                name="Total Interest"
                stackId="a"
                fill="#3d60ab"
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
                animationDuration={800}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── LOAN SUMMARY CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {[
          {
            label: "Monthly EMI",
            val: loanResults.emi,
            color: "text-slate-900",
          },
          {
            label: "Principal Amount",
            val: loanResults.principal,
            color: "text-[#10b981]",
          }, // Match Chart Green
          {
            label: "Total Interest",
            val: loanResults.totalInterest,
            color: "text-[#3d60ab]",
          },
          {
            label: "Total Value (Repayment)",
            val: loanResults.totalRepayment,
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

      {/* =========================================
          SECTION 2: SIP OFFSET ANALYZER
      ========================================= */}
      <div className="mt-4 pt-8 border-t border-slate-200/60 shrink-0">
        <h2 className="text-xl font-black text-slate-900 tracking-tight mb-6">
          SIP Offset Strategy
        </h2>

        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
          {/* SIP RATE INPUT */}
          <div className="lg:col-span-4 bg-white p-6 rounded-md border border-slate-200 shadow-sm flex flex-col justify-center">
            <div className="z-10">
              <SyncedSlider
                label="SIP Expected Return (p.a)"
                value={sipRate}
                setter={setSipRate}
                min={limits.SIP_RATE.min}
                max={limits.SIP_RATE.max}
                step={limits.SIP_RATE.step}
                unit="%"
              />
            </div>
            <p className="text-xs text-slate-400 font-medium mt-4">
              Adjust the return rate to see how much monthly SIP is required to
              recover your loan costs over {tenure} years.
            </p>
          </div>

          {/* OFFSET RESULT BLOCKS */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Block 1: Offset Interest Only */}
            <div className="bg-slate-50 p-6 rounded-md border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
                  Target Recovery
                </p>
                <h3 className="text-base font-black text-slate-800 mb-6">
                  Recover Total Interest Only
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
                    <span className="text-sm font-semibold text-slate-500">
                      Required SIP / Mo
                    </span>
                    <span className="text-lg font-black text-distributor-700">
                      {formatCurrency(sipInterestOffset.requiredSIP)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
                    <span className="text-sm font-semibold text-slate-500">
                      Expected Returns Generated
                    </span>
                    <span className="text-lg font-black text-emerald-600">
                      {formatCurrency(sipInterestOffset.wealthGained)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-500">
                      Recovered Value
                    </span>
                    <span className="text-lg font-black text-slate-900">
                      {formatCurrency(sipInterestOffset.corpusAtMaturity)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Block 2: Offset Entire Repayment */}
            <div className="bg-distributor-50 p-6 rounded-md border border-distributor-100 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-distributor-400 tracking-widest mb-1">
                  Target Recovery
                </p>
                <h3 className="text-base font-black text-distributor-900 mb-6">
                  Recover Entire Repayment Amount
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-distributor-200/60 pb-3">
                    <span className="text-sm font-semibold text-distributor-600/80">
                      Required SIP / Mo
                    </span>
                    <span className="text-lg font-black text-distributor-700">
                      {formatCurrency(sipTotalOffset.requiredSIP)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-distributor-200/60 pb-3">
                    <span className="text-sm font-semibold text-distributor-600/80">
                      Expected Returns Generated
                    </span>
                    <span className="text-lg font-black text-emerald-600">
                      {formatCurrency(sipTotalOffset.wealthGained)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-distributor-600/80">
                      Recovered Value
                    </span>
                    <span className="text-lg font-black text-slate-900">
                      {formatCurrency(sipTotalOffset.corpusAtMaturity)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
