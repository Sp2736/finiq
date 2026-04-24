"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutButton from '@/components/investor/LogoutButton';
import { 
  LayoutDashboard, 
  Users, 
  UserSquare2, 
  BarChart3, 
  Calculator,
  Settings,
  ChevronRight,
  ChevronLeft,
  Menu,
  X
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/distributor', icon: LayoutDashboard },
  { name: 'Client Management', href: '/distributor/clients', icon: Users },
  { name: 'User Management', href: '/distributor/users', icon: UserSquare2 },
  { name: 'Reports', href: '/distributor/reports', icon: BarChart3 },
  { name: 'Calculators', href: '/distributor/calculators', icon: Calculator },
];

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
}

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-600"
      >
        <Menu className="w-5 h-5" />
      </button>

      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside 
        className={`h-screen bg-white/80 backdrop-blur-xl border-r border-slate-200 flex flex-col fixed left-0 top-0 z-50 transition-all duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} 
        ${isCollapsed ? 'w-24' : 'w-72'}`}
      >
        <div className={`p-8 pb-10 flex items-center ${isCollapsed ? 'justify-center px-4' : 'justify-between'}`}>
          <Link href="/distributor" className="flex items-center gap-3 group overflow-hidden">
            <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-emerald-600 to-teal-800 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/20 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            {!isCollapsed && (
              <div className="animate-[fadeIn_0.2s_ease-in] whitespace-nowrap">
                <span className="text-xl font-black tracking-tight text-slate-900 block leading-none">FinIQ</span>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1 block">Distributor</span>
              </div>
            )}
          </Link>
          <button onClick={() => setIsMobileOpen(false)} className="lg:hidden text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto scrollbar-none">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                title={isCollapsed ? item.name : undefined}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-4 py-3 rounded-2xl transition-all duration-300 group ${
                  isActive 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                    : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`w-5 h-5 shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                  {!isCollapsed && <span className="font-bold text-sm tracking-tight whitespace-nowrap animate-[fadeIn_0.2s_ease-in]">{item.name}</span>}
                </div>
                {!isCollapsed && isActive && <div className="w-1.5 h-1.5 shrink-0 bg-white rounded-full" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 mt-auto border-t border-slate-100 flex flex-col gap-4">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden lg:flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-4'} py-2 text-slate-400 hover:text-slate-700 transition-colors w-full`}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5 shrink-0" /> : <ChevronLeft className="w-5 h-5 shrink-0" />}
            {!isCollapsed && <span className="text-sm font-bold uppercase tracking-wider whitespace-nowrap">Collapse</span>}
          </button>

          <Link 
            href="/distributor/settings" 
            title={isCollapsed ? "Settings" : undefined}
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-4'} py-2 text-slate-500 hover:text-emerald-600 transition-colors group`}
          >
            <Settings className="w-5 h-5 shrink-0 group-hover:rotate-45 transition-transform duration-500" />
            {!isCollapsed && <span className="text-sm font-bold uppercase tracking-wider whitespace-nowrap">Settings</span>}
          </Link>
          
          <div className={`w-full ${isCollapsed ? 'flex justify-center' : ''}`}>
             {isCollapsed ? (
                <Link href="/distributor-portal" title="Sign Out" className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                </Link>
             ) : (
                <LogoutButton portal="staff" redirectTo="/distributor-portal" />
             )}
          </div>
        </div>
      </aside>
    </>
  );
}