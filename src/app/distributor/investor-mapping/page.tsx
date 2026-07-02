"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  distributorService,
  AssignableBroker,
  MappableInvestor,
  MappingHistoryEntry,
} from "@/services/distributor.service";
import {
  Loader2,
  ChevronRight,
  ChevronDown,
  User,
  Users,
  Repeat2,
  Briefcase,
  Search,
  CheckSquare,
  Square,
} from "lucide-react";
import { toTitleCase } from "@/lib/utils";
import { decodeJwt, DecodedStaffToken } from "@/lib/authClient";
import Cookies from "js-cookie";
import ErrorNotice from "@/components/ui/ErrorNotice";
import SuccessNotice from "@/components/ui/SuccessNotice";

// ─── RECURSIVE BROKER TREE NODE ───
const BrokerTreeNode = ({
  broker,
  allBrokers,
  selectedId,
  onSelect,
  depth = 0,
}: {
  broker: AssignableBroker;
  allBrokers: AssignableBroker[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  depth?: number;
}) => {
  const [isExpanded, setIsExpanded] = useState(depth === 0);
  const children = allBrokers.filter((b) => b.parent_id === broker.id);
  const hasChildren = children.length > 0;
  const isSelected = selectedId === broker.id;

  return (
    <div className="flex flex-col">
      <div
        className={`flex items-center gap-2 py-2 px-3 rounded-md cursor-pointer transition-colors ${
          isSelected
            ? "bg-[var(--fin-brand-50)] border border-[var(--fin-brand-200)]"
            : "hover:bg-[var(--fin-page-bg)] border border-transparent"
        }`}
        style={{ marginLeft: `${depth * 16}px` }}
        onClick={() => onSelect(broker.id)}
      >
        <button
          className="w-5 h-5 flex items-center justify-center shrink-0"
          onClick={(e) => {
            if (hasChildren) {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }
          }}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 text-[var(--fin-muted-text)]" />
            ) : (
              <ChevronRight className="w-4 h-4 text-[var(--fin-muted-text)]" />
            )
          ) : (
            <div className="w-4 h-4" /> // Spacer
          )}
        </button>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Briefcase
            className={`w-4 h-4 shrink-0 ${
              isSelected
                ? "text-[var(--fin-brand-600)]"
                : "text-[var(--fin-aux-text)]"
            }`}
          />
          <div className="flex flex-col min-w-0">
            <span
              className={`text-sm truncate ${
                isSelected
                  ? "font-bold text-[var(--fin-brand-900)]"
                  : "font-medium text-[var(--fin-body-text)]"
              }`}
            >
              {toTitleCase(broker.name || "Unknown")}
            </span>
            {broker.arn_id && (
              <span className="text-[10px] text-[var(--fin-aux-text)] font-mono truncate">
                {broker.arn_id}
              </span>
            )}
          </div>
        </div>
      </div>
      {isExpanded && hasChildren && (
        <div className="flex flex-col">
          {children.map((child) => (
            <BrokerTreeNode
              key={child.id}
              broker={child}
              allBrokers={allBrokers}
              selectedId={selectedId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function InvestorMappingPage() {
  const [activeTab, setActiveTab] = useState<"unmapped" | "mapped" | "history">(
    "unmapped",
  );

  // State
  const [brokers, setBrokers] = useState<AssignableBroker[]>([]);
  const [investors, setInvestors] = useState<MappableInvestor[]>([]);
  const [history, setHistory] = useState<MappingHistoryEntry[]>([]);

  const [selectedBrokerId, setSelectedBrokerId] = useState<string | null>(null);
  const [selectedInvestorIds, setSelectedInvestorIds] = useState<Set<string>>(
    new Set(),
  );

  const [search, setSearch] = useState("");
  const [unmappedStatusFilter, setUnmappedStatusFilter] = useState<
    "all" | "mapped" | "unmapped"
  >("all");

  const [isLoadingBrokers, setIsLoadingBrokers] = useState(true);
  const [isLoadingInvestors, setIsLoadingInvestors] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pageSuccess, setPageSuccess] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Role extraction
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const token = Cookies.get("staff-auth-token");
    if (token) {
      const decoded = decodeJwt<DecodedStaffToken>(token);
      if (decoded && decoded.roles && decoded.roles.length > 0) {
        setUserRole(decoded.roles[0].role);
      }
    }
  }, []);

  // Fetch Brokers
  const fetchBrokers = async () => {
    setIsLoadingBrokers(true);
    setErrorMsg(null);
    try {
      const res = await distributorService.getAssignableBrokers();
      if (res.success) {
        setBrokers(res.data);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        setErrorMsg(err.response.data?.message || "Permission denied.");
      } else {
        setErrorMsg("Failed to load brokers.");
      }
    } finally {
      setIsLoadingBrokers(false);
    }
  };

  useEffect(() => {
    fetchBrokers();
  }, []);

  // Fetch Investors
  const fetchInvestors = useCallback(async () => {
    setIsLoadingInvestors(true);
    try {
      if (activeTab === "history") {
        const res = await distributorService.getMappingHistory(
          page,
          20,
          selectedBrokerId || undefined,
        );
        if (res.success) {
          setHistory(res.data.data);
          setTotalPages(res.data.totalPages);
        }
      } else {
        const isMappedTab = activeTab === "mapped";
        const status = isMappedTab ? "mapped" : unmappedStatusFilter;
        // Mapped tab strictly requires selectedBrokerId. If none, don't fetch.
        if (isMappedTab && !selectedBrokerId) {
          setInvestors([]);
          setTotalPages(1);
          setIsLoadingInvestors(false);
          return;
        }

        const res = await distributorService.getMappableInvestors(
          page,
          20,
          search,
          status,
          isMappedTab ? selectedBrokerId! : undefined,
        );
        if (res.success) {
          setInvestors(res.data.data);
          setTotalPages(res.data.totalPages);
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoadingInvestors(false);
    }
  }, [activeTab, page, search, unmappedStatusFilter, selectedBrokerId]);

  useEffect(() => {
    // Reset selections and page when changing tabs or primary filters
    setSelectedInvestorIds(new Set());
    setPage(1);
  }, [activeTab, selectedBrokerId, search, unmappedStatusFilter]);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchInvestors();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchInvestors]);

  // Actions
  const handleAssign = async () => {
    if (!selectedBrokerId || selectedInvestorIds.size === 0) return;
    setIsActionLoading(true);
    try {
      const res = await distributorService.assignInvestors(
        Array.from(selectedInvestorIds),
        selectedBrokerId,
      );
      if (res.success) {
        setSelectedInvestorIds(new Set());
        fetchInvestors();
        setPageSuccess("Investors assigned successfully!");
        setErrorMsg(null);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Assignment failed.");
      setPageSuccess(null);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUnassign = async (investorId: string) => {
    if (!selectedBrokerId) return;
    if (
      !window.confirm(
        "Are you sure you want to remove this investor from this broker?",
      )
    )
      return;
    setIsActionLoading(true);
    try {
      const res = await distributorService.unassignInvestors(
        [investorId],
        selectedBrokerId,
      );
      if (res.success) {
        fetchInvestors();
        setPageSuccess("Investor unassigned successfully!");
        setErrorMsg(null);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Unassignment failed.");
      setPageSuccess(null);
    } finally {
      setIsActionLoading(false);
    }
  };

  const toggleInvestorSelection = (id: string) => {
    const next = new Set(selectedInvestorIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedInvestorIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedInvestorIds.size === investors.length && investors.length > 0) {
      setSelectedInvestorIds(new Set());
    } else {
      setSelectedInvestorIds(new Set(investors.map((i) => i.id)));
    }
  };

  // Rendering
  const rootBrokers = brokers.filter((b) => !b.parent_id);

  if (errorMsg) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center animate-in fade-in">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
          <Repeat2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-[var(--fin-heading-primary)] mb-2">
          Access Denied
        </h3>
        <p className="text-[var(--fin-muted-text)] mb-6 text-center max-w-md">
          {errorMsg}
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex-1 w-full h-[calc(100vh-5rem)] flex flex-col p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500 gap-4 sm:gap-6">
      {/* Header */}
      <div className="shrink-0">
        <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-[var(--fin-heading-primary)] mb-1">
          Investor <span className="text-[var(--fin-brand-600)]">Mapping</span>
        </h1>
        <p className="text-[var(--fin-muted-text)] font-medium text-xs lg:text-sm">
          {userRole === "COMPANY_ADMIN"
            ? "Allot or remove investors for any distributor and sub-broker in your company."
            : "Allot or remove investors for yourself and your sub-brokers."}
        </p>
      </div>

      <ErrorNotice message={errorMsg} onClose={() => setErrorMsg(null)} />
      <SuccessNotice message={pageSuccess} onClose={() => setPageSuccess(null)} />

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6">
        {/* Left Panel: Broker Tree */}
        <div className="w-full lg:w-1/3 xl:w-1/4 flex flex-col bg-[var(--fin-table-bg)] border border-[var(--fin-border)] rounded-md shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[var(--fin-border-subtle)] bg-[var(--fin-page-bg)]">
            <h3 className="font-bold text-[var(--fin-heading-secondary)] flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--fin-brand-600)]" />
              Target Broker
            </h3>
            <p className="text-[10px] text-[var(--fin-aux-text)] mt-1">
              Select a broker to view or manage their mapped investors.
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
            {isLoadingBrokers ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 text-[var(--fin-brand-600)] animate-spin" />
              </div>
            ) : brokers.length === 0 ? (
              <div className="text-center p-8">
                <p className="text-sm text-[var(--fin-muted-text)]">
                  You have no sub-brokers under you. You can still allot
                  unmapped investors to yourself.
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                {rootBrokers.map((b) => (
                  <BrokerTreeNode
                    key={b.id}
                    broker={b}
                    allBrokers={brokers}
                    selectedId={selectedBrokerId}
                    onSelect={setSelectedBrokerId}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Investors & History */}
        <div className="flex-1 flex flex-col bg-[var(--fin-table-bg)] border border-[var(--fin-border)] rounded-md shadow-sm overflow-hidden">
          <div className="flex border-b border-[var(--fin-border-subtle)] bg-[var(--fin-page-bg)] shrink-0 px-2 pt-2 gap-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab("unmapped")}
              className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "unmapped"
                  ? "border-[var(--fin-brand-600)] text-[var(--fin-brand-700)]"
                  : "border-transparent text-[var(--fin-muted-text)] hover:text-[var(--fin-body-text)]"
              }`}
            >
              Reassignable Investors
            </button>
            <button
              onClick={() => setActiveTab("mapped")}
              className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "mapped"
                  ? "border-[var(--fin-brand-600)] text-[var(--fin-brand-700)]"
                  : "border-transparent text-[var(--fin-muted-text)] hover:text-[var(--fin-body-text)]"
              }`}
            >
              Currently Mapped
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "history"
                  ? "border-[var(--fin-brand-600)] text-[var(--fin-brand-700)]"
                  : "border-transparent text-[var(--fin-muted-text)] hover:text-[var(--fin-body-text)]"
              }`}
            >
              Mapping History
            </button>
          </div>

          <div className="p-4 border-b border-[var(--fin-border-subtle)] flex flex-col sm:flex-row gap-3 items-center justify-between shrink-0 bg-[var(--fin-table-bg)]">
            <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
              {activeTab !== "history" && (
                <div className="relative max-w-xs w-full">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fin-aux-text)]" />
                  <input
                    type="text"
                    placeholder="Search name or PAN..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-sm border border-[var(--fin-border)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--fin-brand-500)]"
                  />
                </div>
              )}
              {activeTab === "unmapped" && (
                <select
                  value={unmappedStatusFilter}
                  onChange={(e) =>
                    setUnmappedStatusFilter(e.target.value as any)
                  }
                  className="text-sm py-1.5 px-3 border border-[var(--fin-border)] rounded-md outline-none focus:ring-1 focus:ring-[var(--fin-brand-500)] bg-transparent"
                >
                  <option value="all">All Available</option>
                  <option value="unmapped">Unmapped</option>
                  <option value="mapped">Mapped (Other)</option>
                </select>
              )}
            </div>

            {activeTab === "unmapped" && (
              <button
                onClick={handleAssign}
                disabled={
                  !selectedBrokerId ||
                  selectedInvestorIds.size === 0 ||
                  isActionLoading
                }
                className="w-full sm:w-auto px-4 py-1.5 bg-[var(--fin-brand-700)] text-white text-sm font-bold rounded-md disabled:opacity-50 hover:bg-[var(--fin-brand-800)] flex items-center justify-center gap-2 transition-colors"
              >
                {isActionLoading && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Allot to Selected Broker
              </button>
            )}
          </div>

          <div className="flex-1 overflow-auto bg-[var(--fin-table-bg)] relative">
            {isLoadingInvestors && (
              <div className="absolute inset-0 bg-[var(--fin-table-bg)]/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[var(--fin-brand-600)] animate-spin" />
              </div>
            )}

            {activeTab === "history" ? (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[var(--fin-page-bg)]/90 sticky top-0 border-b border-[var(--fin-border)] text-[10px] uppercase text-[var(--fin-muted-text)] font-black z-20">
                  <tr>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Investor</th>
                    <th className="py-3 px-4">Broker</th>
                    <th className="py-3 px-4">Performed By</th>
                    <th className="py-3 px-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--fin-border-subtle)]">
                  {history.map((h) => (
                    <tr key={h.id} className="hover:bg-[var(--fin-page-bg)]/50">
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${h.action === "ASSIGNED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                        >
                          {h.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-[var(--fin-heading-secondary)]">
                        {toTitleCase(h.investor_name)}{" "}
                        <span className="text-[var(--fin-aux-text)] text-[10px] ml-1 font-mono">
                          ({h.investor_pan})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[var(--fin-body-text)]">
                        {toTitleCase(h.sub_broker_name)}
                      </td>
                      <td className="py-3 px-4 text-[var(--fin-body-text)]">
                        {toTitleCase(h.performed_by_name)}
                      </td>
                      <td className="py-3 px-4 text-right text-[var(--fin-muted-text)]">
                        {new Date(h.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {history.length === 0 && !isLoadingInvestors && (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center text-[var(--fin-muted-text)] text-sm"
                      >
                        No history found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[var(--fin-page-bg)]/90 sticky top-0 border-b border-[var(--fin-border)] text-[10px] uppercase text-[var(--fin-muted-text)] font-black z-20">
                  <tr>
                    {activeTab === "unmapped" && (
                      <th className="py-3 pl-4 pr-2 w-8">
                        <button
                          onClick={toggleSelectAll}
                          className="text-[var(--fin-aux-text)] hover:text-[var(--fin-brand-600)]"
                        >
                          {selectedInvestorIds.size > 0 &&
                          selectedInvestorIds.size === investors.length ? (
                            <CheckSquare className="w-4 h-4 text-[var(--fin-brand-600)]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                    )}
                    <th
                      className={`py-3 ${activeTab === "unmapped" ? "px-2" : "pl-4 px-2"}`}
                    >
                      Investor
                    </th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Current Mapping</th>
                    {activeTab === "mapped" && (
                      <th className="py-3 px-4 text-right">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--fin-border-subtle)]">
                  {activeTab === "mapped" && !selectedBrokerId ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-12 text-center text-[var(--fin-muted-text)] text-sm"
                      >
                        Select a broker from the left panel to view their mapped
                        investors.
                      </td>
                    </tr>
                  ) : investors.length === 0 && !isLoadingInvestors ? (
                    <tr>
                      <td
                        colSpan={activeTab === "mapped" ? 4 : 4}
                        className="py-12 text-center text-[var(--fin-muted-text)] text-sm"
                      >
                        No investors found.
                      </td>
                    </tr>
                  ) : (
                    investors.map((inv) => (
                      <tr
                        key={inv.id}
                        className="hover:bg-[var(--fin-page-bg)]/50 transition-colors"
                      >
                        {activeTab === "unmapped" && (
                          <td className="py-3 pl-4 pr-2">
                            <button
                              onClick={() => toggleInvestorSelection(inv.id)}
                              className="text-[var(--fin-aux-text)] hover:text-[var(--fin-brand-600)]"
                            >
                              {selectedInvestorIds.has(inv.id) ? (
                                <CheckSquare className="w-4 h-4 text-[var(--fin-brand-600)]" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        )}
                        <td
                          className={`py-3 ${activeTab === "unmapped" ? "px-2" : "pl-4 px-2"}`}
                        >
                          <div className="flex flex-col">
                            <span className="font-bold text-[var(--fin-heading-secondary)]">
                              {toTitleCase(inv.name)}
                            </span>
                            <span className="text-[10px] font-mono text-[var(--fin-aux-text)]">
                              {inv.pan}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col text-[11px] text-[var(--fin-muted-text)] gap-0.5">
                            {inv.email && <span>{inv.email}</span>}
                            {inv.mobile && <span>{inv.mobile}</span>}
                            {!inv.email && !inv.mobile && <span>-</span>}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {inv.current_sub_broker_name ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--fin-brand-50)] text-[var(--fin-brand-700)] border border-[var(--fin-brand-100)]">
                              {toTitleCase(inv.current_sub_broker_name)}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-[var(--fin-aux-text)] uppercase tracking-widest bg-[var(--fin-skeleton-base)] px-2 py-0.5 rounded">
                              Unmapped
                            </span>
                          )}
                        </td>
                        {activeTab === "mapped" && (
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleUnassign(inv.id)}
                              disabled={isActionLoading}
                              className="text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                            >
                              Remove
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Simple Pagination */}
          <div className="p-3 border-t border-[var(--fin-border-subtle)] bg-[var(--fin-page-bg)] flex justify-between items-center shrink-0">
            <span className="text-xs font-bold text-[var(--fin-muted-text)]">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs font-bold border border-[var(--fin-border)] rounded hover:bg-[var(--fin-skeleton-base)] disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-xs font-bold border border-[var(--fin-border)] rounded hover:bg-[var(--fin-skeleton-base)] disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
