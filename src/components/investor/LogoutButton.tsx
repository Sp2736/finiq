"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    // 1. Clear the authentication cookie by expiring it immediately
    document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    
    // 2. Redirect the user back to the login screen
    router.push('/login');
  };

  return (
    <button 
      onClick={handleLogout}
      className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md rounded-full border border-slate-200/60 shadow-sm hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all group"
      title="Secure Logout"
    >
      <span className="text-[11px] font-bold text-slate-500 group-hover:text-rose-600 uppercase tracking-widest transition-colors">
        Logout
      </span>
      <svg className="w-4 h-4 text-slate-400 group-hover:text-rose-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
    </button>
  );
}