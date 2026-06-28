"use client";

import React, { useState, useEffect } from 'react';
import { distributorService, Investor } from '@/services/distributor.service';
import DesktopClientTable from '@/components/distributor/clients/DesktopClientTable';
import MobileClientList from '@/components/distributor/clients/MobileClientList';
import ClientHoldingsView from '@/components/distributor/clients/ClientHoldingsView';
import { Search, ChevronLeft, ChevronRight, Loader2, Download } from 'lucide-react';
import ExcelJS from 'exceljs';

export default function InvestorsPage() {
  const [clients, setClients] = useState<Investor[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false); 

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [maxLimit, setMaxLimit] = useState<number | undefined>(undefined);

  const [activeClientId, setActiveClientIdState] = useState<string | null>(null);
  
  // NEW: State to prevent the flash of the listings page
  const [isCheckingStorage, setIsCheckingStorage] = useState(true);

  // ─── TO CATCH REDIRECTS AND PERSIST ACROSS RELOADS ───
  useEffect(() => {
    const redirectId = sessionStorage.getItem('viewClientId');
    const currentId = sessionStorage.getItem('activeClientId');

    if (redirectId) {
      setActiveClientIdState(redirectId);
      sessionStorage.setItem('activeClientId', redirectId);
      sessionStorage.removeItem('viewClientId'); 
    } else if (currentId) {
      setActiveClientIdState(currentId);
    }
    
    // Check complete, safe to render the correct UI
    setIsCheckingStorage(false);
  }, []);

  const setActiveClientId = (id: string | null) => {
    setActiveClientIdState(id);
    if (id) {
      sessionStorage.setItem('activeClientId', id);
    } else {
      sessionStorage.removeItem('activeClientId');
    }
  };

  // ─── 1. DEBOUNCING LOGIC ───
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(searchInput.trim());
    }, 500);

    return () => clearTimeout(handler);
  }, [searchInput]);

  // ─── 2. CLEAN BACKEND FETCH ───
  const fetchClients = async (pageToLoad: number, currentSearchTerm: string = "") => {
    setIsLoading(true);
    try {
      const res = await distributorService.getInvestors(pageToLoad, 30, currentSearchTerm);
      
      if (res.success && res.data) {
        setClients(res.data.data || []);
        setPagination({
          page: res.data.page || 1,
          totalPages: res.data.totalPages || 1,
          totalItems: res.data.total || 0
        });
        setMaxLimit(res.data.total);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isCheckingStorage && !activeClientId) {
      fetchClients(1, searchTerm);
    }
  }, [searchTerm, isCheckingStorage, activeClientId]);

  const handleSearchTrigger = () => {
    setSearchTerm(searchInput.trim());
  };

  // ─── 3. SEARCH-AWARE EXCEL EXPORT (USING EXCELJS) ───
  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const limitToFetch = maxLimit ? maxLimit : 5000;
      const res = await distributorService.downloadInvestorList(1, limitToFetch, limitToFetch, searchTerm);
      
      if (res.success && res.data && res.data.data) {
        const allClientsToExport = res.data.data;
        
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('Investors Report');

        ws.columns = [
          { header: 'Name', key: 'name', width: 30 },
          { header: 'PAN', key: 'pan', width: 15 },
          { header: 'Tax Status', key: 'tax_status', width: 20 },
          { header: 'Email', key: 'email', width: 35 },
          { header: 'Date of Birth', key: 'dob', width: 15 },
          { header: 'Total AUM (₹)', key: 'total_aum', width: 20 },
        ];

        const headerRow = ws.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF0F2850' }
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

        allClientsToExport.forEach((c: any) => {
          const row = ws.addRow({
            name: c.name || '',
            pan: c.pan || '',
            tax_status: c.tax_status || '',
            email: c.email || '',
            dob: c.date_of_birth || '',
            total_aum: c.total_aum || 0
          });
          
          row.getCell('total_aum').numFmt = '#,##0.00';
        });

        const buffer = await wb.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", searchTerm ? `Investors_Report_${searchTerm}.xlsx` : `All_Investors_Report.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  // ─── GATEKEEPER: Prevent flash while checking storage ───
  if (isCheckingStorage) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-[var(--fin-brand-600)] animate-spin" />
      </div>
    );
  }

  // Intercept the render and show holdings instead if active
  if (activeClientId) {
    return <ClientHoldingsView clientId={activeClientId} onBack={() => setActiveClientId(null)} />;
  }
  
  return (
    <div className="flex flex-col h-full relative z-10 animate-in fade-in duration-500 overflow-hidden">
      
      {/* Header & Controls */}
      <div className="shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-[var(--fin-heading-primary)] mb-1">
            <span className="text-[var(--fin-brand-600)]">Investors</span>
          </h1>
          <p className="text-[var(--fin-muted-text)] font-medium text-xs lg:text-sm">
            Manage your network of mapped investors and portfolios.
          </p>
        </div>
        
        <div className="flex w-full md:w-auto items-center gap-3">
          <div className="relative flex-1 md:w-64 flex flex-col justify-center">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fin-aux-text)]" />
              <input
                type="text"
                placeholder="Search Name or PAN..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchTrigger()}
                className="w-full pl-9 pr-4 py-2 bg-[var(--fin-table-bg)] border border-[var(--fin-border)] rounded-md text-sm focus:border-[var(--fin-brand-600)] transition-all shadow-sm"
              />
            </div>
          </div>
          
          <button 
            onClick={handleExportExcel}
            disabled={isExporting || isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--fin-brand-700)] text-[var(--fin-btn-primary-text)] rounded-md text-sm font-bold shadow-md hover:bg-[var(--fin-brand-800)] transition-all whitespace-nowrap active:scale-95 disabled:opacity-70 disabled:active:scale-100"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span className="hidden sm:inline">{isExporting ? 'Generating...' : 'Generate Excel'}</span>
          </button>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 min-h-0 bg-[var(--fin-table-bg)] rounded-md border border-[var(--fin-border)] shadow-sm flex flex-col relative overflow-hidden mt-1 md:mt-0">
        
        {isLoading && (
          <div className="absolute inset-0 bg-[var(--fin-table-bg)]/60 backdrop-blur-[2px] z-50 flex flex-col gap-3 items-center justify-center">
            <Loader2 className="w-8 h-8 text-[var(--fin-brand-600)] animate-spin" />
          </div>
        )}
        
        <div className="hidden lg:flex flex-col flex-1 overflow-auto table-scrollbar">
          <DesktopClientTable clients={clients} onClientClick={setActiveClientId} />
        </div>

        <div className="lg:hidden flex flex-col flex-1 overflow-y-auto bg-[var(--fin-page-bg)]/30">
          <MobileClientList clients={clients} onClientClick={setActiveClientId} />
        </div>

        <div className="shrink-0 p-4 border-t border-[var(--fin-border-subtle)] flex items-center justify-between bg-[var(--fin-page-bg)]/50">
          <p className="text-[10px] font-black text-[var(--fin-muted-text)] uppercase tracking-widest">
            Total {pagination.totalItems.toLocaleString('en-IN')} Clients
          </p>
          <div className="flex items-center gap-2">
            <button 
              disabled={pagination.page === 1 || isLoading}
              onClick={() => fetchClients(pagination.page - 1, searchTerm)}
              className="p-2 border border-[var(--fin-border)] rounded-md hover:bg-[var(--fin-table-bg)] disabled:opacity-50 transition-all"
            >
              <ChevronLeft className="w-4 h-4 text-[var(--fin-body-text)]" />
            </button>
            <span className="text-xs font-black text-[var(--fin-heading-primary)] px-2">Page {pagination.page} of {pagination.totalPages}</span>
            <button 
              disabled={pagination.page === pagination.totalPages || isLoading}
              onClick={() => fetchClients(pagination.page + 1, searchTerm)}
              className="p-2 border border-[var(--fin-border)] rounded-md hover:bg-[var(--fin-table-bg)] disabled:opacity-50 transition-all"
            >
              <ChevronRight className="w-4 h-4 text-[var(--fin-body-text)]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}