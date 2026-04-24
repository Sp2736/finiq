"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { distributorService, Investor } from '@/services/distributor.service';
import DesktopClientTable from '@/components/distributor/clients/DesktopClientTable';
import MobileClientList from '@/components/distributor/clients/MobileClientList';
import { Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

export default function DistributorClientsPage() {
  // 1. API Data State
  const [clients, setClients] = useState<Investor[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // 2. Fix: Properly declare the missing Search and Filter states
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState(""); 
  const [activeStatus, setActiveStatus] = useState("All"); // The 'act...' from your error

  const fetchClients = async (page: number) => {
    setIsLoading(true);
    try {
      const res = await distributorService.getInvestors(page, 30);
      if (res.success) {
        setClients(res.data.data);
        setPagination({
          page: res.data.page,
          totalPages: res.data.totalPages,
          totalItems: res.data.total
        });
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients(1);
  }, []);

  const handleSearchTrigger = () => {
    setSearchTerm(searchInput.toLowerCase());
  };

  // 3. Fix: Safe filtering logic with all dependencies declared
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      // Safe string checks in case data is missing
      const clientName = client.name || "";
      const clientPan = client.pan || "";
      const clientStatus = client.tax_status || "";

      const matchesSearch = searchTerm === "" || 
        clientName.toLowerCase().includes(searchTerm) || 
        clientPan.toLowerCase().includes(searchTerm);
      
      const matchesStatus = activeStatus === "All" || clientStatus === activeStatus;

      return matchesSearch && matchesStatus;
    });
  }, [clients, searchTerm, activeStatus]);

  return (
    <div className="flex flex-col h-full relative z-10 animate-in fade-in duration-500 overflow-hidden">
      
      {/* Header */}
      <div className="shrink-0 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 mb-1">
            Client <span className="text-emerald-600">Directory</span>
          </h1>
          <p className="text-slate-500 font-medium text-xs lg:text-sm">
            Manage your network of mapped investors and access their portfolios.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="shrink-0 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl p-3 mb-6 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex items-center bg-slate-100 p-1 rounded-xl overflow-x-auto hide-scrollbar">
          {['All', 'Resident Individual', 'Non Resident Indian', 'HUF'].map((status) => (
            <button
              key={status}
              onClick={() => setActiveStatus(status)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${activeStatus === status ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {status === 'Resident Individual' ? 'Resident' : status === 'Non Resident Indian' ? 'NRI' : status}
            </button>
          ))}
        </div>
        
        <div className="h-6 w-px bg-slate-200 hidden md:block" />
        
        <div className="flex-1 min-w-[280px] flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Name or PAN..."
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

      {/* Table Area with Loading Overlay */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          </div>
        )}
        
        <div className="hidden lg:flex flex-col flex-1 overflow-auto table-scrollbar">
          <DesktopClientTable clients={filteredClients} />
        </div>

        <div className="lg:hidden flex flex-col flex-1 overflow-y-auto pr-1">
          {/* Ensure you have a MobileClientList component, or replace this with your mobile card logic */}
           <MobileClientList clients={filteredClients} />
        </div>

        {/* Pagination Footer */}
        <div className="shrink-0 p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Total {pagination.totalItems} Clients
          </p>
          <div className="flex items-center gap-2">
            <button 
              disabled={pagination.page === 1 || isLoading}
              onClick={() => fetchClients(pagination.page - 1)}
              className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 transition-all"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <span className="text-xs font-black text-slate-900 px-2">Page {pagination.page} of {pagination.totalPages}</span>
            <button 
              disabled={pagination.page === pagination.totalPages || isLoading}
              onClick={() => fetchClients(pagination.page + 1)}
              className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 transition-all"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}