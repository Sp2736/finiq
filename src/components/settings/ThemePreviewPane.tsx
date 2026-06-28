"use client";

import React from "react";
import { motion } from "framer-motion";
import { BarChart3, PieChart, Wallet, ArrowUpRight, Search, Bell, Menu, AlertCircle, CheckCircle2, ChevronDown } from "lucide-react";

interface ThemePreviewPaneProps {
  previewVariables: Record<string, string>;
}

export default function ThemePreviewPane({
  previewVariables,
}: ThemePreviewPaneProps) {
  // Apply preview variables as inline styles so they cascade through this container
  return (
    <div
      className="rounded-2xl overflow-hidden border border-[var(--fin-border)] shadow-2xl flex flex-col h-full bg-[var(--fin-page-bg)] transition-colors duration-300 relative z-20"
      style={previewVariables as React.CSSProperties}
    >
      {/* Mock Header */}
      <div className="h-14 bg-[var(--fin-sidebar-bg)] border-b border-[var(--fin-border)] flex items-center px-4 justify-between backdrop-blur-md shrink-0">
        <div className="flex items-center space-x-3">
          <Menu size={18} className="text-[var(--fin-muted-text)]" />
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[var(--fin-brand-500)] to-[var(--fin-brand-900)] flex items-center justify-center text-[var(--fin-btn-primary-text)] text-xs font-bold shadow-sm">
              F
            </div>
            <span className="font-black text-[var(--fin-sidebar-brand-label)] tracking-tight">
              FinIQ
            </span>
          </div>
          <div className="hidden sm:flex items-center space-x-1 ml-4 border-l border-[var(--fin-border)] pl-4">
            <div className="px-2.5 py-1.5 rounded-md bg-[var(--fin-sidebar-item-active-bg)] text-[var(--fin-btn-primary-text)] text-xs font-bold">
              Active
            </div>
            <div className="px-2.5 py-1.5 rounded-md hover:bg-[var(--fin-sidebar-item-hover-bg)] text-[var(--fin-muted-text)] text-xs font-bold transition-colors cursor-pointer">
              Hover
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Search size={16} className="text-[var(--fin-muted-text)]" />
          <div className="relative">
            <Bell size={16} className="text-[var(--fin-muted-text)]" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--fin-badge-danger-bg)] rounded-full border border-[var(--fin-border-subtle)]" />
          </div>
          <div className="w-8 h-8 rounded-full bg-[var(--fin-brand-100)] border border-[var(--fin-brand-200)] flex items-center justify-center text-[var(--fin-brand-900)] text-xs font-bold">
            AD
          </div>
        </div>
      </div>

      {/* Mock Content - Scrollable */}
      <div className="p-5 space-y-6 flex-1 overflow-y-auto bg-[var(--fin-page-bg-subtle)] no-scrollbar">
        
        {/* Page Title & Breadcrumbs */}
        <div>
          <div className="text-[10px] font-bold text-[var(--fin-muted-text)] uppercase tracking-wider mb-1">
            Dashboard / Overview
          </div>
          <h2 className="text-xl font-bold text-[var(--fin-heading-primary)]">
            Welcome back, Admin
          </h2>
          <p className="text-sm font-medium text-[var(--fin-body-text)] mt-1">
            Here is what's happening with your clients today.
          </p>
        </div>

        {/* Alert Banner */}
        <div className="p-3 rounded-lg bg-[var(--fin-brand-50)] border border-[var(--fin-brand-200)] flex items-start space-x-3">
          <AlertCircle size={16} className="text-[var(--fin-brand-600)] mt-0.5 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-[var(--fin-brand-900)]">System Update Completed</h4>
            <p className="text-xs font-medium text-[var(--fin-brand-600)] mt-0.5">All portfolio valuations have been updated to the latest NAVs.</p>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-4 rounded-xl bg-[var(--fin-kpi-bg)] border border-[var(--fin-kpi-border)] shadow-sm"
          >
            <div className="flex justify-between items-start">
              <span className="text-xs text-[var(--fin-kpi-label)] font-bold uppercase tracking-wider">
                Total AUM
              </span>
              <Wallet size={14} className="text-[var(--fin-kpi-icon-color)]" />
            </div>
            <div className="mt-3 text-xl font-black text-[var(--fin-kpi-value-revealed)] tracking-tight">
              ₹42.5 Cr
            </div>
            <div className="mt-2 flex items-center space-x-2">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--fin-analysis-positive-bg)] text-[var(--fin-kpi-positive-text)] flex items-center">
                <ArrowUpRight size={10} className="mr-0.5" /> 12.4%
              </span>
              <span className="text-[10px] font-medium text-[var(--fin-muted-text)]">vs last month</span>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-4 rounded-xl bg-[var(--fin-kpi-bg)] border border-[var(--fin-kpi-border)] shadow-sm"
          >
            <div className="flex justify-between items-start">
              <span className="text-xs text-[var(--fin-kpi-label)] font-bold uppercase tracking-wider">
                Active Clients
              </span>
              <PieChart
                size={14}
                className="text-[var(--fin-kpi-icon-color)]"
              />
            </div>
            <div className="mt-3 text-xl font-black text-[var(--fin-kpi-value-revealed)] tracking-tight">
              1,248
            </div>
            <div className="mt-2 flex items-center space-x-2">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--fin-analysis-positive-bg)] text-[var(--fin-kpi-positive-text)] flex items-center">
                <ArrowUpRight size={10} className="mr-0.5" /> 24
              </span>
              <span className="text-[10px] font-medium text-[var(--fin-muted-text)]">new this week</span>
            </div>
          </motion.div>
        </div>

        {/* Mock Chart Area */}
        <div className="p-5 rounded-xl bg-[var(--fin-content-surface)] border border-[var(--fin-border)] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-sm font-bold text-[var(--fin-heading-secondary)]">
                Growth Trend
              </span>
              <p className="text-[10px] font-medium text-[var(--fin-muted-text)] mt-0.5">Monthly asset accumulation</p>
            </div>
            <button className="p-1.5 rounded-md hover:bg-[var(--fin-page-bg-subtle)] border border-transparent hover:border-[var(--fin-border)] transition-colors">
              <BarChart3 size={14} className="text-[var(--fin-muted-text)]" />
            </button>
          </div>
          <div className="h-28 w-full flex items-end justify-between space-x-2">
            {[40, 70, 45, 90, 65, 100, 85].map((h, i) => (
              <div key={i} className="w-full h-full flex flex-col justify-end items-center gap-2">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="w-full rounded-t-sm opacity-90 hover:opacity-100"
                  style={{ backgroundColor: `var(--fin-chart-color-${(i % 6) + 1})` }}
                />
                <span className="text-[8px] font-bold text-[var(--fin-muted-text)] shrink-0">M{i+1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mock Form Elements */}
        <div className="p-5 rounded-xl bg-[var(--fin-content-surface)] border border-[var(--fin-border)] shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-[var(--fin-heading-secondary)] mb-2">Form Controls</h3>
          
          <div>
            <label className="block text-xs font-bold text-[var(--fin-heading-tertiary)] mb-1.5">Client Search</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fin-muted-text)]" />
              <input 
                type="text" 
                placeholder="Search by name or PAN..." 
                className="w-full pl-9 pr-3 py-2 bg-[var(--fin-page-bg)] border border-[var(--fin-border)] rounded-lg text-sm text-[var(--fin-body-text)] focus:outline-none focus:ring-2 focus:ring-[var(--fin-brand-500)] focus:border-transparent transition-all placeholder:text-[var(--fin-muted-text)]"
                disabled
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--fin-heading-tertiary)] mb-1.5">Account Status</label>
            <div className="relative">
              <select 
                className="w-full pl-3 pr-8 py-2 bg-[var(--fin-page-bg)] border border-[var(--fin-border)] rounded-lg text-sm font-medium text-[var(--fin-body-text)] appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--fin-brand-500)]"
                disabled
              >
                <option>Active Accounts Only</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fin-muted-text)] pointer-events-none" />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <span className="px-2.5 py-1 rounded-full bg-[var(--fin-brand-100)] text-[var(--fin-brand-700)] text-[10px] font-bold border border-[var(--fin-brand-200)]">
              Equity Funds
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[var(--fin-page-bg-subtle)] text-[var(--fin-muted-text)] text-[10px] font-bold border border-[var(--fin-border)]">
              Debt Funds
            </span>
          </div>
        </div>

        {/* Mock List */}
        <div className="bg-[var(--fin-content-surface)] border border-[var(--fin-border)] rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--fin-table-row-border)] bg-[var(--fin-table-header-bg)]">
            <h3 className="text-xs font-bold text-[var(--fin-table-header-text)] uppercase tracking-wider">Recent Activity</h3>
          </div>
          <div className="divide-y divide-[var(--fin-table-row-border)]">
            {[1, 2].map((i) => (
              <div key={i} className="px-4 py-3 flex items-center justify-between hover:bg-[var(--fin-table-row-hover-bg)] transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--fin-brand-50)] flex items-center justify-center text-[var(--fin-brand-600)]">
                    <CheckCircle2 size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--fin-table-row-text)]">SIP Registered</p>
                    <p className="text-[10px] font-medium text-[var(--fin-muted-text)] mt-0.5">HDFC Mid-Cap Opportunities</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[var(--fin-heading-primary)]">₹5,000</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mock Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button className="w-full py-2.5 rounded-lg bg-[var(--fin-btn-secondary-bg)] border border-[var(--fin-btn-secondary-border)] text-[var(--fin-btn-secondary-text)] text-xs font-bold hover:bg-[var(--fin-btn-secondary-bg-hover)] transition-colors shadow-sm">
            Cancel
          </button>
          <button className="w-full py-2.5 rounded-lg bg-[var(--fin-btn-primary-bg)] text-[var(--fin-btn-primary-text)] text-xs font-bold hover:bg-[var(--fin-btn-primary-bg-hover)] transition-colors shadow-sm shadow-[var(--fin-brand-500)]/20">
            Save Changes
          </button>
        </div>
        
        {/* Extra padding for scroll */}
        <div className="h-4" />

      </div>
    </div>
  );
}
