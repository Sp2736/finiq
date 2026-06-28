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
    <div className="bg-[var(--fin-table-bg)] border border-[var(--fin-border)] rounded-md shadow-sm overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-[var(--fin-page-bg)] border-b border-[var(--fin-border-subtle)] text-xs uppercase tracking-widest text-[var(--fin-muted-text)] font-bold">
          <tr>
            <th className="p-4 w-12"></th>
            <th className="p-4">Broker / ARN</th>
            <th className="p-4 text-right">Net Balance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--fin-table-row-border)]">
          {brokers.map((broker: any) => {
            const isExpanded = expandedRow === broker.id;
            const txns = transactionsMap[broker.id] || [];

            return (
              <React.Fragment key={broker.id}>
                {/* PARENT ROW */}
                <tr 
                  onClick={() => toggleRow(broker.id)}
                  className={`cursor-pointer hover:bg-[var(--fin-page-bg)] transition-colors ${isExpanded ? "bg-[var(--fin-page-bg)]/50" : ""}`}
                >
                  <td className="p-4 text-center">
                    <button className="text-[var(--fin-aux-text)] hover:text-[var(--fin-brand-600)]">
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-[var(--fin-heading-primary)]">{broker.name}</p>
                    <p className="text-xs text-[var(--fin-muted-text)] font-mono mt-0.5">ARN: {broker.arn_id}</p>
                  </td>
                  <td className="p-4 text-right font-bold text-[var(--fin-table-row-text)]">
                    {/* Render overall balance here */}
                  </td>
                </tr>

                {/* EXPANDED TRANSACTIONS TABLE */}
                {isExpanded && (
                  <tr className="bg-[var(--fin-page-bg)]/30">
                    <td colSpan={3} className="p-0 border-b border-[var(--fin-border)]">
                      <div className="p-4 pl-16 pr-6 animate-in slide-in-from-top-2 duration-200">
                        <div className="bg-[var(--fin-table-bg)] rounded-md border border-[var(--fin-border)] shadow-sm overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-[var(--fin-page-bg)] border-b border-[var(--fin-border-subtle)] text-[10px] uppercase text-[var(--fin-aux-text)] font-bold">
                              <tr>
                                <th className="p-3">Date & ID</th>
                                <th className="p-3">Method</th>
                                <th className="p-3">Source → Dest</th>
                                <th className="p-3 text-right">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--fin-table-row-border)]">
                              {txns.map((tx) => {
                                const isCredit = tx.type === 'CREDIT';
                                return (
                                  <tr key={tx.id} className="hover:bg-[var(--fin-page-bg)]">
                                    <td className="p-3">
                                      <p className="font-medium text-[var(--fin-table-row-text)]">
                                        {new Date(tx.transaction_date).toLocaleDateString()}
                                      </p>
                                      <p className="text-[10px] text-[var(--fin-aux-text)] font-mono mt-0.5">TxID: {tx.transaction_id}</p>
                                    </td>
                                    <td className="p-3">
                                      <span className="font-bold text-[var(--fin-body-text)]">{tx.payment_mode}</span>
                                      {tx.upi_id && <p className="text-[10px] text-[var(--fin-aux-text)] mt-0.5">{tx.upi_id}</p>}
                                    </td>
                                    <td className="p-3 text-[var(--fin-muted-text)]">
                                      <p>{tx.source_account || "N/A"} →</p>
                                      <p>{tx.destination_account || "N/A"}</p>
                                    </td>
                                    <td className="p-3 text-right font-black tabular-nums">
                                      <div className={`flex items-center justify-end gap-1 ${isCredit ? 'text-[var(--fin-badge-success-text)]' : 'text-[var(--fin-badge-danger-text)]'}`}>
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