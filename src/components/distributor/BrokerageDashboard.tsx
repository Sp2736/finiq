"use client";

import React, { useState, useMemo } from 'react';
import DesktopBrokerageTable from './DesktopBrokerageTable';
import MobileBrokerageOverview from './MobileBrokerageOverview';
import { Search, Download, Calendar, Filter, AlertCircle, RefreshCw } from 'lucide-react';

const MOCK_HIERARCHY_DATA = [
  {
    id: "1", user: "Vandana Srivastava", type: "Direct Client", template: "60-60 FLAT",
    gross: 134154.94, paid: 122392.77, paidSub: 0,
    amcBreakdown: [
      { id: "a1", amcName: "ICICI Prudential", gross: 60000, paid: 55000, paidSub: 0 },
      { id: "a2", amcName: "HDFC Mutual Fund", gross: 74154.94, paid: 67392.77, paidSub: 0 }
    ],
    children: [
      {
        id: "1-1", user: "Rahul Verma", type: "RM", template: "40-40 FLAT",
        gross: 50000.00, paid: 20000.00, paidSub: 25000.00,
        amcBreakdown: [
          { id: "a3", amcName: "Kotak Mahindra", gross: 50000, paid: 20000, paidSub: 25000 }
        ],
        children: [
          {
            id: "1-1-1", user: "Amit Desai", type: "Associate", template: "50-50 FLAT",
            gross: 25000.00, paid: 25000.00, paidSub: 0,
            amcBreakdown: [{ id: "a4", amcName: "Kotak Mahindra", gross: 25000, paid: 25000, paidSub: 0 }]
          }
        ]
      }
    ]
  },
  {
    id: "2", user: "Rakesh Jhunjhunwala Portfolio", type: "Family", template: "70-30 FLAT",
    gross: 540000.00, paid: 400000.00, paidSub: 100000.00,
    amcBreakdown: [
      { id: "a5", amcName: "Mirae Asset", gross: 300000, paid: 250000, paidSub: 50000 },
      { id: "a6", amcName: "Invesco", gross: 240000, paid: 150000, paidSub: 50000 }
    ]
  }
];

export default function BrokerageDashboard() {
  // Local input state for typing
  const [searchInput, setSearchInput] = useState('');
  // State that actually triggers the data filter/API call
  const [searchTerm, setSearchTerm] = useState('');
  const [activeGroup, setActiveGroup] = useState("AMC");

  const handleSearchTrigger = () => {
    // This is where you would call your API in a real implementation
    // distributorService.getHierarchy(searchInput, ...)
    setSearchTerm(searchInput);
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return MOCK_HIERARCHY_DATA;
    return MOCK_HIERARCHY_DATA.filter(node => 
      node.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const totals = useMemo(() => {
    return MOCK_HIERARCHY_DATA.reduce((acc, curr) => {
      acc.gross += curr.gross;
      acc.paid += curr.paid;
      acc.paidSub += curr.paidSub;
      return acc;
    }, { gross: 0, paid: 0, paidSub: 0 });
  }, []);

  const grandTotalPaid = totals.paid + totals.paidSub;
  const grandNetReceivable = totals.gross - grandTotalPaid;
  const pendingPercentage = ((grandNetReceivable / totals.gross) * 100).toFixed(1);

  return (
    <div className="flex flex-col h-full animate-[fadeIn_0.5s_ease-out] overflow-hidden">
      
      <div className="shrink-0 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            Hierarchy <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-700">Earnings</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1 text-sm">Monitor revenue flow, receivables, and sub-level payouts.</p>
        </div>
        <div className="flex gap-3">
          <button className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold text-sm hover:border-emerald-600 hover:text-emerald-600 transition-all shadow-sm">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20">
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Sync Hierarchy</span>
          </button>
        </div>
      </div>

      <div className="shrink-0 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl p-3 mb-6 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex items-center bg-slate-100 p-1 rounded-xl overflow-x-auto hide-scrollbar">
          {['AMC', 'Scheme', 'Client', 'Family'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setActiveGroup(lvl)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${activeGroup === lvl ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {lvl}
            </button>
          ))}
        </div>
        <div className="h-6 w-px bg-slate-200 hidden md:block" />
        <div className="relative flex-1 md:flex-none">
          <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select className="w-full md:w-auto pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-emerald-500 appearance-none">
            <option>Apr-2026</option>
            <option>Mar-2026</option>
          </select>
        </div>

        {/* Updated Search Bar with explicit Search Button */}
        <div className="flex-1 min-w-[280px] flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search user or type..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchTrigger()}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all"
            />
          </div>
          <button 
            onClick={handleSearchTrigger}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-md shadow-slate-900/10"
          >
            Search
          </button>
        </div>
      </div>

      <div className="shrink-0 grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm col-span-2 md:col-span-1">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Gross Receivable</p>
          <h3 className="text-xl font-black text-slate-900">₹{totals.gross.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm bg-gradient-to-br from-white to-emerald-50/50">
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Paid (Self)</p>
          <h3 className="text-xl font-black text-emerald-700">₹{totals.paid.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-teal-100 shadow-sm bg-gradient-to-br from-white to-teal-50/50">
          <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-1">Paid (Sub)</p>
          <h3 className="text-xl font-black text-teal-700">₹{totals.paidSub.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h3>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl shadow-lg relative overflow-hidden group col-span-2 md:col-span-1">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl -mr-8 -mt-8" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative z-10">Net Receivable</p>
          <h3 className="text-xl font-black text-white relative z-10">₹{grandNetReceivable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h3>
        </div>
        <div className="hidden md:flex bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pending</span>
            <AlertCircle className="w-3 h-3 text-amber-500" />
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mb-1">
            <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${pendingPercentage}%` }}></div>
          </div>
          <p className="text-xs font-black text-slate-900">{pendingPercentage}% stuck</p>
        </div>
      </div>

      <div className="hidden md:flex flex-col flex-1 min-h-0 pb-4">
        <DesktopBrokerageTable data={filteredData} totals={totals} />
      </div>

      <div className="md:hidden flex flex-col flex-1 min-h-0 overflow-y-auto pr-1 pb-4">
         <MobileBrokerageOverview data={filteredData} totals={totals} />
      </div>

    </div>
  );
}