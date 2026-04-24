"use client";

import React from 'react';

export default function CalculatorsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black text-slate-900">Calculators</h1>
      <div className="p-12 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 text-slate-400">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-700 mb-2">Module Under Development</h2>
        <p className="text-slate-500 max-w-sm">Advanced financial planning tools are being integrated.</p>
      </div>
    </div>
  );
}
