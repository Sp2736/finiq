"use client";

import React, { useState, useEffect, useMemo } from 'react';
import DesktopBrokerageTable from './DesktopBrokerageTable';
import MobileBrokerageOverview from './MobileBrokerageOverview';
import { distributorService } from '@/services/distributor.service';
import { formatCompactNumber } from '@/lib/utils';
import { Search, Download, Calendar, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import ExcelJS from 'exceljs';

// ─── GLOBAL CACHE FOR BROKERAGE VIEWS ───
const globalHierarchyCache = new Map<string, any[]>();
const globalHierarchyPromiseCache = new Map<string, Promise<any[]>>();

// Mapper to translate API Response into UI format.
// `groupBy` is "AMC" or "Investor" (matches activeGroup state values).
const mapHierarchyData = (subBrokers: any[], groupBy: string) => {
  if (!subBrokers || !Array.isArray(subBrokers)) return [];

  const isInvestorGroup = groupBy === "Investor";

  return subBrokers.map((broker, index) => {
    let totalGross = 0;
    let totalPaid = 0;

    const rawBreakdown = isInvestorGroup
      ? broker.investor_wise_brokerage
      : broker.amc_wise_brokerage;

    const breakdown = (rawBreakdown || []).map((item: any, i: number) => {
      totalGross += item.total_brokerage || 0;
      totalPaid += item.paid_brokerage || 0;

      return {
        id: isInvestorGroup
          ? (item.investor_id || `investor-${index}-${i}`)
          : `amc-${index}-${i}`,
        name: isInvestorGroup
          ? (item.investor_name || "Unnamed Investor")
          : (item.amc_name || "Uncategorized AMC"),
        gross: item.total_brokerage || 0,
        paid: item.paid_brokerage || 0,
        paidSub: 0,
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
      amcBreakdown: breakdown, // keep this key name — both child components already read it
      children: []
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
  
  const cacheKey = `${activeGroup}-${dateRange.fromDate}-${dateRange.toDate}`;
  
  const [hierarchyData, setHierarchyData] = useState<any[]>(globalHierarchyCache.get(cacheKey) || []);
  const [isLoading, setIsLoading] = useState(!globalHierarchyCache.has(cacheKey));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHierarchy = async () => {
      const currentCacheKey = `${activeGroup}-${dateRange.fromDate}-${dateRange.toDate}`;

      // 1. INSTANT RETURN
      if (globalHierarchyCache.has(currentCacheKey)) {
        setHierarchyData(globalHierarchyCache.get(currentCacheKey)!);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      // 2. PROMISE HOOKING
      if (globalHierarchyPromiseCache.has(currentCacheKey)) {
        try {
          const data = await globalHierarchyPromiseCache.get(currentCacheKey)!;
          setHierarchyData(data);
        } catch (e) {
          setError("Failed to load hierarchy data");
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // 3. FETCH AND CACHE
      const fetchPromise = (async () => {
        const res = await distributorService.getBrokerageSummary(
          dateRange.fromDate, 
          dateRange.toDate, 
          activeGroup
        );
        
        if (res.success && res.data) {
          const mappedData = mapHierarchyData(res.data.sub_brokers || [], activeGroup);
          globalHierarchyCache.set(currentCacheKey, mappedData);
          return mappedData;
        } else {
          throw new Error(res.message || "Failed to load hierarchy data");
        }
      })();

      globalHierarchyPromiseCache.set(currentCacheKey, fetchPromise);

      try {
        const mappedData = await fetchPromise;
        setHierarchyData(mappedData);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred");
        globalHierarchyPromiseCache.delete(currentCacheKey); // Allow retrying if it failed
      } finally {
        setIsLoading(false);
      }
    };

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

  const [isExporting, setIsExporting] = useState(false);

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Hierarchy Earnings', {
        views: [{ state: 'frozen', ySplit: 5 }],
        properties: { defaultRowHeight: 22 },
        pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
      });

      // Configure columns
      ws.getColumn(1).width = 45;
      ws.getColumn(2).width = 18;
      ws.getColumn(3).width = 22; ws.getColumn(3).alignment = { horizontal: 'right' };
      ws.getColumn(4).width = 22; ws.getColumn(4).alignment = { horizontal: 'right' };
      ws.getColumn(5).width = 22; ws.getColumn(5).alignment = { horizontal: 'right' };
      ws.getColumn(6).width = 22; ws.getColumn(6).alignment = { horizontal: 'right' };

      // Title Block
      const titleRow1 = ws.addRow(['Hierarchy Earnings Report - ' + activeGroup + ' Breakdown']);
      titleRow1.font = { name: 'Calibri', bold: true, color: { argb: 'FF0F2850' }, size: 14 };
      titleRow1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4F7FC' } };

      const titleRow2 = ws.addRow(['Period: ' + dateRange.fromDate + ' to ' + dateRange.toDate]);
      titleRow2.font = { name: 'Calibri', color: { argb: 'FF0F2850' }, size: 11 };
      titleRow2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4F7FC' } };

      const titleRow3 = ws.addRow(['Generated on: ' + new Date().toLocaleDateString('en-IN')]);
      titleRow3.font = { name: 'Calibri', color: { argb: 'FF0F2850' }, size: 11 };
      titleRow3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4F7FC' } };

      ws.addRow([]); // Empty row 4

      // Header Row (Row 5)
      const headerRow = ws.addRow(['User', 'Type', 'Gross Rec. (Rs.)', 'Paid (Self) (Rs.)', 'Total Paid (Rs.)', 'Net Rec. (Rs.)']);
      headerRow.font = { name: 'Calibri', bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2850' } };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      
      ws.autoFilter = { from: 'A5', to: 'F5' };

      const flattenHierarchy = (nodes: any[]): any[] => {
        let flat: any[] = [];
        nodes.forEach(node => {
          flat.push(node);
          if (node.children && node.children.length > 0) {
            flat = flat.concat(flattenHierarchy(node.children));
          }
        });
        return flat;
      };

      const flatData = flattenHierarchy(filteredData || []);

      flatData.forEach((user, index) => {
        const totalPaid = user.paid + user.paidSub;
        const netReceivable = user.gross - totalPaid;
        
        const row = ws.addRow([
          user.user,
          user.type,
          user.gross,
          user.paid,
          totalPaid,
          netReceivable
        ]);
        
        row.font = { name: 'Calibri', bold: true, size: 11, color: { argb: 'FF0F2850' } };
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E0F0' } };
        
        row.eachCell((cell) => {
           cell.border = { 
               top: { style: 'thin', color: { argb: 'FFB8C9E6' } },
               left: { style: 'thin', color: { argb: 'FFB8C9E6' } },
               right: { style: 'thin', color: { argb: 'FFB8C9E6' } },
               bottom: { style: 'thin', color: { argb: 'FFB8C9E6' } },
           };
        });

        [3, 4, 5, 6].forEach((colIndex) => {
          row.getCell(colIndex).numFmt = '#,##0.00';
        });

        if (user.amcBreakdown && user.amcBreakdown.length > 0) {
          user.amcBreakdown.forEach((breakdown: any, bIdx: number) => {
            const breakdownRow = ws.addRow([
              `   ↳ ${breakdown.name}`,
              activeGroup,
              breakdown.gross,
              breakdown.paid,
              breakdown.paid,
              breakdown.gross - breakdown.paid
            ]);

            breakdownRow.font = { name: 'Calibri', italic: true, color: { argb: 'FF475569' }, size: 11 };
            
            // Alternate shading for children (white and near-white blue tint)
            const childFill = bIdx % 2 === 0 ? 'FFFFFFFF' : 'FFF4F7FC';
            breakdownRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: childFill } };

            breakdownRow.eachCell((cell) => {
               cell.border = { 
                   left: { style: 'thin', color: { argb: 'FFB8C9E6' } },
                   right: { style: 'thin', color: { argb: 'FFB8C9E6' } },
                   bottom: { style: 'thin', color: { argb: 'FFB8C9E6' } },
               };
            });
            
            [3, 4, 5, 6].forEach((colIndex) => {
              breakdownRow.getCell(colIndex).numFmt = '#,##0.00';
            });
          });
        }
      });

      // Add grand totals
      const grandTotalRow = ws.addRow([
        'GRAND TOTALS',
        '',
        totals.gross,
        totals.paid,
        totals.paid + totals.paidSub,
        totals.gross - (totals.paid + totals.paidSub)
      ]);
      
      grandTotalRow.font = { name: 'Calibri', bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
      grandTotalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A6E' } };
      
      grandTotalRow.eachCell((cell) => {
         cell.border = {
             top: { style: 'medium', color: { argb: 'FF0F2850' } },
             bottom: { style: 'thin', color: { argb: 'FFB8C9E6' } },
             left: { style: 'thin', color: { argb: 'FFB8C9E6' } },
             right: { style: 'thin', color: { argb: 'FFB8C9E6' } },
         };
      });

      [3, 4, 5, 6].forEach((colIndex) => {
        grandTotalRow.getCell(colIndex).numFmt = '#,##0.00';
      });

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Hierarchy_Earnings_by_${activeGroup}_${dateRange.fromDate}_to_${dateRange.toDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full animate-[fadeIn_0.5s_ease-out] overflow-hidden">
      
      {/* Header - Compressed Margins */}
      <div className="shrink-0 flex flex-col md:flex-row justify-between items-start md:items-end gap-2 mb-3 lg:mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-[var(--fin-heading-primary)]">
            Hierarchy <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--fin-brand-600)] to-[var(--fin-brand-800)]">Earnings</span>
          </h1>
        </div>
        <div className="hidden md:flex gap-3">
          <button onClick={handleExportExcel} disabled={isExporting} className="flex items-center gap-2 px-4 py-2 bg-[var(--fin-table-bg)] border border-[var(--fin-border)] text-[var(--fin-body-text)] font-bold text-xs rounded-md hover:border-[var(--fin-brand-600)] hover:text-[var(--fin-brand-600)] transition-all shadow-sm disabled:opacity-50">
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{isExporting ? 'Exporting...' : 'Export'}</span>
          </button>
        </div>
      </div>

      {/* Filter Bar - Compressed Padding & Layout */}
      <div className="shrink-0 bg-[var(--fin-table-bg)]/80 backdrop-blur-xl border border-[var(--fin-border)] rounded-md md:rounded-md p-2 md:p-3 mb-3 lg:mb-6 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-2">
        
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center bg-[var(--fin-skeleton-base)] p-1 rounded-md overflow-x-auto hide-scrollbar flex-1">
            {['AMC', 'Investor'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setActiveGroup(lvl)}
                className={`flex-1 px-3 py-1 text-[11px] md:text-xs font-bold rounded-md transition-all whitespace-nowrap ${activeGroup === lvl ? 'bg-[var(--fin-table-bg)] text-[var(--fin-brand-700)] shadow-sm' : 'text-[var(--fin-muted-text)] hover:text-[var(--fin-table-row-text)]'}`}
              >
                {lvl}
              </button>
            ))}
          </div>
          
          <div className="relative md:hidden w-32">
            <Calendar className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--fin-aux-text)]" />
            <select className="w-full pl-8 pr-6 py-1.5 bg-[var(--fin-table-bg)] border border-[var(--fin-border)] rounded-md text-xs font-bold text-[var(--fin-table-row-text)] focus:outline-none focus:border-[var(--fin-brand-500)] appearance-none">
              <option>Feb-2026</option>
              <option>Jan-2026</option>
            </select>
          </div>
        </div>

        <div className="h-6 w-px bg-[var(--fin-skeleton-base)] hidden md:block mx-1" />
        
        <div className="relative hidden md:block md:flex-none">
          <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fin-aux-text)]" />
          <select className="w-full pl-9 pr-8 py-1.5 bg-[var(--fin-table-bg)] border border-[var(--fin-border)] rounded-md text-xs font-bold text-[var(--fin-table-row-text)] focus:outline-none focus:border-[var(--fin-brand-500)] appearance-none">
            <option>Feb-2026</option>
            <option>Jan-2026</option>
          </select>
        </div>
      </div>

      {/* KPI Section - Compact Grid, Less Padding */}
      <div className="shrink-0 grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 lg:mb-6">
        
        <div className="bg-[var(--fin-table-bg)] p-2.5 md:p-4 rounded-md border border-[var(--fin-border)] shadow-sm relative overflow-hidden group hover:bg-[var(--fin-brand-600)] transition-all cursor-default">
          <div className="group-hover:opacity-0 transition-opacity">
            <p className="text-[9px] md:text-[10px] font-black text-[var(--fin-muted-text)] uppercase tracking-widest mb-0.5">Gross Brokerage</p>
            <h3 className="text-base md:text-xl font-black text-[var(--fin-heading-primary)]">{formatCompactNumber(totals.gross)}</h3>
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <h3 className="text-sm md:text-base font-black text-[var(--fin-btn-primary-text)]">₹{totals.gross.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
          </div>
        </div>

        <div className="bg-[var(--fin-table-bg)] p-2.5 md:p-4 rounded-md border border-[var(--fin-border)] shadow-sm relative overflow-hidden group hover:bg-[var(--fin-brand-600)] transition-all cursor-default">
          <div className="group-hover:opacity-0 transition-opacity">
            <p className="text-[9px] md:text-[10px] font-black text-[var(--fin-muted-text)] uppercase tracking-widest mb-0.5">Paid Brokerage</p>
            <h3 className="text-base md:text-xl font-black text-[var(--fin-brand-600)]">{formatCompactNumber(totals.paid)}</h3>
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <h3 className="text-sm md:text-base font-black text-[var(--fin-btn-primary-text)]">₹{totals.paid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
          </div>
        </div>

        {/* <div className="bg-[var(--fin-table-bg)] p-2.5 md:p-4 rounded-md border border-[var(--fin-border)] shadow-sm relative overflow-hidden group hover:bg-[var(--fin-brand-600)] transition-all cursor-default">
          <div className="group-hover:opacity-0 transition-opacity">
            <p className="text-[9px] md:text-[10px] font-black text-[var(--fin-muted-text)] uppercase tracking-widest mb-0.5">Paid (Sub)</p>
            <h3 className="text-base md:text-xl font-black text-[var(--fin-badge-broker-text)]">{formatCompactNumber(totals.paidSub)}</h3>
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <h3 className="text-sm md:text-base font-black text-[var(--fin-btn-primary-text)]">₹{totals.paidSub.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
          </div>
        </div> */}

        <div className="bg-[var(--fin-brand-900)] p-2.5 md:p-4 rounded-md border border-[var(--fin-heading-primary)] shadow-sm relative overflow-hidden group hover:bg-[var(--fin-brand-600)] transition-all cursor-default">
          <div className="group-hover:opacity-0 transition-opacity relative z-10">
            <p className="text-[9px] md:text-[10px] font-black text-[var(--fin-aux-text)] uppercase tracking-widest mb-0.5">Net Receivable</p>
            <h3 className="text-base md:text-xl font-black text-[var(--fin-btn-primary-text)]">{formatCompactNumber(grandNetReceivable)}</h3>
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <h3 className="text-sm md:text-base font-black text-[var(--fin-btn-primary-text)]">₹{grandNetReceivable.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
          </div>
        </div>

      </div>

      {/* Main Table Area -> DesktopBrokerageTable / MobileBrokerageOverview */}
      {error ? (
        <div className="flex-1 flex items-center justify-center bg-[var(--fin-table-bg)] rounded-md border border-[var(--fin-badge-danger-border)] p-8">
           <p className="text-[var(--fin-badge-danger-text)] font-bold">{error}</p>
        </div>
      ) : (
        <React.Fragment>
          <div className="hidden md:flex flex-col flex-1 min-h-0 pb-4 relative">
            {isLoading && (
              <div className="absolute inset-0 bg-[var(--fin-table-bg)]/50 backdrop-blur-[1px] z-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[var(--fin-brand-600)] animate-spin" />
              </div>
            )}
            <DesktopBrokerageTable data={filteredData} totals={totals} groupLabel={activeGroup} />
          </div>

          <div className="md:hidden flex flex-col flex-1 min-h-0 overflow-y-auto pr-1 pb-4 relative">
             {isLoading && (
              <div className="absolute inset-0 bg-[var(--fin-table-bg)]/50 backdrop-blur-[1px] z-50 flex items-center justify-center rounded-md">
                <Loader2 className="w-8 h-8 text-[var(--fin-brand-600)] animate-spin" />
              </div>
            )}
             <MobileBrokerageOverview data={filteredData} totals={totals} groupLabel={activeGroup} />
          </div>
        </React.Fragment>
      )}

    </div>
  );
}