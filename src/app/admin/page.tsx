"use client";

import LogoutButton from "@/components/investor/LogoutButton";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-background font-sans relative flex items-center justify-center overflow-x-hidden selection:bg-rose-500/20 selection:text-rose-900">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-100 via-white to-slate-200" />
      <div className="absolute inset-0 z-0 opacity-[0.35] bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-[400px] h-[400px] bg-rose-500/10 rounded-full blur-[80px] pointer-events-none z-0" />
      
      <div className="relative z-10 w-full max-w-md p-8 sm:p-10 bg-white/80 backdrop-blur-2xl border border-white shadow-[0_30px_80px_-15px_rgba(0,0,0,0.15)] rounded-[2.5rem] text-center flex flex-col items-center animate-[slideFadeUp_0.5s_ease-out_forwards]">
         <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-slate-900/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full animate-[shine_4s_infinite]" />
            <svg className="w-8 h-8 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
         </div>
         <h1 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Admin Control</h1>
         <p className="text-slate-500 mb-8 font-medium text-sm leading-relaxed">
           No system data to load at this time. Infrastructure modules and user telemetry are pending connection.
         </p>
         <LogoutButton portal="staff" redirectTo="/admin-portal" />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shine {
          0%   { left: -100%; }
          20%  { left: 200%; }
          100% { left: 200%; }
        }
      `}} />
    </div>
  )
}