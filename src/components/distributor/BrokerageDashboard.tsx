"use client";

import React, { useState, useEffect, useMemo } from 'react';
import DesktopBrokerageTable from './DesktopBrokerageTable';
import MobileBrokerageOverview from './MobileBrokerageOverview';
import { distributorService } from '@/services/distributor.service';
import { Search, Download, Calendar, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';

// Mapper to translate API Response into UI format
const mapHierarchyData = (subBrokers: any[]) => {
  if (!subBrokers || !Array.isArray(subBrokers)) return [];

  return subBrokers.map((broker, index) => {
    let totalGross = 0;
    let totalPaid = 0;

    const amcBreakdown = (broker.amc_wise_brokerage || []).map((amc: any, i: number) => {
      totalGross += amc.total_brokerage || 0;
      totalPaid += amc.paid_brokerage || 0;

      return {
        id: `amc-${index}-${i}`,
        amcName: amc.amc_name || "Uncategorized AMC",
        gross: amc.total_brokerage || 0,
        paid: amc.paid_brokerage || 0,
        paidSub: 0 // Sub-split not present in this specific endpoint level
      };
    });

    return {
      id: broker.sub_broker_id || `broker-${index}`,
      user: broker.sub_broker_name || "Unnamed Client",
      type: broker.broker_type === "DIRECT" ? "Direct Client" : "Sub-Broker",
      template: broker.share_percentage ? `${broker.share_percentage}% Share` : "Standard",
      gross: totalGross,
      paid: totalPaid,
      paidSub: 0,
      amcBreakdown: amcBreakdown,
      children: [] // Assuming flat list of sub-brokers for this view
    };
  });
};

export default function BrokerageDashboard() {
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeGroup, setActiveGroup] = useState("AMC");
  
  const [dateRange, setDateRange] = useState({
    fromDate: '2026-02-01',
    toDate: '2026-02-28'
  });
  
  const [hierarchyData, setHierarchyData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHierarchy = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await distributorService.getBrokerageSummary(
        dateRange.fromDate, 
        dateRange.toDate, 
        activeGroup
      );
      
      if (res.success && res.data) {
        // Extract the sub_brokers array from the API response and map it
        const subBrokers = res.data.sub_brokers || [];
        const mappedData = mapHierarchyData(subBrokers);
        setHierarchyData(mappedData);
      } else {
        setError(res.message || "Failed to load hierarchy data");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHierarchy();
  }, [activeGroup, dateRange]);

  const handleSearchTrigger = () => {
    setSearchTerm(searchInput.toLowerCase());
  };

  const filteredData = useMemo(() => {
    if (!searchTerm || !hierarchyData) return hierarchyData || [];
    return hierarchyData.filter(node => 
      (node.user && node.user.toLowerCase().includes(searchTerm)) ||
      (node.type && node.type.toLowerCase().includes(searchTerm))
    );
  }, [searchTerm, hierarchyData]);

  const totals = useMemo(() => {
    return filteredData.reduce((acc, curr) => {
      acc.gross += (curr.gross || 0);
      acc.paid += (curr.paid || 0);
      acc.paidSub += (curr.paidSub || 0);
      return acc;
    }, { gross: 0, paid: 0, paidSub: 0 });
  }, [filteredData]);

  const grandTotalPaid = totals.paid + totals.paidSub;
  const grandNetReceivable = totals.gross - grandTotalPaid;
  const pendingPercentage = totals.gross > 0 
    ? ((grandNetReceivable / totals.gross) * 100).toFixed(1) 
    : "0";

  return (
    <div className="flex flex-col h-full animate-[fadeIn_0.5s_ease-out] overflow-hidden">
      
      {/* Header */}
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
          
        </div>
      </div>

      {/* Filter Bar */}
      <div className="shrink-0 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl p-3 mb-6 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex items-center bg-slate-100 p-1 rounded-xl overflow-x-auto hide-scrollbar">
          {['AMC', 'Investor'].map((lvl) => (
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
            <option>Feb-2026</option>
            <option>Jan-2026</option>
          </select>
        </div>

        {/* Search */}
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

      {/* KPI Section */}
      <div className="shrink-0 grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm col-span-2 md:col-span-1">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Gross Receivable</p>
          <h3 className="text-xl font-black text-slate-900">₹{totals.gross.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm bg-gradient-to-br from-white to-emerald-50/50">
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Paid Brokerage</p>
          <h3 className="text-xl font-black text-emerald-700">₹{totals.paid.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h3>
        </div>
        
        <div className="bg-slate-900 p-4 rounded-xl shadow-lg relative overflow-hidden group col-span-2 md:col-span-1">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl -mr-8 -mt-8" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative z-10">Net Receivable</p>
          <h3 className="text-xl font-black text-white relative z-10">₹{grandNetReceivable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h3>
        </div>
        
      </div>

      {/* Main Table Area */}
      {error ? (
        <div className="flex-1 flex items-center justify-center bg-white rounded-xl border border-rose-100 p-8">
           <p className="text-rose-600 font-bold">{error}</p>
        </div>
      ) : (
        <React.Fragment>
          <div className="hidden md:flex flex-col flex-1 min-h-0 pb-4 relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              </div>
            )}
            <DesktopBrokerageTable data={filteredData} totals={totals} />
          </div>

          <div className="md:hidden flex flex-col flex-1 min-h-0 overflow-y-auto pr-1 pb-4 relative">
             {isLoading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-50 flex items-center justify-center rounded-xl">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              </div>
            )}
             <MobileBrokerageOverview data={filteredData} totals={totals} />
          </div>
        </React.Fragment>
      )}

    </div>
  );
}