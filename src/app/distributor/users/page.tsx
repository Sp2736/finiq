"use client";

import React, { useState, useEffect } from "react";
import {
  distributorService,
  CompanyUser,
  CompanyUserPayload,
} from "@/services/distributor.service";
import {
  Loader2,
  Plus,
  Edit2,
  Shield,
  User,
  X,
  Briefcase,
  Percent,
  Hash,
  ChevronRight,
  ChevronDown,
  Mail,
} from "lucide-react";
import { toTitleCase } from "@/lib/utils";

// ─── UTILITIES ───
const extractRole = (user: any): string => {
  // 1. Primary Check: If they have a parent, they are a Sub-Broker
  if (user.parent_id || user.parent_name) {
    return "SUB_BROKER";
  }

  // 2. Secondary Check: If they have no parent and possess an ARN, they are a Distributor
  if (user.arn_id && String(user.arn_id).trim() !== "") {
    return "DISTRIBUTOR";
  }

  // 3. Fallback: Anyone without a parent sits at the root hierarchy
  return "DISTRIBUTOR";
};

const getRoleBadgeStyle = (role: string) => {
  switch (role) {
    case "FINIQ_ADMIN":
    case "TENANT_ADMIN":
      return "bg-[var(--fin-badge-admin-bg)] text-[var(--fin-badge-admin-text)] border border-[var(--fin-badge-admin-border)]";
    case "DISTRIBUTOR":
    case "COMPANY_ADMIN":
      return "bg-[var(--fin-brand-50)] text-[var(--fin-brand-700)] border border-[var(--fin-brand-100)]";
    case "SUB_BROKER":
    case "COMPANY_USER":
      return "bg-[var(--fin-badge-broker-bg)] text-[var(--fin-badge-broker-text)] border border-[var(--fin-badge-broker-border)]";
    default:
      return "bg-[var(--fin-page-bg)] text-[var(--fin-body-text)] border border-[var(--fin-border)]";
  }
};

const getInitials = (name?: string) => {
  if (!name) return "?";
  return name.charAt(0).toUpperCase();
};

