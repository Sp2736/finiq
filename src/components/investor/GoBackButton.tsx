"use client";

import { useRouter } from "next/navigation";

interface GoBackButtonProps {
  fallbackRoute?: string;
}

export default function GoBackButton({
  fallbackRoute = "/",
}: GoBackButtonProps) {

  const router = useRouter();

  const handleGoBack = () => {

    // If browser history exists
    if (window.history.length > 1) {
      router.back();
    } else {
      // Fallback route
      router.push(fallbackRoute);
    }
  };

  return (
    <button
      onClick={handleGoBack}
      className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-white/60 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-600 hover:text-blue-700 transition-all duration-300 backdrop-blur-md shadow-sm group"
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