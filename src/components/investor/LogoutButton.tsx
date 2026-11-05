"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { removeAuthCookies, PortalType } from "@/lib/authClient";
import { LogOut } from "lucide-react";

interface LogoutButtonProps {
  portal?: PortalType;
  redirectTo?: string;
  isCollapsed?: boolean;
  className?: string;
  label?: string;
  showIcon?: boolean;
}

export default function LogoutButton({
  portal = "investor",
  redirectTo = "/login",
  isCollapsed = false,
  className = "",
  label = "Sign Out",
  showIcon = true,
}: LogoutButtonProps) {
  const router = useRouter();

  const handleLogout = () => {
    // 1. Clear the auth cookies for both portals
    removeAuthCookies("staff");
    removeAuthCookies("investor");

    // 2. Clear all session and role state
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("finiq_mock_user");
      sessionStorage.removeItem("finiq_current_role");
      sessionStorage.removeItem("activeClientId");
      sessionStorage.removeItem("viewClientId");

      localStorage.removeItem("company-logo-inv");
      localStorage.removeItem("company-info-inv");
      localStorage.removeItem("company-logo-dis");
      localStorage.removeItem("company-info-dis");
      localStorage.removeItem("company_id");

      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("company_logo_cache_")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    }

    // 3. Redirect to the login page to select roles
    router.push(redirectTo || "/login");
  };

  if (isCollapsed) {
    return (
      <button
        onClick={handleLogout}
        title={label}
        className={
          className ||
          "p-2.5 text-[var(--fin-sidebar-collapse-icon-color)] hover:text-[var(--fin-sidebar-icon-logout-hover)] hover:bg-[var(--fin-sidebar-icon-logout-hover-bg)] rounded-md transition-colors flex items-center justify-center w-full"
        }
      >
        <LogOut className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      className={
        className ||
        "flex items-center gap-2 px-4 py-2.5 rounded-md bg-[var(--fin-table-bg)]/60 hover:bg-[var(--fin-badge-danger-bg)] border border-[var(--fin-border)] hover:border-[var(--fin-badge-danger-border)] text-[var(--fin-body-text)] hover:text-[var(--fin-badge-danger-text)] transition-all duration-300 backdrop-blur-md shadow-sm group w-full"
      }
    >
      {showIcon && (
        <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
      )}
      <span className="text-sm font-bold">{label}</span>
    </button>
  );
}