// ─── DESKTOP RECURSIVE HIERARCHY ROW COMPONENT (Strictly Retained) ───
const DesktopUserRow = ({
  user,
  allUsers,
  onEdit,
  depth = 0,
}: {
  user: CompanyUser;
  allUsers: CompanyUser[];
  onEdit: (user: CompanyUser) => void;
  depth?: number;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Find immediate children
  const children = allUsers.filter((u) => u.parent_id === user.id);
  const hasChildren = children.length > 0;
  const actualRole = extractRole(user);

  // Math for seamless tree-lines
  const isRoot = depth === 0;
  const threadLeft = isRoot ? "left-[35px]" : "left-[27px]";
  const contentMargin = isRoot ? "ml-[56px]" : "ml-[48px]";

  return (
    <React.Fragment>
      <tr
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
        className={`group transition-colors duration-300 border-b border-[var(--fin-border-subtle)] ${hasChildren ? "cursor-pointer" : ""} ${isExpanded ? "bg-[var(--fin-page-bg)]" : "hover:bg-[var(--fin-page-bg)]/60"}`}
      >
        <td className={`p-4 ${isRoot ? "pl-6" : "pl-4"}`}>
          <div className="flex items-center gap-3">
            {/* Expand Chevron */}
            <div className="w-6 h-6 shrink-0 flex items-center justify-center">
              {hasChildren && (
                <button
                  className={`p-1 rounded-full transition-all duration-300 ${isExpanded ? "bg-[var(--fin-brand-100)] text-[var(--fin-brand-700)] rotate-90 shadow-sm" : "text-[var(--fin-aux-text)] group-hover:bg-[var(--fin-skeleton-base)] group-hover:text-[var(--fin-table-row-text)]"}`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Avatar & Name */}
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 transition-colors shadow-sm ${isExpanded ? "bg-[var(--fin-brand-600)] text-[var(--fin-btn-primary-text)]" : "bg-[var(--fin-table-bg)] border border-[var(--fin-border)] text-[var(--fin-body-text)] group-hover:border-[var(--fin-brand-300)] group-hover:text-[var(--fin-brand-700)]"}`}
              >
                {getInitials(user.name)}
              </div>
              <div className="flex flex-col">
                <span
                  className={`font-bold transition-colors tracking-tight ${isExpanded ? "text-[var(--fin-brand-900)]" : "text-[var(--fin-heading-tertiary)] group-hover:text-[var(--fin-brand-700)]"}`}
                >
                  {toTitleCase(user.name || "Unknown User")}
                </span>
                {!isRoot && (
                  <span className="text-[9px] font-bold text-[var(--fin-aux-text)] uppercase tracking-widest mt-[1px]">
                    ID: {user.id.substring(0, 6)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </td>
        <td className="p-4">
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${getRoleBadgeStyle(actualRole)}`}
          >
            <Shield className="w-3 h-3" />
            {actualRole.replace("_", " ")}
          </span>
        </td>
        <td className="p-4 font-mono text-[11px] font-bold text-[var(--fin-muted-text)]">
          {user.arn_id || <span className="text-[var(--fin-aux-text)]">N/A</span>}
        </td>
        <td className="p-4 text-right font-black text-[var(--fin-table-row-text)] tabular-nums">
          {user.share_percentage !== null &&
          user.share_percentage !== undefined ? (
            <span className="bg-[var(--fin-skeleton-base)] border border-[var(--fin-border)] text-[var(--fin-table-row-text)] px-2 py-1 rounded-md text-xs">
              {user.share_percentage}%
            </span>
          ) : (
            <span className="text-[var(--fin-aux-text)]">-</span>
          )}
        </td>
        <td className="p-4 pr-6 text-right">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(user);
            }}
            className="group/edit inline-flex items-center overflow-hidden rounded-full bg-[var(--fin-table-bg)] border border-[var(--fin-border)] text-[var(--fin-aux-text)] hover:text-[var(--fin-brand-700)] hover:border-[var(--fin-brand-300)] hover:bg-[var(--fin-brand-50)] transition-all duration-300 ease-in-out h-8 w-8 hover:w-[88px] shadow-sm hover:shadow"
          >
            <div className="w-8 h-8 shrink-0 flex items-center justify-center">
              <Edit2 className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover/edit:opacity-100 transition-opacity duration-300 delay-75 -ml-1">
              Manage
            </span>
          </button>
        </td>
      </tr>

      {/* ─── ELEGANT THREADED DETAILS PANEL (SMOOTH ANIMATION) ─── */}
      {hasChildren && (
        <tr className="bg-[var(--fin-page-bg)]/40">
          <td
            colSpan={5}
            className={`p-0 ${isExpanded ? "border-b border-[var(--fin-border-subtle)]" : ""}`}
          >
            <div
              className={`grid transition-all duration-300 ease-in-out ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
            >
              <div className="overflow-hidden">
                <div className="relative py-3 pr-4 sm:pr-6">
                  {/* Vertical Thread Line */}
                  <div
                    className={`absolute top-0 bottom-5 w-[2px] bg-[var(--fin-skeleton-base)] rounded-b-full ${threadLeft}`}
                  />

                  {/* Horizontal Corner Thread */}
                  <div
                    className={`absolute h-[2px] bg-[var(--fin-skeleton-base)] rounded-r-full top-[23px] w-5 ${threadLeft}`}
                  />

                  <div
                    className={`relative flex flex-col gap-2.5 ${contentMargin}`}
                  >
                    {/* Subtle Inline Label */}
                    <div className="inline-block">
                      <span className="bg-[var(--fin-table-bg)] border border-[var(--fin-border)] text-[var(--fin-muted-text)] text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1.5 w-fit">
                        <Briefcase className="w-3 h-3 text-[var(--fin-brand-500)]" />
                        Sub-Brokers ({children.length})
                      </span>
                    </div>

                    {/* Nested Table Card (Ultra-minimal) */}
                    <div className="bg-[var(--fin-table-bg)] border border-[var(--fin-border)] rounded-md shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] overflow-hidden">
                      <div className="overflow-x-auto table-scrollbar">
                        <table className="w-full text-left text-sm border-collapse min-w-[700px]">
                          <thead className="bg-[var(--fin-page-bg)]/80 border-b border-[var(--fin-border-subtle)]">
                            <tr>
                              <th className="py-2.5 pl-4 text-[9px] font-black text-[var(--fin-aux-text)] uppercase tracking-widest w-[35%]">
                                Name
                              </th>
                              <th className="py-2.5 px-4 text-[9px] font-black text-[var(--fin-aux-text)] uppercase tracking-widest w-[25%]">
                                Role
                              </th>
                              <th className="py-2.5 px-4 text-[9px] font-black text-[var(--fin-aux-text)] uppercase tracking-widest w-[15%]">
                                ARN
                              </th>
                              <th className="py-2.5 px-4 text-right text-[9px] font-black text-[var(--fin-aux-text)] uppercase tracking-widest w-[15%]">
                                Share %
                              </th>
                              <th className="py-2.5 pr-6 text-right text-[9px] font-black text-[var(--fin-aux-text)] uppercase tracking-widest w-[10%]">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--fin-table-row-border)]">
                            {children.map((child) => (
                              <DesktopUserRow
                                key={child.id}
                                user={child}
                                allUsers={allUsers}
                                onEdit={onEdit}
                                depth={depth + 1}
                              />
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
};

// ─── MOBILE / TABLET RECURSIVE CARD COMPONENT ───
const MobileUserCard = ({
  user,
  allUsers,
  onEdit,
  depth = 0,
}: {
  user: CompanyUser;
  allUsers: CompanyUser[];
  onEdit: (user: CompanyUser) => void;
  depth?: number;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const children = allUsers.filter((u) => u.parent_id === user.id);
  const hasChildren = children.length > 0;
  const actualRole = extractRole(user);

  return (
    <div
      className={`bg-[var(--fin-table-bg)] rounded-md shadow-sm border overflow-hidden flex flex-col transition-all ${isExpanded ? "border-[var(--fin-brand-300)] ring-1 ring-[var(--fin-brand-100)]" : "border-[var(--fin-border)]"} ${depth > 0 ? "ml-3 sm:ml-4 border-l-4 border-l-[var(--fin-brand-400)]" : ""}`}
    >
      <div className="p-3 border-b border-[var(--fin-border-subtle)] flex justify-between items-start gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-[var(--fin-brand-100)] text-[var(--fin-brand-700)] flex items-center justify-center text-xs font-bold shrink-0">
            {getInitials(user.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-[var(--fin-heading-primary)] text-sm truncate">
              {toTitleCase(user.name || "Unknown")}
            </p>
            {depth > 0 && (
              <p className="text-[9px] font-bold text-[var(--fin-aux-text)] uppercase tracking-widest mt-0.5">
                ID: {user.id.substring(0, 6)}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(user);
          }}
          className="p-2 bg-[var(--fin-page-bg)] text-[var(--fin-muted-text)] hover:text-[var(--fin-brand-600)] rounded-md shrink-0 border border-[var(--fin-border-subtle)]"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 grid grid-cols-3 gap-2 bg-[var(--fin-page-bg)]/50">
        <div>
          <p className="text-[9px] font-black uppercase tracking-wider text-[var(--fin-aux-text)] mb-1">
            Role
          </p>
          <span
            className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${getRoleBadgeStyle(actualRole)}`}
          >
            {actualRole.replace("_", " ")}
          </span>
        </div>
        <div className="text-center border-l border-[var(--fin-border-subtle)] pl-2">
          <p className="text-[9px] font-black uppercase tracking-wider text-[var(--fin-aux-text)] mb-1">
            ARN
          </p>
          <p className="text-xs font-bold text-[var(--fin-table-row-text)] font-mono truncate">
            {user.arn_id || "N/A"}
          </p>
        </div>
        <div className="text-right border-l border-[var(--fin-border-subtle)] pr-1">
          <p className="text-[9px] font-black uppercase tracking-wider text-[var(--fin-aux-text)] mb-1">
            Share
          </p>
          <p className="text-xs font-black text-[var(--fin-table-row-text)]">
            {user.share_percentage !== null &&
            user.share_percentage !== undefined
              ? `${user.share_percentage}%`
              : "-"}
          </p>
        </div>
      </div>

      {hasChildren && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-2.5 bg-[var(--fin-table-bg)] border-t border-[var(--fin-border-subtle)] text-xs font-bold text-[var(--fin-muted-text)] hover:text-[var(--fin-brand-600)] flex justify-center items-center gap-1 transition-colors"
        >
          {isExpanded
            ? "Hide Sub-Brokers"
            : `View Sub-Brokers (${children.length})`}
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
        </button>
      )}

      <div
        className={`grid transition-all duration-300 ease-in-out ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <div className="bg-[var(--fin-page-bg)] border-t border-[var(--fin-border-subtle)] p-2 sm:p-3 flex flex-col gap-3">
            {children.map((child) => (
              <MobileUserCard
                key={child.id}
                user={child}
                allUsers={allUsers}
                onEdit={onEdit}
                depth={depth + 1}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN PAGE ───
export default function UsersPage() {
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState<CompanyUserPayload>({
    role: "DISTRIBUTOR",
    name: "",
    email: "",
    arn_id: "",
    parent_id: "",
    share_percentage: null,
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await distributorService.getCompanyUsers();
      if (res.success && res.data && res.data.sub_brokers) {
        setUsers(res.data.sub_brokers);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const validParentIds = new Set(users.map((u) => u.id));
  const rootUsers = users.filter(
    (u) => !u.parent_id || !validParentIds.has(u.parent_id),
  );

  const handleOpenModal = (user?: CompanyUser) => {
    if (user) {
      setEditingUserId(user.id);
      setFormData({
        role: extractRole(user),
        name: user.name || "",
        email: user.email || "",
        arn_id: user.arn_id || "",
        parent_id: user.parent_id || "",
        share_percentage: user.share_percentage || null,
      });
    } else {
      setEditingUserId(null);
      setFormData({
        role: "DISTRIBUTOR", // Base role when Parent ID is empty
        name: "",
        email: "",
        arn_id: "",
        parent_id: "",
        share_percentage: null,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUserId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload: CompanyUserPayload = {
        role: formData.parent_id ? "SUB_BROKER" : "DISTRIBUTOR",
        name: formData.name,
        email: formData.email,
        arn_id: formData.arn_id,
        parent_id: formData.parent_id === "" ? null : formData.parent_id,
        share_percentage:
          formData.share_percentage === 0 ? null : formData.share_percentage,
      };

      if (editingUserId) {
        await distributorService.updateCompanyUser(editingUserId, payload);
      } else {
        await distributorService.createCompanyUser(payload);
      }
      await fetchUsers();
      handleCloseModal();
    } catch (error: any) {
      console.error("Failed to save user:", error);
      alert(error.message || "Failed to save user. Please check the inputs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex-1 w-full h-[calc(100vh-5rem)] flex flex-col p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500 gap-4 sm:gap-6">
      {/* Header & Controls */}
      <div className="shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-[var(--fin-heading-primary)] mb-1">
            User <span className="text-[var(--fin-brand-600)]">Management</span>
          </h1>
          <p className="text-[var(--fin-muted-text)] font-medium text-xs lg:text-sm">
            Manage roles, hierarchy, and access for your distributor network.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="group w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--fin-brand-700)] text-[var(--fin-btn-primary-text)] rounded-md text-sm font-bold shadow-md hover:bg-[var(--fin-brand-800)] transition-all duration-300 active:scale-95"
        >
          <div className="bg-[var(--fin-table-bg)]/20 p-1 rounded-md group-hover:bg-[var(--fin-table-bg)]/30 transition-colors">
            <Plus className="w-3.5 h-3.5" />
          </div>
          Add New User
        </button>
      </div>

      {/* Main Hierarchical Data Containers */}
      <div className="flex-1 min-h-0 bg-transparent lg:bg-[var(--fin-table-bg)] lg:rounded-md lg:border border-[var(--fin-border)] lg:shadow-sm flex flex-col relative overflow-hidden">
        {isLoading ? (
          <div className="absolute inset-0 bg-[var(--fin-table-bg)]/60 backdrop-blur-[1px] z-50 flex items-center justify-center rounded-md border border-[var(--fin-border)] lg:border-none">
            <Loader2 className="w-8 h-8 text-[var(--fin-brand-600)] animate-spin" />
          </div>
        ) : rootUsers.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[var(--fin-table-bg)] rounded-md border border-[var(--fin-border)] lg:border-none shadow-sm lg:shadow-none">
            <div className="w-16 h-16 bg-[var(--fin-page-bg)] border border-[var(--fin-border-subtle)] rounded-full flex items-center justify-center mb-4 shadow-sm">
              <User className="w-8 h-8 text-[var(--fin-aux-text)]" />
            </div>
            <h3 className="text-lg font-bold text-[var(--fin-table-row-text)]">No Users Found</h3>
            <p className="text-sm text-[var(--fin-muted-text)] mt-1">
              Get started by adding your first independent broker.
            </p>
          </div>
        ) : (
          <>
            {/* ─── DESKTOP VIEW (Strict Table) ─── */}
            <div className="hidden lg:flex flex-col flex-1 overflow-auto table-scrollbar">
              <table className="w-full text-left text-sm min-w-[800px] border-collapse">
                <thead className="bg-[var(--fin-page-bg)]/90 backdrop-blur-sm border-b border-[var(--fin-border)] text-[10px] uppercase tracking-widest text-[var(--fin-muted-text)] font-black sticky top-0 z-20 shadow-sm">
                  <tr>
                    <th className="py-3.5 pl-6 border-b border-[var(--fin-border)] w-[35%]">
                      Name
                    </th>
                    <th className="py-3.5 px-4 border-b border-[var(--fin-border)] w-[20%]">
                      Role
                    </th>
                    <th className="py-3.5 px-4 border-b border-[var(--fin-border)] w-[20%]">
                      ARN
                    </th>
                    <th className="py-3.5 px-4 border-b border-[var(--fin-border)] text-right w-[15%]">
                      Share %
                    </th>
                    <th className="py-3.5 pr-6 border-b border-[var(--fin-border)] text-right w-[10%]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--fin-table-row-border)]">
                  {rootUsers.map((user) => (
                    <DesktopUserRow
                      key={user.id}
                      user={user}
                      allUsers={users}
                      onEdit={handleOpenModal}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* ─── MOBILE & TABLET VIEW (Responsive Grid Cards) ─── */}
            <div className="lg:hidden flex flex-col flex-1 overflow-auto scrollbar-thin">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 auto-rows-max p-0.5">
                {rootUsers.map((user) => (
                  <MobileUserCard
                    key={user.id}
                    user={user}
                    allUsers={users}
                    onEdit={handleOpenModal}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Slide-out Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-[var(--fin-table-bg)]/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-hidden">
          <div className="absolute inset-0" onClick={handleCloseModal} />
          <div className="bg-[var(--fin-table-bg)] rounded-md shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200 border border-[var(--fin-border)] relative z-10">
            <div className="px-5 sm:px-6 py-4 border-b border-[var(--fin-border-subtle)] flex items-center justify-between bg-[var(--fin-page-bg)] shrink-0">
              <h2 className="text-lg font-black text-[var(--fin-heading-tertiary)] flex items-center gap-2">
                {editingUserId ? (
                  <>
                    <Edit2 className="w-4 h-4 text-[var(--fin-brand-600)]" /> Edit User
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4 text-[var(--fin-brand-600)]" /> Add New
                    User
                  </>
                )}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-[var(--fin-aux-text)] hover:text-[var(--fin-body-text)] hover:bg-[var(--fin-skeleton-base)]/50 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-5 sm:p-6 flex flex-col gap-4 sm:gap-5 overflow-y-auto scrollbar-thin"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-black text-[var(--fin-muted-text)] uppercase tracking-widest mb-2">
                    Full Name
                  </label>
                  <div className="relative group">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fin-aux-text)] group-focus-within:text-[var(--fin-brand-600)] transition-colors" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g. Aman Gupta"
                      className="w-full pl-9 pr-4 py-2.5 border border-[var(--fin-border)] rounded-md text-sm font-medium focus:outline-none focus:border-[var(--fin-brand-500)] focus:ring-1 focus:ring-[var(--fin-brand-500)] shadow-sm hover:border-[var(--fin-border)] transition-all"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[11px] font-black text-[var(--fin-muted-text)] uppercase tracking-widest mb-2">
                    Email Address
                  </label>
                  <div className="relative group">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fin-aux-text)] group-focus-within:text-[var(--fin-brand-600)] transition-colors" />
                    <input
                      type="email"
                      required
                      value={formData.email || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="aman@company.com"
                      className="w-full pl-9 pr-4 py-2.5 border border-[var(--fin-border)] rounded-md text-sm font-medium focus:outline-none focus:border-[var(--fin-brand-500)] focus:ring-1 focus:ring-[var(--fin-brand-500)] shadow-sm hover:border-[var(--fin-border)] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Auto-Assigned Role Selection */}
              <div>
                <label className="block text-[11px] font-black text-[var(--fin-muted-text)] uppercase tracking-widest mb-2 flex justify-between items-center">
                  <span>Assigned Role</span>
                  <span className="text-[9px] bg-[var(--fin-brand-50)] text-[var(--fin-brand-600)] px-1.5 py-0.5 rounded tracking-wide">
                    Auto-assigned
                  </span>
                </label>
                <div className="relative group">
                  <Shield className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fin-aux-text)] transition-colors" />
                  <select
                    value={formData.parent_id ? "SUB_BROKER" : "DISTRIBUTOR"}
                    disabled
                    className="w-full pl-9 pr-4 py-2.5 bg-[var(--fin-page-bg)] border border-[var(--fin-border)] rounded-md text-sm font-bold text-[var(--fin-muted-text)] appearance-none shadow-sm cursor-not-allowed opacity-90 transition-all"
                  >
                    <option value="DISTRIBUTOR">Distributor (Root)</option>
                    <option value="SUB_BROKER">Sub Broker</option>
                  </select>
                </div>
                <p className="text-[10px] text-[var(--fin-aux-text)] mt-1.5 ml-1">
                  Roles are assigned automatically based on hierarchy.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* ARN */}
                <div>
                  <label className="block text-[11px] font-black text-[var(--fin-muted-text)] uppercase tracking-widest mb-2">
                    ARN Number
                  </label>
                  <div className="relative group">
                    <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fin-aux-text)] group-focus-within:text-[var(--fin-brand-600)] transition-colors" />
                    <input
                      type="text"
                      value={formData.arn_id}
                      onChange={(e) =>
                        setFormData({ ...formData, arn_id: e.target.value })
                      }
                      placeholder="ARN-XXXX"
                      className="w-full pl-9 pr-4 py-2.5 border border-[var(--fin-border)] rounded-md text-sm font-mono focus:outline-none focus:border-[var(--fin-brand-500)] focus:ring-1 focus:ring-[var(--fin-brand-500)] shadow-sm hover:border-[var(--fin-border)] transition-all"
                    />
                  </div>
                </div>

                {/* Share Percentage */}
                <div>
                  <label className="block text-[11px] font-black text-[var(--fin-muted-text)] uppercase tracking-widest mb-2">
                    Revenue Share %
                  </label>
                  <div className="relative group">
                    <Percent className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fin-aux-text)] group-focus-within:text-[var(--fin-brand-600)] transition-colors" />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={
                        formData.share_percentage === null
                          ? ""
                          : formData.share_percentage
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          share_percentage:
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                        })
                      }
                      placeholder="0"
                      className="w-full pl-9 pr-4 py-2.5 border border-[var(--fin-border)] rounded-md text-sm font-black tabular-nums focus:outline-none focus:border-[var(--fin-brand-500)] focus:ring-1 focus:ring-[var(--fin-brand-500)] shadow-sm hover:border-[var(--fin-border)] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Parent ID */}
              <div>
                <label className="block text-[11px] font-black text-[var(--fin-muted-text)] uppercase tracking-widest mb-2">
                  Reports To (Parent ID)
                </label>
                <div className="relative group">
                  <Briefcase className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fin-aux-text)] group-focus-within:text-[var(--fin-brand-600)] transition-colors" />
                  <select
                    value={formData.parent_id || ""}
                    onChange={(e) => {
                      const newParentId = e.target.value;
                      setFormData({ 
                        ...formData, 
                        parent_id: newParentId,
                        role: newParentId ? "SUB_BROKER" : "DISTRIBUTOR" 
                      });
                    }}
                    className="w-full pl-9 pr-4 py-2.5 bg-[var(--fin-table-bg)] border border-[var(--fin-border)] rounded-md text-sm font-medium focus:outline-none focus:border-[var(--fin-brand-500)] focus:ring-1 focus:ring-[var(--fin-brand-500)] appearance-none shadow-sm hover:border-[var(--fin-border)] transition-all cursor-pointer"
                  >
                    <option value="">Independent (No Parent)</option>
                    {users
                      .filter((u) => u.id !== editingUserId)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {toTitleCase(u.name || "Unknown")} (ID:{" "}
                          {u.id.substring(0, 8)}...)
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="mt-2 sm:mt-4 pt-4 border-t border-[var(--fin-border-subtle)] flex flex-col sm:flex-row justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-full sm:w-auto px-5 py-2.5 text-sm font-bold text-[var(--fin-muted-text)] hover:text-[var(--fin-heading-tertiary)] hover:bg-[var(--fin-page-bg)] rounded-md transition-all border border-[var(--fin-border)] sm:border-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-[var(--fin-brand-700)] text-[var(--fin-btn-primary-text)] rounded-md text-sm font-bold shadow-md hover:bg-[var(--fin-brand-800)] transition-all duration-300 disabled:opacity-70 active:scale-95"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : null}
                  {editingUserId ? "Save Changes" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}