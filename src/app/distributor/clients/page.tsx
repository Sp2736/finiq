"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, UserPlus } from 'lucide-react';
import DesktopClientTable from '@/components/distributor/clients/DesktopClientTable';
import MobileClientList from '@/components/distributor/clients/MobileClientList';
import { distributorService } from '@/services/distributor.service'; // Assuming this exists

export default function DistributorClientsPage() {
  const [clients, setClients] = useState<Investor[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchClients = async (page: number) => {
    setIsLoading(true);
    try {
      const res = await distributorService.getInvestors(page, 30); // Uses /holdings-cache/investors
      if (res.success) {
        // res.data is PaginatedResponse<Investor>, so we access .data again for the array
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

  // Filter Logic
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            client.pan.toLowerCase().includes(searchTerm.toLowerCase());
      // Add specific status/category filters here if added to the API
      return matchesSearch;
    });
  }, [clients, searchTerm, activeFilter]);

  if (isLoading) {
    return (
      <div className="h-[calc(100dvh-100px)] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-bold text-sm tracking-wide uppercase">Syncing Client Network...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-100 rounded-[2.5rem] text-rose-600 font-medium max-w-md mx-auto mt-20 text-center">
        <p className="font-bold mb-2">Connection Error</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative z-10 animate-[fadeIn_0.5s_ease-out]">
      
      {/* --- HEADER (Shared) --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            Client <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800">Directory</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1 text-sm">Manage your investor network and track AUM allocations.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or PAN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all shadow-sm"
            />
          </div>
          <button className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20">
            <UserPlus className="w-4 h-4" />
            <span>Add Client</span>
          </button>
        </div>
      </div>

      {/* --- MOBILE/TABLET VIEW --- */}
      <div className="flex flex-col lg:hidden flex-1 overflow-hidden pb-20">
         <MobileClientList 
           clients={filteredClients} 
           onSelectClient={(client) => {
             setSelectedClient(client);
             setMobileActiveScreen('details');
           }} 
         />
      </div>

      {/* --- DESKTOP VIEW --- */}
      <div className="hidden lg:flex flex-col flex-1 min-h-0 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <DesktopClientTable clients={filteredClients} />
      </div>
      
    </div>
  );
}