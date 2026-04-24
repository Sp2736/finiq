import React from 'react';
import Sidebar from '@/components/distributor/Sidebar';

export default function DistributorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      <Sidebar />
      <main className="flex-1 ml-72 h-screen overflow-y-auto overflow-x-hidden relative">
        {/* Background Accents */}
        <div className="fixed inset-0 z-0 opacity-[0.35] bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none" />
        <div className="relative z-10 p-8 lg:p-12">
          {children}
        </div>
      </main>
    </div>
  );
}
