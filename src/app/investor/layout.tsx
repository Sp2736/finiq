"use client";

import React from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import InvestorSidebar from '@/components/investor/InvestorSidebar';

export default function InvestorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var cached = localStorage.getItem('finiq_theme_vars');
                if (cached) {
                  var vars = JSON.parse(cached);
                  var root = document.documentElement;
                  var keys = Object.keys(vars);
                  for (var i = 0; i < keys.length; i++) {
                    root.style.setProperty(keys[i], vars[keys[i]]);
                  }
                }
              } catch(e) {}
            })();
          `,
        }}
      />
      <ThemeProvider>


      <div className="flex h-screen overflow-hidden selection:bg-investor-100 selection:text-investor-900" style={{ backgroundColor: 'var(--fin-page-bg)' }}>
        
        {/* Sidebar remains fixed */}
        <InvestorSidebar 
           onExportHoldings={() => {}}
           onOpenCapitalGains={() => {}}
           isExporting={false}
           isPortfolioLoaded={true}
        />

        <main className="flex-1 relative h-screen overflow-hidden">
          <div className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay" />
          
          {/* ADJUSTMENT: 
            1. Changed p-4...p-8 to a tighter p-4 lg:p-6
            2. Increased max-w to 1700px to match Distributor density
          */}
          <div className="w-full h-full max-w-[1700px] mx-auto flex flex-col relative z-10 overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </ThemeProvider>
    </>
  );
}