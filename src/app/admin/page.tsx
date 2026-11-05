"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Server,
  Activity,
  Layers,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Clock,
  RefreshCw,
  Search,
  ExternalLink,
  Sliders,
  Database,
  Cpu,
  Terminal,
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import LogoutButton from "@/components/investor/LogoutButton";

interface AdminLog {
  id: string;
  timestamp: string;
  service: string;
  level: "INFO" | "WARN" | "ERROR";
  message: string;
  metadata?: Record<string, any>;
}

export default function AdminDashboardPage() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [themeName, setThemeName] = useState("System Default");

  const fetchLogs = async () => {
    try {
      const res = await apiClient.get<any>("/admin/audit-logs");
      if (res?.data) {
        setLogs(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch admin logs", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchLogs();
  };

  const filteredLogs = logs.filter((log) => {
    const matchesLevel = selectedLevel === "ALL" || log.level === selectedLevel;
    const matchesSearch =
      searchTerm === "" ||
      log.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[var(--fin-page-bg)] text-[var(--fin-heading-primary)] font-sans relative overflow-x-hidden p-6 sm:p-10">
      {/* Background Ambience */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[var(--fin-brand-500)]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-[var(--fin-brand-600)]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--fin-border)]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--fin-brand-600)] to-[var(--fin-brand-800)] flex items-center justify-center text-white shadow-xl shadow-[var(--fin-brand-900)]/20">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--fin-heading-primary)]">
                  Admin Control & Telemetry
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Cluster: Healthy
                </span>
              </div>
              <p className="text-xs text-[var(--fin-muted-text)] font-medium mt-1">
                Infrastructure monitors, CAMS/KFintech statement pipelines, and platform configuration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/architecture"
              className="px-4 py-2 rounded-xl bg-[var(--fin-brand-100)] hover:bg-[var(--fin-brand-200)] border border-[var(--fin-brand-300)] text-xs font-bold text-[var(--fin-brand-800)] transition-all flex items-center gap-2"
            >
              <Server className="w-4 h-4 text-[var(--fin-brand-600)]" />
              <span>Backend Architecture Documentary</span>
            </Link>
            <button
              onClick={handleRefresh}
              className="p-2 rounded-xl bg-[var(--fin-table-bg)] hover:bg-[var(--fin-brand-50)] border border-[var(--fin-border)] text-[var(--fin-heading-primary)] transition-all"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[var(--fin-brand-600)]" : ""}`} />
            </button>
            <LogoutButton portal="staff" redirectTo="/login" />
          </div>
        </div>

        {/* Quick Nav to other Portals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/investor"
            className="p-4 rounded-2xl bg-[var(--fin-table-bg)] hover:bg-[var(--fin-brand-50)] border border-[var(--fin-border)] hover:border-emerald-500/50 transition-all group flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-[var(--fin-muted-text)] font-medium">Switch Portal</p>
                <p className="text-sm font-bold text-[var(--fin-heading-primary)] group-hover:text-emerald-700 transition-colors">
                  Investor Dashboard
                </p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-[var(--fin-muted-text)] group-hover:text-emerald-600 transition-colors" />
          </Link>

          <Link
            href="/distributor"
            className="p-4 rounded-2xl bg-[var(--fin-table-bg)] hover:bg-[var(--fin-brand-50)] border border-[var(--fin-border)] hover:border-[var(--fin-brand-600)] transition-all group flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--fin-brand-100)] text-[var(--fin-brand-700)] flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-[var(--fin-muted-text)] font-medium">Switch Portal</p>
                <p className="text-sm font-bold text-[var(--fin-heading-primary)] group-hover:text-[var(--fin-brand-700)] transition-colors">
                  Distributor Dashboard
                </p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-[var(--fin-muted-text)] group-hover:text-[var(--fin-brand-600)] transition-colors" />
          </Link>

          <Link
            href="/architecture"
            className="p-4 rounded-2xl bg-[var(--fin-table-bg)] hover:bg-[var(--fin-brand-50)] border border-[var(--fin-border)] hover:border-[var(--fin-brand-600)] transition-all group flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-[var(--fin-muted-text)] font-medium">System Documentation</p>
                <p className="text-sm font-bold text-[var(--fin-heading-primary)] group-hover:text-indigo-700 transition-colors">
                  Backend Architecture Documentary
                </p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-[var(--fin-muted-text)] group-hover:text-indigo-600 transition-colors" />
          </Link>
        </div>

        {/* Telemetry KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[var(--fin-table-bg)] border border-[var(--fin-border)] shadow-sm">
            <div className="flex items-center justify-between text-xs text-[var(--fin-muted-text)] mb-1">
              <span>API Request Rate</span>
              <Activity className="w-4 h-4 text-[var(--fin-brand-600)]" />
            </div>
            <div className="text-2xl font-black text-[var(--fin-heading-primary)]">1,482 req/s</div>
            <div className="text-[11px] text-emerald-600 font-bold mt-1">99.98% 2xx Success</div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--fin-table-bg)] border border-[var(--fin-border)] shadow-sm">
            <div className="flex items-center justify-between text-xs text-[var(--fin-muted-text)] mb-1">
              <span>BullMQ Queue</span>
              <Cpu className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-[var(--fin-heading-primary)]">0 pending</div>
            <div className="text-[11px] text-[var(--fin-muted-text)] mt-1">6 workers active</div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--fin-table-bg)] border border-[var(--fin-border)] shadow-sm">
            <div className="flex items-center justify-between text-xs text-[var(--fin-muted-text)] mb-1">
              <span>PostgreSQL Latency</span>
              <Database className="w-4 h-4 text-[var(--fin-brand-600)]" />
            </div>
            <div className="text-2xl font-black text-[var(--fin-heading-primary)]">4.2 ms</div>
            <div className="text-[11px] text-emerald-600 font-bold mt-1">Connection Pool 18/50</div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--fin-table-bg)] border border-[var(--fin-border)] shadow-sm">
            <div className="flex items-center justify-between text-xs text-[var(--fin-muted-text)] mb-1">
              <span>Active Theme</span>
              <Sliders className="w-4 h-4 text-[var(--fin-brand-600)]" />
            </div>
            <div className="text-xl font-bold text-[var(--fin-heading-primary)] truncate">{themeName}</div>
            <div className="text-[11px] text-[var(--fin-brand-600)] font-semibold mt-1">Platform-Wide Default</div>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="rounded-3xl bg-[var(--fin-table-bg)] border border-[var(--fin-border)] shadow-sm overflow-hidden">
          <div className="p-5 border-b border-[var(--fin-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-[var(--fin-brand-600)]" />
              <h2 className="text-lg font-bold text-[var(--fin-heading-primary)]">System Audit & Ingestion Logs</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[var(--fin-brand-100)] text-[var(--fin-brand-800)]">
                {filteredLogs.length} events
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-[var(--fin-muted-text)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-1.5 rounded-xl bg-[var(--fin-brand-50)] border border-[var(--fin-border)] text-xs text-[var(--fin-heading-primary)] placeholder-[var(--fin-muted-text)] focus:outline-none focus:border-[var(--fin-brand-600)] transition-all"
                />
              </div>

              {/* Level Filter */}
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="py-1.5 px-3 rounded-xl bg-[var(--fin-brand-50)] border border-[var(--fin-border)] text-xs text-[var(--fin-heading-primary)] focus:outline-none focus:border-[var(--fin-brand-600)]"
              >
                <option value="ALL">All Levels</option>
                <option value="INFO">INFO</option>
                <option value="WARN">WARN</option>
                <option value="ERROR">ERROR</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--fin-table-header-bg)] text-[var(--fin-table-header-text)] font-bold uppercase tracking-wider border-b border-[var(--fin-border)]">
                <tr>
                  <th className="py-3 px-4">Level</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Message</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--fin-border)]">
                {filteredLogs.map((log) => {
                  const isError = log.level === "ERROR";
                  const isWarn = log.level === "WARN";
                  return (
                    <tr key={log.id} className="hover:bg-[var(--fin-brand-50)] transition-colors">
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isError
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : isWarn
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {isError ? (
                            <XCircle className="w-3 h-3 text-rose-600" />
                          ) : isWarn ? (
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          )}
                          {log.level}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[var(--fin-muted-text)] font-mono whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-[var(--fin-brand-700)] whitespace-nowrap">
                        {log.service}
                      </td>
                      <td className="py-3 px-4 text-[var(--fin-heading-primary)] font-medium">
                        {log.message}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {log.metadata && (
                          <span className="font-mono text-[10px] text-[var(--fin-muted-text)] bg-[var(--fin-brand-50)] px-2 py-1 rounded border border-[var(--fin-border)]">
                            {JSON.stringify(log.metadata)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
