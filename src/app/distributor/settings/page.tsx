"use client";

import React, { useState, useEffect } from 'react';
import { User, Bell, Shield, Key, Smartphone, Monitor, Lock, Palette } from 'lucide-react';
import { decodeJwt } from '@/lib/utils';
import ThemePanel from '@/components/settings/ThemePanel';

type TabType = 'profile' | 'notifications' | 'security' | 'appearance';

export default function DistributorSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [hasAppearanceAccess, setHasAppearanceAccess] = useState(false);

  useEffect(() => {
    // Check role for appearance tab access
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };
    
    const token = getCookie('staff-auth-token');
    if (token) {
      const decoded = decodeJwt(token);
      // Assuming role is directly on the payload or in user object. 
      // If it's a list of roles, check accordingly.
      const roles = decoded?.roles || decoded?.user?.roles || [];
      const hasAccess = roles.some((r: any) => {
        const roleName = typeof r === 'string' ? r : r.role;
        return roleName === 'COMPANY_ADMIN' || roleName === 'TENANT_ADMIN';
      });
      setHasAppearanceAccess(hasAccess);
    }
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6 max-w-xl mx-auto animate-[fadeIn_0.3s_ease-out]">
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-6">Profile Information</h2>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Full Name</label>
              <input type="text" defaultValue="FinIQ Partner" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-distributor-600/20 focus:border-distributor-600 transition-all" />
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
              <input type="email" defaultValue="partner@finiq.com" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-distributor-600/20 focus:border-distributor-600 transition-all" />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Phone Number</label>
              <input type="tel" defaultValue="+91 98765 43210" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-distributor-600/20 focus:border-distributor-600 transition-all" />
            </div>

            <div className="pt-4 border-t border-slate-100 flex gap-4">
              <button className="px-6 py-3 bg-distributor-600 text-white rounded-md font-bold text-sm hover:bg-distributor-700 transition-all shadow-lg shadow-distributor-600/20">
                Save Changes
              </button>
              <button className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-md font-bold text-sm hover:bg-slate-50 transition-all">
                Cancel
              </button>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-8 max-w-xl mx-auto animate-[fadeIn_0.3s_ease-out]">
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-6">Notification Preferences</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-md border border-slate-100">
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Daily Brokerage Summary</h3>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">Receive an email with your daily generated commissions.</p>
                </div>
                <div className="w-11 h-6 bg-distributor-500 rounded-full relative cursor-pointer shadow-inner">
                  <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-6 shadow-sm transition-all" />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-md border border-slate-100">
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Client SIP Bounces</h3>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">Get immediate alerts when a client SIP payment fails.</p>
                </div>
                <div className="w-11 h-6 bg-distributor-500 rounded-full relative cursor-pointer shadow-inner">
                  <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-6 shadow-sm transition-all" />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-md border border-slate-100">
                <div>
                  <h3 className="font-black text-slate-900 text-sm">New Client Onboarding</h3>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">Notify me when a new client completes their KYC via my link.</p>
                </div>
                <div className="w-11 h-6 bg-slate-200 rounded-full relative cursor-pointer shadow-inner transition-colors">
                  <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 shadow-sm transition-all" />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-md border border-slate-100">
                <div>
                  <h3 className="font-black text-slate-900 text-sm">System Updates & Maintenance</h3>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">Important platform announcements and downtime schedules.</p>
                </div>
                <div className="w-11 h-6 bg-distributor-500 rounded-full relative cursor-pointer shadow-inner">
                  <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-6 shadow-sm transition-all" />
                </div>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-10 max-w-2xl mx-auto animate-[fadeIn_0.3s_ease-out]">
            
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight mb-6">Security Settings</h2>
              <div className="bg-slate-50 p-6 rounded-md border border-slate-100 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <Lock className="w-5 h-5 text-distributor-600" />
                  <h3 className="font-black text-slate-900">Change Password</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Current Password</label>
                    <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-distributor-600/20 focus:border-distributor-600 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">New Password</label>
                    <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-distributor-600/20 focus:border-distributor-600 transition-all" />
                  </div>
                </div>
                <button className="px-5 py-2.5 bg-slate-900 text-white rounded-md font-bold text-sm hover:bg-slate-800 transition-all mt-2">
                  Update Password
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight mb-4">Two-Factor Authentication (2FA)</h2>
              <div className="flex items-center justify-between p-5 bg-white border border-distributor-100 rounded-md shadow-sm shadow-distributor-600/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-distributor-50 rounded-md flex items-center justify-center text-distributor-600">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">Authenticator App</h3>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">Status: <span className="text-distributor-600 font-bold">Enabled</span></p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-md font-bold text-xs hover:bg-slate-200 transition-all">
                  Manage
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight mb-4">Active Sessions</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-md border border-slate-100">
                  <div className="flex items-center gap-4">
                    <Monitor className="w-5 h-5 text-slate-400" />
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">MacBook Pro - Chrome</h3>
                      <p className="text-[10px] font-medium text-slate-500 mt-0.5 uppercase tracking-widest">Mumbai, India • Current Session</p>
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-distributor-500 rounded-full animate-pulse" />
                </div>
                <div className="flex items-center justify-between p-4 bg-white rounded-md border border-slate-100">
                  <div className="flex items-center gap-4">
                    <Smartphone className="w-5 h-5 text-slate-400" />
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">iPhone 14 Pro - Safari</h3>
                      <p className="text-[10px] font-medium text-slate-500 mt-0.5 uppercase tracking-widest">Ahmedabad, India • Last active 2 hours ago</p>
                    </div>
                  </div>
                  <button className="text-xs font-bold text-rose-600 hover:text-rose-700">Revoke</button>
                </div>
              </div>
            </div>

          </div>
        );
      case 'appearance':
        return (
          <div className="space-y-6 w-full animate-[fadeIn_0.3s_ease-out]">
            <ThemePanel />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col relative z-10 animate-[fadeIn_0.5s_ease-out]">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            Account <span className="bg-clip-text bg-gradient-to-r text-distributor-600">Settings</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1 text-sm">Manage your preferences and platform security.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full min-h-[600px]">
        
        {/* Horizontal Tabs */}
        <div className="w-full bg-slate-50/50 border-b border-slate-100 p-4 sm:px-8 flex flex-row gap-4 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-colors ${activeTab === 'profile' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
          >
            <User className="w-4 h-4" /> Profile Information
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-colors ${activeTab === 'notifications' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
          >
            <Bell className="w-4 h-4" /> Notifications
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-colors ${activeTab === 'security' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
          >
            <Shield className="w-4 h-4" /> Privacy & Security
          </button>
          
          {hasAppearanceAccess && (
            <button 
              onClick={() => setActiveTab('appearance')}
              className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-colors ${activeTab === 'appearance' ? 'bg-distributor-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
            >
              <Palette className="w-4 h-4" /> Appearance
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          {renderContent()}
        </div>

      </div>
    </div>
  );
}