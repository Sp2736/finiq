import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface SuccessNoticeProps {
  message: string | null;
  onClose?: () => void;
}

export default function SuccessNotice({ message, onClose }: SuccessNoticeProps) {
  if (!message) return null;

  return (
    <div className="mb-4 flex items-start gap-3 p-4 rounded-xl bg-[var(--fin-badge-success-bg)] border border-[var(--fin-badge-success-border)] text-[var(--fin-badge-success-text)] shadow-sm animate-in fade-in slide-in-from-top-2">
      <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
      <div className="flex-1 text-sm font-medium leading-relaxed">
        {message}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 p-1 rounded-md hover:bg-black/5 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--fin-badge-success-text)]/30"
          aria-label="Close success notice"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
