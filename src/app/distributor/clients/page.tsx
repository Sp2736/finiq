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

  const [activeClientId, setActiveClientId] = useState<string | null>(null);

  // ─── TO CATCH THE REDIRECT ───
  useEffect(() => {
    const storedClientId = sessionStorage.getItem('viewClientId');
    if (storedClientId) {
      setActiveClientId(storedClientId);
      sessionStorage.removeItem('viewClientId'); 
    }
  }, []);

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
    fetchClients(1, searchTerm);
  }, [searchTerm]);

  const handleSearchTrigger = () => {
    setSearchTerm(searchInput.trim());
  };

  // ─── 3. SEARCH-AWARE EXCEL EXPORT (USING EXCELJS) ───
  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const limitToFetch = maxLimit ? maxLimit : 5000;
      // Pass the searchTerm so the export matches what the user sees!
      const res = await distributorService.downloadInvestorList(1, limitToFetch, limitToFetch, searchTerm);
      
      if (res.success && res.data && res.data.data) {
        const allClientsToExport = res.data.data;
        
        // Initialize Workbook and Worksheet
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('Investors Report');

        // Define columns
        ws.columns = [
          { header: 'Name', key: 'name', width: 30 },
          { header: 'PAN', key: 'pan', width: 15 },
          { header: 'Tax Status', key: 'tax_status', width: 20 },
          { header: 'Email', key: 'email', width: 35 },
          { header: 'Date of Birth', key: 'dob', width: 15 },
          { header: 'Total AUM (₹)', key: 'total_aum', width: 20 },
        ];

        // Style the header row
        const headerRow = ws.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF0F2850' } // Navy blue theme
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

        // Add rows
        allClientsToExport.forEach((c: any) => {
          const row = ws.addRow({
            name: c.name || '',
            pan: c.pan || '',
            tax_status: c.tax_status || '',
            email: c.email || '',
            dob: c.date_of_birth || '',
            total_aum: c.total_aum || 0
          });
          
          // Format AUM column as currency/number
          row.getCell('total_aum').numFmt = '#,##0.00';
        });

        // Generate and trigger download
        const buffer = await wb.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", searchTerm ? `Investors_Report_${searchTerm}.xlsx` : `All_Investors_Report.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        window.URL.revokeObjectURL(url);
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
  
  return (
    <div className="flex flex-col h-full relative z-10 animate-in fade-in duration-500 overflow-hidden">
      
      {/* Header & Controls */}
      <div className="shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 mb-1">
            <span className="text-distributor-600">Investors</span>
          </h1>
          <p className="text-slate-500 font-medium text-xs lg:text-sm">
            Manage your network of mapped investors and portfolios.
          </p>
        </div>
        
        <div className="flex w-full md:w-auto items-center gap-3">
          <div className="relative flex-1 md:w-64 flex flex-col justify-center">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search Name or PAN..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchTrigger()}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-distributor-600 transition-all shadow-sm"
              />
            </div>
          </div>
          
          <button 
            onClick={handleExportExcel}
            disabled={isExporting || isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-distributor-700 text-white rounded-xl text-sm font-bold shadow-md hover:bg-distributor-800 transition-all whitespace-nowrap active:scale-95 disabled:opacity-70 disabled:active:scale-100"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span className="hidden sm:inline">{isExporting ? 'Generating...' : 'Generate Excel'}</span>
          </button>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 min-h-0 bg-white rounded-md border border-slate-200 shadow-sm flex flex-col relative overflow-hidden mt-1 md:mt-0">
        
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex flex-col gap-3 items-center justify-center">
            <Loader2 className="w-8 h-8 text-distributor-600 animate-spin" />
          </div>
        )}
        
        <div className="hidden lg:flex flex-col flex-1 overflow-auto table-scrollbar">
          <DesktopClientTable clients={clients} onClientClick={setActiveClientId} />
        </div>

        <div className="lg:hidden flex flex-col flex-1 overflow-y-auto bg-slate-50/30">
          <MobileClientList clients={clients} onClientClick={setActiveClientId} />
        </div>

        <div className="shrink-0 p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Total {pagination.totalItems.toLocaleString('en-IN')} Clients
          </p>
          <div className="flex items-center gap-2">
            <button 
              disabled={pagination.page === 1 || isLoading}
              onClick={() => fetchClients(pagination.page - 1, searchTerm)}
              className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 transition-all"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <span className="text-xs font-black text-slate-900 px-2">Page {pagination.page} of {pagination.totalPages}</span>
            <button 
              disabled={pagination.page === pagination.totalPages || isLoading}
              onClick={() => fetchClients(pagination.page + 1, searchTerm)}
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