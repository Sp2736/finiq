"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { distributorService, Investor } from '@/services/distributor.service';
import DesktopClientTable from '@/components/distributor/clients/DesktopClientTable';
import MobileClientList from '@/components/distributor/clients/MobileClientList';
import ClientHoldingsView from '@/components/distributor/clients/ClientHoldingsView';
import { Search, ChevronLeft, ChevronRight, Loader2, Download } from 'lucide-react';

export default function InvestorsPage() {
  const [clients, setClients] = useState<Investor[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false); 

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // NEW: State to control the SPA view transition
  const [activeClientId, setActiveClientId] = useState<string | null>(null);

  const fetchClients = async (page: number) => {
    setIsLoading(true);
    try {
      const res = await distributorService.getInvestors(page, 30);
      if (res.success && res.data) {
        setClients(res.data.data || []);
        setPagination({
          page: res.data.page || 1,
          totalPages: res.data.totalPages || 1,
          totalItems: res.data.total || 0
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

  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients;
    return clients.filter(client => {
      const name = client.name?.toLowerCase() || "";
      const pan = client.pan?.toLowerCase() || "";
      return name.includes(searchTerm) || pan.includes(searchTerm);
    });
  }, [clients, searchTerm]);

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const maxLimit = pagination.totalItems > 0 ? pagination.totalItems : 10000;
      const res = await distributorService.getInvestors(1, maxLimit);
      
      if (res.success && res.data && res.data.data) {
        const allClients = res.data.data;
        
        const headers = ["Name", "PAN", "Tax Status", "Email", "DOB", "Total AUM"];
        const csvContent = allClients.map(c => 
          `"${c.name || ''}","${c.pan || ''}","${c.tax_status || ''}","${c.email || ''}","${c.date_of_birth || ''}","${c.total_aum || 0}"`
        );
        
        const csvString = [headers.join(','), ...csvContent].join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `All_Investors_Report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  if (activeClientId) {
    return <ClientHoldingsView clientId={activeClientId} onBack={() => setActiveClientId(null)} />;
  }
  
  {/* <div className="flex items-center bg-slate-100 p-1 rounded-md overflow-x-auto hide-scrollbar">
    {['All', 'Resident Individual', 'Non Resident Indian', 'HUF'].map((status) => (
      <button
        key={status}
        onClick={() => setActiveStatus(status)}
        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap ${activeStatus === status ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
      >
        {status === 'Resident Individual' ? 'Resident' : status === 'Non Resident Indian' ? 'NRI' : status}
      </button>
    ))}
  </div> */}
  return (
    <div className="flex flex-col h-full relative z-10 animate-in fade-in duration-500 overflow-hidden">
      
      {/* Header & Controls */}
      <div className="shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 mb-1">
            <span className="text-emerald-600">Investors</span>
          </h1>
          <p className="text-slate-500 font-medium text-xs lg:text-sm">
            Manage your network of mapped investors and portfolios.
          </p>
        </div>
        
        <div className="flex w-full md:w-auto items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Name or PAN..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchTrigger()}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-emerald-600 transition-all shadow-sm"
            />
          </div>
          
          <button 
            onClick={handleExportExcel}
            disabled={isExporting || isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-md hover:bg-slate-800 transition-all whitespace-nowrap active:scale-95 disabled:opacity-70 disabled:active:scale-100"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span className="hidden sm:inline">{isExporting ? 'Generating...' : 'Generate Excel'}</span>
          </button>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          </div>
        )}
        
        {/* Desktop View */}
        <div className="hidden lg:flex flex-col flex-1 overflow-auto table-scrollbar">
          <DesktopClientTable clients={filteredClients} onClientClick={setActiveClientId} />
        </div>

        {/* Mobile & Tablet View */}
        <div className="lg:hidden flex flex-col flex-1 overflow-y-auto bg-slate-50/30">
          <MobileClientList clients={filteredClients} onClientClick={setActiveClientId} />
        </div>

        {/* Pagination Footer */}
        <div className="shrink-0 p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Total {pagination.totalItems.toLocaleString('en-IN')} Clients
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