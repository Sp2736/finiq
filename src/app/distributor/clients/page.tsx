"use client";

import React, { useState, useEffect } from 'react';
import { distributorService, Investor } from '@/services/distributor.service';
import {
  Users,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Mail,
  CreditCard,
  UserCheck
} from 'lucide-react';

const formatName = (name: string) => {
  if (!name) return "";
  return name
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatTaxStatus = (status: string) => {
  if (!status) return "N/A";
  if (status.includes("Individual")) return "Individual";
  if (status === "UNRESOLVED_NRI") return "NRI";
  return status;
};

const formatPan = (pan: string) => {
  if (!pan) return "N/A";
  if (pan.includes("MINOR")) return "(Minor)"
  return pan.toUpperCase();
}

export default function ClientsPage() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 30,
    totalPages: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInvestors(1, true);
  }, []);

  const fetchInvestors = async (page: number, isInitial: boolean = false) => {
    if (isInitial) setIsLoading(true);
    else setIsFetching(true);
    
    try {
      const response = await distributorService.getInvestors(page, 30);
      if (response.success) {
        setInvestors(response.data.data);
        setPagination({
          total: response.data.total,
          page: response.data.page,
          limit: response.data.limit,
          totalPages: response.data.totalPages
        });
        // Optional: Reset selection on page change
        // setSelectedIds(new Set());
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load investors");
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchInvestors(newPage);
    }
  };

  const toggleAll = () => {
    if (selectedIds.size === investors.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(investors.map(i => i.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-bold tracking-tight uppercase text-xs">Loading Client Database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-end mb-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-1">
            Client <span className="text-emerald-600">Management</span>
          </h1>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search investors..."
              className="pl-11 pr-6 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all w-64 shadow-sm"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-xs hover:border-emerald-600 hover:text-emerald-600 transition-all shadow-sm">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Investor Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
        {/* Table Loading Overlay */}
        {isFetching && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-20 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <div className="overflow-x-auto overflow-y-auto max-h-[70vh] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <table className="w-full text-left border-collapse relative">
            <thead>
              <tr className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                <th className="px-6 py-4 bg-slate-50 border-b border-slate-100 w-10 text-center">
                  <input 
                    type="checkbox" 
                    className="w-3.5 h-3.5 accent-emerald-600 rounded border-slate-300 cursor-pointer"
                    checked={investors.length > 0 && selectedIds.size === investors.length}
                    onChange={toggleAll}
                  />
                </th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 border-b border-slate-100">Client Name</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 border-b border-slate-100">Code</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 border-b border-slate-100">Tax Status</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 border-b border-slate-100">PAN</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 border-b border-slate-100">Email</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right bg-slate-50 border-b border-slate-100">AUM</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {investors.map((investor) => (
                <tr key={investor.id} className={`hover:bg-slate-50/50 transition-colors group ${selectedIds.has(investor.id) ? 'bg-emerald-50/30' : ''}`}>
                  <td className="px-6 py-3 text-center">
                    <input 
                      type="checkbox" 
                      className="w-3.5 h-3.5 accent-emerald-600 rounded border-slate-300 cursor-pointer"
                      checked={selectedIds.has(investor.id)}
                      onChange={() => toggleOne(investor.id)}
                    />
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-between group/name">
                      <p className={`font-bold leading-tight text-[11px] ${selectedIds.has(investor.id) ? 'text-emerald-700' : 'text-slate-800'}`}>
                        {formatName(investor.name)}
                      </p>
                      <button className="opacity-0 group-hover/name:opacity-100 p-1 hover:bg-white rounded transition-all border border-transparent hover:border-slate-200">
                        <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </div>
                  </td>


                  <td className="px-6 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${investor.login_identifier !== 'N/A' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                      {investor.login_identifier}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-[11px] font-medium text-slate-500">
                    {formatTaxStatus(investor.tax_status)}
                  </td>
                  <td className="px-6 py-3 text-[11px] font-bold text-slate-700">
                    {formatPan(investor.pan)}
                  </td>
                  <td className="px-6 py-3">
                    <p className="text-[11px] font-medium text-slate-400 lowercase truncate max-w-[150px]">{investor.email}</p>
                  </td>
                  <td className="px-6 py-3 text-right font-black text-slate-800 text-[11px]">
                    ₹{investor.total_aum.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-3 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Page <span className="text-slate-900">{pagination.page}</span> of <span className="text-slate-900">{pagination.totalPages}</span>
          </p>
          <div className="flex gap-1.5">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1 || isFetching}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-emerald-600 hover:text-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages || isFetching}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-emerald-600 hover:text-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

