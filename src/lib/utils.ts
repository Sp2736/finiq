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

export const formatCompactNumber = (number: number) => {
  if (!number) return "₹0";
  if (number >= 10000000) return `₹${(number / 10000000).toFixed(2)} Cr`;
  if (number >= 100000) return `₹${(number / 100000).toFixed(2)} L`;
  if (number >= 1000) return `₹${(number / 1000).toFixed(2)} K`;
  return `₹${number.toFixed(0)}`;
};

export function toTitleCase(str: string | undefined): string {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}