"use client";

import React, { useState } from 'react';
import Sidebar from '@/components/distributor/Sidebar';

export default function DistributorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50/50 overflow-hidden selection:bg-emerald-100 selection:text-emerald-900">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      {/* CRITICAL CHANGE: Changed overflow-y-auto to overflow-hidden and forced h-screen. 
        This locks the outer viewport so children handle their own inner scrolling.
      */}
      <main 
        className={`flex-1 relative transition-all duration-300 ease-in-out h-screen overflow-hidden
        ${isCollapsed ? 'lg:ml-24' : 'lg:ml-72'}`}
      >
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] pointer-events-none mix-blend-overlay" />
        <div className="w-full h-full max-w-[1600px] mx-auto p-4 sm:p-5 md:p-6 lg:p-8 flex flex-col relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}