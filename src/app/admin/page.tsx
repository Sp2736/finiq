"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import LogoutButton from "@/components/investor/LogoutButton";
import {
  ShieldCheck,
  Server,
  Activity,
  Database,
  Cpu,
  Layers,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Palette,
  Terminal,
  ExternalLink,
} from "lucide-react";
import { loadMockDb, INITIAL_ADMIN_LOGS, INITIAL_SAVED_THEMES } from "@/lib/mockDatabase";
import { apiClient } from "@/lib/apiClient";

export default function AdminDashboard() {
  const [logs, setLogs] = useState(INITIAL_ADMIN_LOGS);
  const [activeTab, setActiveTab] = useState<"logs" | "telemetry" | "themes">("logs");
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");
  const [activeThemeName, setActiveThemeName] = useState("FinIQ Modern Slate");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    try {
      const db = loadMockDb();
      if (db.adminLogs) setLogs(db.adminLogs);
      if (db.activeTheme?.theme_name) setActiveThemeName(db.activeTheme.theme_name);
    } catch (e) {
      console.warn("Error loading admin telemetry:", e);
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 400);
  };

  const handleActivateTheme = async (themeId: string, themeName: string) => {
    await apiClient.put(`themes/activate/${themeId}`, {});
    setActiveThemeName(themeName);
  };

  const filteredLogs = logs.filter((log) => {
    if (selectedLevel === "ALL") return true;
    return log.level === selectedLevel;
  });

  return (
    <div className="min-h-screen bg-[var(--fin-page-bg,#0a0f1d)] text-[var(--fin-heading-primary,#f8fafc)] font-sans relative overflow-x-hidden p-6 sm:p-10">
      {/* Background Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-purple-500/20">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Admin Control & Telemetry
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  Cluster: Healthy
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Infrastructure monitors, CAMS/KARVY statement pipelines, and platform configuration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/architecture"
              className="px-4 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-xs font-bold text-blue-300 transition-all flex items-center gap-2"
            >
              <Server className="w-4 h-4 text-blue-400" />
              <span>Backend Architecture</span>
            </Link>
            <button
              onClick={handleRefresh}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
            <LogoutButton portal="staff" redirectTo="/login" />
          </div>
        </div>

        {/* Quick Nav to other Portals for Easy Pair Testing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/investor"
            className="p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Switch Portal</p>
                <p className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                  Investor Dashboard
                </p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
          </Link>

          <Link
            href="/distributor"
            className="p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Switch Portal</p>
                <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                  Distributor Dashboard
                </p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
          </Link>

          <Link
            href="/architecture"
            className="p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/50 transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Technical Deep Dive</p>
                <p className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">
                  NestJS Architecture
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
          </Link>
        </div>

        {/* System Health KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-400 font-medium">API Availability</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
            </div>
            <p className="text-2xl font-black text-white">99.98%</p>
            <p className="text-[11px] text-emerald-400 font-semibold mt-1">Nominal • 0 Outages</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-400 font-medium">PostgreSQL Pool</span>
              <Database className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-black text-white">18 / 50</p>
            <p className="text-[11px] text-blue-400 font-semibold mt-1">Active Connections</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-400 font-medium">Redis Ingestion Queue</span>
              <Cpu className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-black text-white">0 Pending</p>
            <p className="text-[11px] text-purple-400 font-semibold mt-1">BullMQ Workers: 4 Active</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-400 font-medium">Today&apos;s Statements</span>
              <FileText className="w-4 h-4 text-teal-400" />
            </div>
            <p className="text-2xl font-black text-white">5,960</p>
            <p className="text-[11px] text-teal-400 font-semibold mt-1">Folios Synced (CAMS/KARVY)</p>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setActiveTab("logs")}
            className={`py-3 px-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "logs"
                ? "border-purple-500 text-purple-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>System Audit Logs</span>
          </button>
          <button
            onClick={() => setActiveTab("telemetry")}
            className={`py-3 px-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "telemetry"
                ? "border-purple-500 text-purple-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Pipelines & Queues</span>
          </button>
          <button
            onClick={() => setActiveTab("themes")}
            className={`py-3 px-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "themes"
                ? "border-purple-500 text-purple-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Theme Configurations</span>
          </button>
        </div>

        {/* Tab 1: System Audit Logs */}
        {activeTab === "logs" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 font-medium">Filter Severity:</span>
                {["ALL", "INFO", "AUDIT", "SECURITY"].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setSelectedLevel(lvl)}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      selectedLevel === lvl
                        ? "bg-purple-600 text-white shadow-sm"
                        : "bg-slate-800/80 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
              <span className="text-xs text-slate-500">
                Displaying {filteredLogs.length} verified audit records
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="divide-y divide-slate-800/60 font-mono text-xs">
                {filteredLogs.map((log) => {
                  const levelBadgeColor =
                    log.level === "SECURITY"
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      : log.level === "AUDIT"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      : "bg-blue-500/10 text-blue-400 border-blue-500/20";

                  return (
                    <div
                      key={log.id}
                      className="p-4 hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="flex items-start md:items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${levelBadgeColor}`}>
                          {log.level}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-200">{log.module}</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-purple-400 font-semibold">{log.action}</span>
                          </div>
                          <p className="text-slate-400 text-[11px] font-sans mt-0.5">{log.detail}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-[11px] text-slate-500 shrink-0">
                        <span className="flex items-center gap-1 text-emerald-400 font-sans font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {log.status}
                        </span>
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Pipelines & Queues */}
        {activeTab === "telemetry" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base">CAMS Statement Ingestion</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Active Queue
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Polls secure SFTP endpoints, parses encrypted DBF/Excel files via streaming buffers, and updates client folios.
              </p>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Worker Type:</span>
                  <span className="font-mono text-slate-200">BullMQ IngestionWorker</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Batch Rate:</span>
                  <span className="font-mono text-emerald-400">1,200 records/sec</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Integrity Check:</span>
                  <span className="font-mono text-purple-400">SHA-256 Checksum</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base">KARVY (KFintech) Parser</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Active Queue
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Processes daily transaction feeds, normalizes AMC codes, and maps registrar records to UnifiedFund models.
              </p>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Worker Type:</span>
                  <span className="font-mono text-slate-200">BullMQ KFintechWorker</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Batch Rate:</span>
                  <span className="font-mono text-emerald-400">950 records/sec</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Deduplication:</span>
                  <span className="font-mono text-purple-400">Idempotency Key</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base">FIFO Tax Calculator Engine</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  On-Demand
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Matches buy lots against redemption events with strict chronological ordering, computing Section 112A LTCG / STCG gains.
              </p>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Engine Algorithm:</span>
                  <span className="font-mono text-slate-200">Strict FIFO Heap</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Grandfathering:</span>
                  <span className="font-mono text-emerald-400">Jan 31 2018 NAV Base</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Avg Latency:</span>
                  <span className="font-mono text-purple-400">32ms per client</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Themes */}
        {activeTab === "themes" && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Active Platform Theme</p>
                <h3 className="text-xl font-bold text-white mt-1">{activeThemeName}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Styles are dynamically propagated to all dashboard modules via CSS root variables.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-500 shadow-md" />
                <span className="w-6 h-6 rounded-full bg-indigo-600 shadow-md" />
                <span className="w-6 h-6 rounded-full bg-slate-800 shadow-md border border-slate-700" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {INITIAL_SAVED_THEMES.map((theme) => {
                const isActive = activeThemeName === theme.name;
                return (
                  <div
                    key={theme.id}
                    className={`p-5 rounded-2xl bg-slate-900/80 border transition-all ${
                      isActive ? "border-purple-500 ring-1 ring-purple-500/30" : "border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-white text-sm">{theme.name}</h4>
                      {isActive && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 mb-5">
                      {Object.values(theme.variables).slice(0, 4).map((color, idx) => (
                        <span
                          key={idx}
                          className="w-5 h-5 rounded-md border border-white/10 shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => handleActivateTheme(theme.id, theme.name)}
                      disabled={isActive}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? "bg-slate-800 text-slate-500 cursor-default"
                          : "bg-purple-600 hover:bg-purple-500 text-white shadow-sm"
                      }`}
                    >
                      {isActive ? "Currently Applied" : "Activate Theme"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
