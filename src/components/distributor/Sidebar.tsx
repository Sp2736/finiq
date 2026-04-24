"use client";

import React from 'react';
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
  ChevronRight
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/distributor', icon: LayoutDashboard },
  { name: 'Client Management', href: '/distributor/clients', icon: Users },
  { name: 'User Management', href: '/distributor/users', icon: UserSquare2 },
  { name: 'Reports', href: '/distributor/reports', icon: BarChart3 },
  { name: 'Calculators', href: '/distributor/calculators', icon: Calculator },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 h-screen bg-white/80 backdrop-blur-xl border-r border-slate-200 flex flex-col fixed left-0 top-0 z-50">
      {/* Logo Section */}
      <div className="p-8 pb-10">
        <Link href="/distributor" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-800 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/20 group-hover:scale-110 transition-transform duration-300">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-slate-900 block leading-none">FinIQ</span>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1 block">Distributor</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 group ${
                isActive 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                  : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="font-bold text-sm tracking-tight">{item.name}</span>
              </div>
              {isActive && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-6 mt-auto border-t border-slate-100 space-y-4">
        <Link href="/distributor/settings" className="flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-emerald-600 transition-colors group">
          <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform duration-500" />
          <span className="text-sm font-bold uppercase tracking-wider">Settings</span>
        </Link>
        <div className="w-full">
            <LogoutButton portal="staff" redirectTo="/distributor-portal" />
        </div>
      </div>
    </aside>
  );
}
