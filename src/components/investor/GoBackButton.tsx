"use client";

import { useRouter } from "next/navigation";

interface GoBackButtonProps {
  fallbackRoute?: string;
}

export default function GoBackButton({
  fallbackRoute = "/investor",
}: GoBackButtonProps) {

  const router = useRouter();

  const handleGoBack = () => {
    // Always route directly back to the dashboard/fallback instead of using browser history
    router.push(fallbackRoute);
  };

  return (
    <button
      onClick={handleGoBack}
      className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-[var(--fin-table-bg)]/60 hover:bg-[var(--fin-brand-50)] border border-[var(--fin-border)] hover:border-[var(--fin-brand-200)] text-[var(--fin-body-text)] hover:text-[var(--fin-brand-700)] transition-all duration-300 backdrop-blur-md shadow-sm group"
    >
      <svg
        className="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M15 19l-7-7 7-7"
        />
      </svg>

      <span className="text-sm font-bold">
        Go Back
      </span>
    </button>
  );
}