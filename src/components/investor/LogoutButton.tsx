"use client";

import { useRouter } from "next/navigation";
import { removeAuthCookies, PortalType } from "@/lib/authClient";

interface LogoutButtonProps {
  portal?: PortalType;
  redirectTo?: string;
  isCollapsed?: boolean;
}

export default function LogoutButton({
  portal = "investor",
  redirectTo = "/login",
  isCollapsed = false,
}: LogoutButtonProps) {
  const router = useRouter();

  const handleLogout = () => {
    // 1. Clear the auth cookies
    removeAuthCookies(portal);

    // 2. Clear the dynamic logo from local storage
    if (portal === "investor") {
      localStorage.removeItem("company-logo-inv");
    } else {
      localStorage.removeItem("company-logo-dis");
    }

    // 3. Redirect to the login page
    router.push(redirectTo);
  };

  if (isCollapsed) {
    return (
      <button
        onClick={handleLogout}
        title="Sign Out"
        className="p-2.5 text-[var(--fin-sidebar-collapse-icon-color)] hover:text-[var(--fin-sidebar-icon-logout-hover)] hover:bg-[var(--fin-sidebar-icon-logout-hover-bg)] rounded-md transition-colors flex items-center justify-center w-full"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          ></path>
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-[var(--fin-table-bg)]/60 hover:bg-[var(--fin-badge-danger-bg)] border border-[var(--fin-border)] hover:border-[var(--fin-badge-danger-border)] text-[var(--fin-body-text)] hover:text-[var(--fin-badge-danger-text)] transition-all duration-300 backdrop-blur-md shadow-sm group w-full"
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
