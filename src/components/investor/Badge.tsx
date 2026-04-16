import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  intent?: 'neutral' | 'success' | 'danger' | 'brand';
}

export default function Badge({ children, intent = 'neutral' }: BadgeProps) {
  const styles = {
    neutral: 'bg-slate-100 text-slate-600 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    danger: 'bg-rose-50 text-rose-700 border-rose-200/60',
    brand: 'bg-indigo-50 text-indigo-700 border-indigo-200/60'
  };
  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border uppercase tracking-wider ${styles[intent]}`}>
      {children}
    </span>
  );
}