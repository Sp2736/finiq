"use client";

import React, { useState } from 'react';
import { formatCompactNumber, formatCurrency } from '@/lib/utils';
import { Investor } from '@/services/distributor.service';
import { ChevronDown, ChevronUp, Mail, Calendar, KeySquare, Briefcase, FileText } from 'lucide-react';

export default function MobileClientList({ clients }: { clients: Investor[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!clients || clients.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium bg-white rounded-xl border border-slate-200">
        No investors found.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-2">
      {clients.map((client) => {
        const isExpanded = expandedId === client.id;

        return (
          <div 
            key={client.id} 
            className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden ${
              isExpanded ? 'border-emerald-300 shadow-md shadow-emerald-600/5' : 'border-slate-200 shadow-sm'
            }`}
          >
            {/* Header / Collapsed State */}
            <div 
              onClick={() => setExpandedId(isExpanded ? null : client.id)}
              className={`p-3 md:p-4 flex items-center justify-between cursor-pointer transition-colors ${
                isExpanded ? 'bg-emerald-50/50' : 'active:bg-slate-50'
              }`}
            >
              <div className="flex flex-col min-w-0 flex-1">
                <p className="font-bold text-slate-900 text-sm md:text-base truncate pr-2">{client.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] md:text-xs font-bold font-mono tracking-wide">
                    {client.pan}
                  </span>
                </div>
              </div>

              {/* Tablet View: Total AUM visible before expanding */}
              <div className="hidden md:flex flex-col items-end mr-4 shrink-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total AUM</p>
                <p className="font-black text-slate-900 tabular-nums text-sm">
                  {formatCompactNumber(client.total_aum)}
                </p>
              </div>

              <div className={`p-1.5 rounded-lg transition-colors ${isExpanded ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-50 text-slate-400'}`}>
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>

            {/* Expanded State Details */}
            {isExpanded && (
              <div className="p-3 md:p-4 border-t border-slate-100 bg-slate-50/30 animate-in slide-in-from-top-2 fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Mobile Only: Total AUM (Hidden on Tablet since it's in the header) */}
                  <div className="md:hidden flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                    <div className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total AUM</p>
                      <p className="text-xs font-black text-slate-900 tabular-nums">
                        {formatCurrency(client.total_aum)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-100 shadow-sm sm:col-span-2">
                    <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Email Address</p>
                      <p className="text-xs font-bold text-slate-700 truncate">{client.email || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                    <div className="w-8 h-8 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Date of Birth</p>
                      <p className="text-xs font-bold text-slate-700">{client.date_of_birth || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                    <div className="w-8 h-8 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <KeySquare className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Login ID</p>
                      <p className="text-xs font-bold text-slate-700 truncate">{client.login_identifier || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                    <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Tax Status</p>
                      <p className="text-xs font-bold text-slate-700 truncate">{client.tax_status}</p>
                    </div>
                  </div>

                  {/* Tablet Only: Exact AUM (Since compact AUM is in header) */}
                  <div className="hidden md:flex flex-col justify-center sm:col-span-2 pt-2 border-t border-slate-100/50 mt-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 text-right">Exact AUM Value</p>
                      <p className="text-sm font-black text-slate-900 tabular-nums text-right">
                        {formatCurrency(client.total_aum)}
                      </p>
                  </div>

                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}