export const getColorClass = (val: number) => val > 0 ? 'text-emerald-600' : val < 0 ? 'text-rose-600' : 'text-slate-500';
export const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
export const formatCurrencyNoDecimals = (val: number) => `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
export const formatPct = (val: number) => `${val > 0 ? '+' : ''}${val.toFixed(2)}%`;