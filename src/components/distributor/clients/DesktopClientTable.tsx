"use client";

import React, { useState } from 'react';
import { formatCompactNumber, formatCurrency } from '@/lib/utils';
import { Investor } from '@/services/distributor.service';
import { ChevronRight, Mail, Calendar, KeySquare, Briefcase } from 'lucide-react';

export default function DesktopClientTable({ clients }: { clients: Investor[] }) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  if (!clients || clients.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        No investors found.
      </div>
    );
  }

  return (
    <table className="w-full text-left border-separate border-spacing-0 min-w-[800px]">
      <thead className="sticky top-0 z-20">
        <tr className="bg-slate-50/90 backdrop-blur-sm shadow-sm ring-1 ring-slate-200/50">
          <th className="p-3 w-10 border-b border-slate-100"></th>
          <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Investor Name</th>
          <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">PAN</th>
          <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Tax Status</th>
          <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right border-b border-slate-100 pr-6">Total AUM</th>
        </tr>
      </thead>
      <tbody className="text-sm">
        {clients.map((client) => {
          const isExpanded = expandedRow === client.id;
          
          return (
            <React.Fragment key={client.id}>
              {/* Main Row */}
              <tr 
                onClick={() => setExpandedRow(isExpanded ? null : client.id)} 
                className={`cursor-pointer transition-colors duration-200 group border-b border-slate-100 ${isExpanded ? 'bg-emerald-50/30' : 'hover:bg-slate-50/80'}`}
              >
                {/* Left Arrow Column */}
                <td className={`p-3 text-center border-b border-slate-100 transition-colors ${isExpanded ? 'bg-[#f0fdf4]' : 'bg-white group-hover:bg-[#f8fafc]'}`}>
                  <button className="text-slate-400 group-hover:text-emerald-600 outline-none p-1 rounded-md group-hover:bg-emerald-100/50 transition-colors">
                    <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-emerald-600' : 'rotate-0'}`} />
                  </button>
                </td>
                <td className="py-3 border-b border-slate-100 transition-colors">
                  <p className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{client.name}</p>
                </td>
                <td className="px-6 py-3 border-b border-slate-100 transition-colors">
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-bold font-mono tracking-wide group-hover:bg-white group-hover:shadow-sm transition-all">
                    {client.pan}
                  </span>
                </td>
                <td className="px-6 py-3 border-b border-slate-100 transition-colors">
                  <p className="font-medium text-slate-600 text-xs">{client.tax_status}</p>
                </td>
                <td className="px-6 py-3 text-right border-b border-slate-100 transition-colors pr-6">
                  {/* Compact AUM fades out seamlessly when the row is expanded */}
                  <p 
                    className={`font-black text-slate-900 tabular-nums transition-opacity duration-300 ${isExpanded ? 'opacity-0' : 'opacity-100'}`} 
                    title={formatCurrency(client.total_aum)}
                  >
                    {formatCompactNumber(client.total_aum)}
                  </p>
                </td>
              </tr>

              {/* Expandable Details Row (Smooth Animated) */}
              <tr className="bg-slate-50/40">
                <td colSpan={5} className="p-0 border-b border-slate-200/60">
                  <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <div className="p-4 pl-8 border-l-2 border-emerald-300 ml-6 my-2">
                        
                        <div className="mb-3 flex items-center justify-between">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 flex items-center gap-2">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Investor Profile Details
                          </h4>
                        </div>

                        {/* Updated to a 5-column grid (lg:grid-cols-5) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                          
                          {/* Email Block - Spans 2 columns */}
                          <div className="flex items-center gap-3 md:col-span-2 lg:col-span-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                              <Mail className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Email Address</p>
                              <p className="text-sm font-bold text-slate-700 truncate" title={client.email}>{client.email || 'N/A'}</p>
                            </div>
                          </div>

                          {/* Date of Birth Block - Spans 1 column */}
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                              <Calendar className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Date of Birth</p>
                              <p className="text-sm font-bold text-slate-700">{client.date_of_birth || 'N/A'}</p>
                            </div>
                          </div>

                          {/* Login Identifier Block - Spans 1 column */}
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                              <KeySquare className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Login Identifier</p>
                              <p className="text-sm font-bold text-slate-700">{client.login_identifier || 'N/A'}</p>
                            </div>
                          </div>

                          {/* Exact AUM Block - Spans 1 column */}
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                              <Briefcase className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Exact AUM</p>
                              <p className="text-sm font-black text-slate-700 tabular-nums truncate">
                                {formatCurrency(client.total_aum)}
                              </p>
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </React.Fragment>
          );
        })}
      </tbody>
    </table>
  );
}