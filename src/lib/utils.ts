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

export const getDynamicFinancialYears = (startYear: number = 2010) => {
  const today = new Date();
  const currentMonth = today.getMonth(); // 0-indexed (0 = Jan, 3 = Apr)
  const currentYear = today.getFullYear();

  // If the current month is before April (Jan-Mar), the current FY started last year
  const maxYear = currentMonth < 3 ? currentYear - 1 : currentYear;

  const fyOptions = [];
  for (let year = maxYear; year >= startYear; year--) {
    const nextYearShort = String(year + 1).slice(2);
    fyOptions.push(`${year}-${nextYearShort}`);
  }
  
  return fyOptions;
};

export function decodeJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};