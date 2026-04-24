"use client";

import React from 'react';

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black text-slate-900">User Management</h1>
      <div className="p-12 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 text-slate-400">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-700 mb-2">Module Under Development</h2>
        <p className="text-slate-500 max-w-sm">User roles and permissions are being updated for your organization.</p>
      </div>
    </div>
  );
}
