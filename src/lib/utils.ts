// src/lib/utils.ts

export const formatCurrency = (val?: number | null) => {
  const safeVal = val ?? 0;
  return `₹${safeVal.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
};

export const formatCurrencyNoDecimals = (val?: number | null) => {
  const safeVal = val ?? 0;
  return `₹${safeVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

export const formatPercent = (val?: number | null) => {
  const safeVal = val ?? 0;
  return `${safeVal > 0 ? '+' : ''}${safeVal.toFixed(2)}%`;
};

export const getStatusColor = (val?: number | null) => {
  const safeVal = val ?? 0;
  return safeVal > 0 ? 'text-emerald-600' : safeVal < 0 ? 'text-rose-600' : 'text-slate-600';
};