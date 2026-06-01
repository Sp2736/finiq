"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { distributorService } from "@/services/distributor.service";

export default function BrokerLedgerTable() {
  const [brokers, setBrokers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [transactionsMap, setTransactionsMap] = useState<Record<string, any[]>>({});
  const [loadingTxns, setLoadingTxns] = useState<string | null>(null);

  // 1. Fetch Summary using the Service
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await distributorService.getBrokerLedgerSummary();
        // Adjust the `res.data.data` depending on how your backend wraps the response
        setBrokers(res?.data?.data || res?.data || []);
      } catch (err) {
        console.error("Failed to load ledger summary");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSummary();
  }, []);

  // 2. Fetch History using the Service
  const toggleRow = async (subBrokerId: string) => {
    if (expandedRow === subBrokerId) {
      setExpandedRow(null);
      return;
    }
    
    setExpandedRow(subBrokerId);
    
    if (!transactionsMap[subBrokerId]) {
      setLoadingTxns(subBrokerId);
      try {
        const res = await distributorService.getBrokerTransactionHistory(subBrokerId);
        setTransactionsMap(prev => ({ 
          ...prev, 
          [subBrokerId]: res?.data?.data || res?.data || [] 
        }));
      } catch (err) {
        console.error("Failed to fetch transactions");
      } finally {
        setLoadingTxns(null);
      }
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-widest text-slate-500 font-bold">
          <tr>
            <th className="p-4 w-12"></th>
            <th className="p-4">Broker / ARN</th>
            <th className="p-4 text-right">Net Balance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {brokers.map((broker: any) => {
            const isExpanded = expandedRow === broker.id;
            const txns = transactionsMap[broker.id] || [];

            return (
              <React.Fragment key={broker.id}>
                {/* PARENT ROW */}
                <tr 
                  onClick={() => toggleRow(broker.id)}
                  className={`cursor-pointer hover:bg-slate-50 transition-colors ${isExpanded ? "bg-slate-50/50" : ""}`}
                >
                  <td className="p-4 text-center">
                    <button className="text-slate-400 hover:text-distributor-600">
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-slate-900">{broker.name}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">ARN: {broker.arn_id}</p>
                  </td>
                  <td className="p-4 text-right font-bold text-slate-700">
                    {/* Render overall balance here */}
                  </td>
                </tr>

                {/* EXPANDED TRANSACTIONS TABLE */}
                {isExpanded && (
                  <tr className="bg-slate-50/30">
                    <td colSpan={3} className="p-0 border-b border-slate-200">
                      <div className="p-4 pl-16 pr-6 animate-in slide-in-from-top-2 duration-200">
                        <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase text-slate-400 font-bold">
                              <tr>
                                <th className="p-3">Date & ID</th>
                                <th className="p-3">Method</th>
                                <th className="p-3">Source → Dest</th>
                                <th className="p-3 text-right">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {txns.map((tx) => {
                                const isCredit = tx.type === 'CREDIT';
                                return (
                                  <tr key={tx.id} className="hover:bg-slate-50">
                                    <td className="p-3">
                                      <p className="font-medium text-slate-700">
                                        {new Date(tx.transaction_date).toLocaleDateString()}
                                      </p>
                                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">TxID: {tx.transaction_id}</p>
                                    </td>
                                    <td className="p-3">
                                      <span className="font-bold text-slate-600">{tx.payment_mode}</span>
                                      {tx.upi_id && <p className="text-[10px] text-slate-400 mt-0.5">{tx.upi_id}</p>}
                                    </td>
                                    <td className="p-3 text-slate-500">
                                      <p>{tx.source_account || "N/A"} →</p>
                                      <p>{tx.destination_account || "N/A"}</p>
                                    </td>
                                    <td className="p-3 text-right font-black tabular-nums">
                                      <div className={`flex items-center justify-end gap-1 ${isCredit ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {isCredit ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                        {formatCurrency(tx.amount)}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}