"use client";

import React, { useState, useEffect, useMemo } from 'react';
import DesktopBrokerageTable from './DesktopBrokerageTable';
import MobileBrokerageOverview from './MobileBrokerageOverview';
import { distributorService } from '@/services/distributor.service';
import { formatCompactNumber } from '@/lib/utils';
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
      
      {/* Header - Compressed Margins */}
      <div className="shrink-0 flex flex-col md:flex-row justify-between items-start md:items-end gap-2 mb-3 lg:mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900">
            Hierarchy <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-700">Earnings</span>
          </h1>
        </div>
        <div className="hidden md:flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:border-emerald-600 hover:text-emerald-600 transition-all shadow-sm">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filter Bar - Compressed Padding & Layout */}
      <div className="shrink-0 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-xl md:rounded-2xl p-2 md:p-3 mb-3 lg:mb-6 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-2">
        
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg overflow-x-auto hide-scrollbar flex-1">
            {['AMC', 'Investor'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setActiveGroup(lvl)}
                className={`flex-1 px-3 py-1 text-[11px] md:text-xs font-bold rounded-md transition-all whitespace-nowrap ${activeGroup === lvl ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {lvl}
              </button>
            ))}
          </div>
          
          <div className="relative md:hidden w-32">
            <Calendar className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <select className="w-full pl-8 pr-6 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 appearance-none">
              <option>Feb-2026</option>
              <option>Jan-2026</option>
            </select>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-200 hidden md:block mx-1" />
        
        <div className="relative hidden md:block md:flex-none">
          <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 appearance-none">
            <option>Feb-2026</option>
            <option>Jan-2026</option>
          </select>
        </div>

        {/* Search */}
        <div className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search user or type..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchTrigger()}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-600 transition-all"
            />
          </div>
          <button 
            onClick={handleSearchTrigger}
            className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[11px] font-bold hover:bg-slate-800 transition-all shadow-sm"
          >
            Search
          </button>
        </div>
      </div>

      {/* KPI Section - Compact Grid, Less Padding */}
      <div className="shrink-0 grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 lg:mb-6">
        
        <div className="bg-white p-2.5 md:p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:bg-emerald-600 transition-all cursor-default">
          <div className="group-hover:opacity-0 transition-opacity">
            <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Gross Rec.</p>
            <h3 className="text-base md:text-xl font-black text-slate-900">{formatCompactNumber(totals.gross)}</h3>
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <h3 className="text-sm md:text-base font-black text-white">₹{totals.gross.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
          </div>
        </div>

        <div className="bg-white p-2.5 md:p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:bg-emerald-600 transition-all cursor-default">
          <div className="group-hover:opacity-0 transition-opacity">
            <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Paid Brokerage</p>
            <h3 className="text-base md:text-xl font-black text-emerald-600">{formatCompactNumber(totals.paid)}</h3>
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <h3 className="text-sm md:text-base font-black text-white">₹{totals.paid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
          </div>
        </div>

        <div className="bg-white p-2.5 md:p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:bg-emerald-600 transition-all cursor-default">
          <div className="group-hover:opacity-0 transition-opacity">
            <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Paid (Sub)</p>
            <h3 className="text-base md:text-xl font-black text-teal-600">{formatCompactNumber(totals.paidSub)}</h3>
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <h3 className="text-sm md:text-base font-black text-white">₹{totals.paidSub.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
          </div>
        </div>

        <div className="bg-slate-900 p-2.5 md:p-4 rounded-xl border border-slate-900 shadow-sm relative overflow-hidden group hover:bg-emerald-600 transition-all cursor-default">
          <div className="group-hover:opacity-0 transition-opacity relative z-10">
            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Net Rec.</p>
            <h3 className="text-base md:text-xl font-black text-white">{formatCompactNumber(grandNetReceivable)}</h3>
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <h3 className="text-sm md:text-base font-black text-white">₹{grandNetReceivable.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
          </div>
        </div>

      </div>

      {/* Main Table Area -> DesktopBrokerageTable / MobileBrokerageOverview */}
      {error ? (
        <div className="flex-1 flex items-center justify-center bg-white rounded-md border border-rose-100 p-8">
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
              <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-50 flex items-center justify-center rounded-md">
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