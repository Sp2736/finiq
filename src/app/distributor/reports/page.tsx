"use client";

import React from 'react';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black text-slate-900">Reports</h1>
      <div className="p-12 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 text-slate-400">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-700 mb-2">Module Under Development</h2>
        <p className="text-slate-500 max-w-sm">Generating comprehensive reports for your partner network.</p>
      </div>
    </div>
  );
}
