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
            <h2 className="text-xl font-black text-[var(--fin-heading-primary)] tracking-tight mb-6">Profile Information</h2>
            <div>
              <label className="block text-[10px] font-black text-[var(--fin-muted-text)] uppercase tracking-widest mb-2">Full Name</label>
              <input type="text" defaultValue="FinIQ Partner" className="w-full px-4 py-3 bg-[var(--fin-table-bg)] border border-[var(--fin-border)] rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--fin-brand-600)]/20 focus:border-[var(--fin-brand-600)] transition-all" />
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-[var(--fin-muted-text)] uppercase tracking-widest mb-2">Email Address</label>
              <input type="email" defaultValue="partner@finiq.com" className="w-full px-4 py-3 bg-[var(--fin-table-bg)] border border-[var(--fin-border)] rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--fin-brand-600)]/20 focus:border-[var(--fin-brand-600)] transition-all" />
            </div>

            <div>
              <label className="block text-[10px] font-black text-[var(--fin-muted-text)] uppercase tracking-widest mb-2">Phone Number</label>
              <input type="tel" defaultValue="+91 98765 43210" className="w-full px-4 py-3 bg-[var(--fin-table-bg)] border border-[var(--fin-border)] rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--fin-brand-600)]/20 focus:border-[var(--fin-brand-600)] transition-all" />
            </div>

            <div className="pt-4 border-t border-[var(--fin-border-subtle)] flex gap-4">
              <button className="px-6 py-3 bg-[var(--fin-brand-600)] text-[var(--fin-btn-primary-text)] rounded-md font-bold text-sm hover:bg-[var(--fin-brand-700)] transition-all shadow-lg shadow-[var(--fin-brand-600)]/20">
                Save Changes
              </button>
              <button className="px-6 py-3 bg-[var(--fin-table-bg)] border border-[var(--fin-border)] text-[var(--fin-body-text)] rounded-md font-bold text-sm hover:bg-[var(--fin-page-bg)] transition-all">
                Cancel
              </button>
            </div>
          </div>
        );

      // case 'notifications':
        return (
          <div className="space-y-8 max-w-xl mx-auto animate-[fadeIn_0.3s_ease-out]">
            <h2 className="text-xl font-black text-[var(--fin-heading-primary)] tracking-tight mb-6">Notification Preferences</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-[var(--fin-page-bg)] rounded-md border border-[var(--fin-border-subtle)]">
                <div>
                  <h3 className="font-black text-[var(--fin-heading-primary)] text-sm">Daily Brokerage Summary</h3>
                  <p className="text-xs font-medium text-[var(--fin-muted-text)] mt-0.5">Receive an email with your daily generated commissions.</p>
                </div>
                <div className="w-11 h-6 bg-[var(--fin-brand-500)] rounded-full relative cursor-pointer shadow-inner">
                  <div className="w-4 h-4 bg-[var(--fin-table-bg)] rounded-full absolute top-1 left-6 shadow-sm transition-all" />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-[var(--fin-page-bg)] rounded-md border border-[var(--fin-border-subtle)]">
                <div>
                  <h3 className="font-black text-[var(--fin-heading-primary)] text-sm">Client SIP Bounces</h3>
                  <p className="text-xs font-medium text-[var(--fin-muted-text)] mt-0.5">Get immediate alerts when a client SIP payment fails.</p>
                </div>
                <div className="w-11 h-6 bg-[var(--fin-brand-500)] rounded-full relative cursor-pointer shadow-inner">
                  <div className="w-4 h-4 bg-[var(--fin-table-bg)] rounded-full absolute top-1 left-6 shadow-sm transition-all" />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-[var(--fin-page-bg)] rounded-md border border-[var(--fin-border-subtle)]">
                <div>
                  <h3 className="font-black text-[var(--fin-heading-primary)] text-sm">New Client Onboarding</h3>
                  <p className="text-xs font-medium text-[var(--fin-muted-text)] mt-0.5">Notify me when a new client completes their KYC via my link.</p>
                </div>
                <div className="w-11 h-6 bg-[var(--fin-skeleton-base)] rounded-full relative cursor-pointer shadow-inner transition-colors">
                  <div className="w-4 h-4 bg-[var(--fin-table-bg)] rounded-full absolute top-1 left-1 shadow-sm transition-all" />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-[var(--fin-page-bg)] rounded-md border border-[var(--fin-border-subtle)]">
                <div>
                  <h3 className="font-black text-[var(--fin-heading-primary)] text-sm">System Updates & Maintenance</h3>
                  <p className="text-xs font-medium text-[var(--fin-muted-text)] mt-0.5">Important platform announcements and downtime schedules.</p>
                </div>
                <div className="w-11 h-6 bg-[var(--fin-brand-500)] rounded-full relative cursor-pointer shadow-inner">
                  <div className="w-4 h-4 bg-[var(--fin-table-bg)] rounded-full absolute top-1 left-6 shadow-sm transition-all" />
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
          <h1 className="text-3xl font-black tracking-tight text-[var(--fin-heading-primary)]">
            Account <span className="bg-clip-text bg-gradient-to-r text-[var(--fin-brand-600)]">Settings</span>
          </h1>
          <p className="text-[var(--fin-muted-text)] font-medium mt-1 text-sm">Manage your preferences and platform security.</p>
        </div>
      </div>

      <div className="bg-[var(--fin-table-bg)] rounded-3xl border border-[var(--fin-border)] shadow-sm overflow-hidden flex flex-col h-full min-h-[600px]">
        
        {/* Horizontal Tabs */}
        <div className="w-full bg-[var(--fin-page-bg)]/50 border-b border-[var(--fin-border-subtle)] p-4 sm:px-8 flex flex-row gap-4 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-colors ${activeTab === 'profile' ? 'bg-[var(--fin-heading-primary)] text-[var(--fin-btn-primary-text)] shadow-md' : 'bg-[var(--fin-table-bg)] text-[var(--fin-body-text)] border border-[var(--fin-border)] hover:bg-[var(--fin-skeleton-base)]'}`}
          >
            <User className="w-4 h-4" /> Profile Information
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-colors ${activeTab === 'notifications' ? 'bg-[var(--fin-heading-primary)] text-[var(--fin-btn-primary-text)] shadow-md' : 'bg-[var(--fin-table-bg)] text-[var(--fin-body-text)] border border-[var(--fin-border)] hover:bg-[var(--fin-skeleton-base)]'}`}
          >
            <Bell className="w-4 h-4" /> Notifications
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-colors ${activeTab === 'security' ? 'bg-[var(--fin-heading-primary)] text-[var(--fin-btn-primary-text)] shadow-md' : 'bg-[var(--fin-table-bg)] text-[var(--fin-body-text)] border border-[var(--fin-border)] hover:bg-[var(--fin-skeleton-base)]'}`}
          >
            <Shield className="w-4 h-4" /> Privacy & Security
          </button>
          
          {hasAppearanceAccess && (
            <button 
              onClick={() => setActiveTab('appearance')}
              className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-colors ${activeTab === 'appearance' ? 'bg-[var(--fin-brand-600)] text-[var(--fin-btn-primary-text)] shadow-md' : 'bg-[var(--fin-table-bg)] text-[var(--fin-body-text)] border border-[var(--fin-border)] hover:bg-[var(--fin-skeleton-base)]'}`}
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