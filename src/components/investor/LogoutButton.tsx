"use client";

import { useRouter } from "next/navigation";
import { removeAuthCookies, PortalType } from "@/lib/authClient";

interface LogoutButtonProps {
  portal?: PortalType;
  redirectTo?: string;
}

export default function LogoutButton({
  portal = "investor",
  redirectTo = "/login",
}: LogoutButtonProps) {
  const router = useRouter();

  const handleLogout = () => {
    // 1. Clear the auth cookies
    removeAuthCookies(portal);

    // 2. Clear the dynamic logo from local storage
    localStorage.removeItem("company_logo_base64");

    // 3. Redirect to the login page
    router.push(redirectTo);
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-[var(--fin-table-bg)]/60 hover:bg-[var(--fin-badge-danger-bg)] border border-[var(--fin-border)] hover:border-[var(--fin-badge-danger-border)] text-[var(--fin-body-text)] hover:text-[var(--fin-badge-danger-text)] transition-all duration-300 backdrop-blur-md shadow-sm group"
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
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        />
      </svg>
      <span className="text-sm font-bold">Sign Out</span>
    </button>
  );
}
