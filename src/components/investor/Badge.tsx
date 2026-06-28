import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  intent?: 'neutral' | 'success' | 'danger' | 'brand';
}

export default function Badge({ children, intent = 'neutral' }: BadgeProps) {
  const styles = {
    neutral: 'bg-[var(--fin-badge-neutral-bg)] text-[var(--fin-badge-neutral-text)] border-[var(--fin-badge-neutral-border)]',
    success: 'bg-[var(--fin-badge-success-bg)] text-[var(--fin-badge-success-text)] border-[var(--fin-badge-success-border)]',
    danger:  'bg-[var(--fin-badge-danger-bg)] text-[var(--fin-badge-danger-text)] border-[var(--fin-badge-danger-border)]',
    brand:   'bg-[var(--fin-badge-brand-bg)] text-[var(--fin-badge-brand-text)] border-[var(--fin-badge-brand-border)]',
  };
  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border uppercase tracking-wider ${styles[intent]}`}>
      {children}
    </span>
  );
}