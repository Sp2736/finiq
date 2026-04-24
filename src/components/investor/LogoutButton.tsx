"use client";

import { useRouter } from 'next/navigation';
import { removeAuthCookies, PortalType } from '@/lib/authClient';

interface LogoutButtonProps {
  portal?: PortalType;
  redirectTo?: string;
}

export default function LogoutButton({ portal = 'investor', redirectTo = '/login' }: LogoutButtonProps) {
  const router = useRouter();

  const handleLogout = () => {
    removeAuthCookies(portal);
    router.push(redirectTo);
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-white/60 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600 transition-all duration-300 backdrop-blur-md shadow-sm group"
    >
      <svg
        className="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      <span className="text-sm font-bold">Sign Out</span>
    </button>
  );
}