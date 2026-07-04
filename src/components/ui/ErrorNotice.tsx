import React from 'react';
import { XCircle, X } from 'lucide-react';

interface ErrorNoticeProps {
  message: string | null;
  onClose?: () => void;
}

export default function ErrorNotice({ message, onClose }: ErrorNoticeProps) {
  if (!message) return null;

  return (
    <div className="mb-4 flex items-start gap-3 p-4 rounded-xl bg-[var(--fin-badge-danger-bg)] border border-[var(--fin-badge-danger-border)] text-[var(--fin-badge-danger-text)] shadow-sm animate-in fade-in slide-in-from-top-2">
      <XCircle size={20} className="shrink-0 mt-0.5" />
      <div className="flex-1 text-sm font-medium leading-relaxed">
        {message}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 p-1 rounded-md hover:bg-black/5 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--fin-badge-danger-text)]/30"
          aria-label="Close error notice"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
