'use client';

import React, { useState } from 'react';
import Badge from '../investor/Badge'; // Reusing your existing Badge component

// Mock data to hold the layout until APIs are ready
const MOCK_BROKERAGE_DATA = [
  { id: '1', clientName: 'Aarav Patel', type: 'Mutual Fund SIP', amount: 1500, status: 'Paid', date: '2026-04-20' },
  { id: '2', clientName: 'Neha Sharma', type: 'Equity Lumpsum', amount: 4200, status: 'Pending', date: '2026-04-22' },
  { id: '3', clientName: 'Vikram Singh', type: 'Debt Fund SIP', amount: 850, status: 'Paid', date: '2026-04-23' },
  { id: '4', clientName: 'Priya Desai', type: 'NFO Investment', amount: 3100, status: 'Processing', date: '2026-04-24' },
];

export default function BrokerageDashboard() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 w-full max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Brokerage Overview</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track and manage your commission and brokerage earnings.</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
          Download Report
        </button>
      </div>

      {/* Stats Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Earnings (YTD)</p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">₹1,24,500</h3>
          <p className="text-xs text-green-600 mt-2 flex items-center">
            <span className="font-medium">+12.5%</span> <span className="text-gray-500 dark:text-gray-400 ml-1">vs last month</span>
          </p>
        </div>
        <div className="p-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Pending Brokerage</p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">₹14,200</h3>
          <p className="text-xs text-yellow-600 mt-2 flex items-center">
            <span className="font-medium">To be cleared by 1st May</span>
          </p>
        </div>
        <div className="p-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Active Clients</p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">142</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Generating brokerage this month
          </p>
        </div>
      </div>

      {/* Table Section */}
      <div className="mt-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
        
        {/* Table Toolbar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
          <div className="relative w-full sm:w-64">
            <input 
              type="text" 
              placeholder="Search client or type..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
            <svg className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Client Name</th>
                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Transaction Type</th>
                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Amount (₹)</th>
                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {MOCK_BROKERAGE_DATA.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="p-4 text-sm font-medium text-gray-900 dark:text-white">{item.clientName}</td>
                  <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{item.type}</td>
                  <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                    {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="p-4 text-sm font-semibold text-gray-900 dark:text-white text-right">
                    {item.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="p-4 flex justify-center">
                    <Badge variant={item.status === 'Paid' ? 'success' : item.status === 'Pending' ? 'warning' : 'primary'}>
                      {item.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}