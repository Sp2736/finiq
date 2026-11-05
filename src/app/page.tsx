"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-screen bg-[var(--fin-page-bg)] flex items-center justify-center text-[var(--fin-muted-text)] text-sm">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-[var(--fin-brand-600)] border-t-transparent rounded-full animate-spin" />
        <span>Loading FinIQ Platform...</span>
      </div>
    </div>
  );
}
