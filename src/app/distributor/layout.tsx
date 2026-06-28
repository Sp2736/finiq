"use client";

import React, { useState } from "react";
import Sidebar from "@/components/distributor/Sidebar";
import { ThemeProvider } from "@/context/ThemeContext"; // Adjust path if necessary

export default function DistributorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

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
      <div className="flex h-screen overflow-hidden selection:bg-distributor-100 selection:text-distributor-900" style={{ backgroundColor: 'var(--fin-page-bg)' }}>
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

        {/* CRITICAL CHANGE: Changed overflow-y-auto to overflow-hidden and forced h-screen. 
          This locks the outer viewport so children handle their own inner scrolling.
        */}
        <main
          className={`flex-1 relative transition-all duration-300 ease-in-out h-screen overflow-hidden
          ${isCollapsed ? "lg:ml-24" : "lg:ml-72"}`}
        >
          <div className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay" />
          <div className="w-full h-full max-w-[1600px] mx-auto p-4 sm:p-5 md:p-6 lg:p-8 flex flex-col relative z-10">
            {children}
          </div>
        </main>
      </div>
    </ThemeProvider>
    </>
  );
}
