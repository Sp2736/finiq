"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MOCK_ROLES } from "@/lib/mockDatabase";
import { setAuthCookies } from "@/lib/authClient";

export default function AdminPortalRedirect() {
  const router = useRouter();

  useEffect(() => {
    const session = MOCK_ROLES.admin;
    if (typeof window !== "undefined") {
      sessionStorage.setItem("finiq_mock_user", JSON.stringify(session));
      sessionStorage.setItem("finiq_current_role", "admin");
      if (session.company_id) {
        localStorage.setItem("company_id", session.company_id);
      }
      setAuthCookies(session.token, "mock_refresh_token_staff", "staff", session.user_id);
    }
    router.replace("/admin");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0a0f1d] flex items-center justify-center text-slate-400 text-sm">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span>Authenticating Admin Demo Session...</span>
      </div>
    </div>
  );
}
