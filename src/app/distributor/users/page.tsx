"use client";

import React, { useState, useEffect } from 'react';
import { distributorService, CompanyUser, CompanyUserPayload } from '@/services/distributor.service';
import { Loader2, Plus, Edit2, Shield, User, X, Briefcase, Percent, Hash, ChevronRight, Mail } from 'lucide-react';
import { toTitleCase } from '@/lib/utils';

// ─── UTILITIES ───
const extractRole = (user: any): string => {
  const foundRole = user.role || user.user_role || user.role_name || user.type || user.user_type;
  return foundRole ? String(foundRole).toUpperCase() : 'SUB_BROKER';
};

const getRoleBadgeStyle = (role: string) => {
  switch(role) {
    case 'FINIQ_ADMIN':
    case 'TENANT_ADMIN':
      return 'bg-purple-50 text-purple-700 border border-purple-100';
    case 'COMPANY_ADMIN':
      return 'bg-rose-50 text-rose-700 border border-rose-100';
    case 'COMPANY_USER':
      return 'bg-distributor-50 text-distributor-700 border border-distributor-100';
    default:
      return 'bg-slate-50 text-slate-600 border border-slate-200';
  }
};

const getInitials = (name?: string) => {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
};

// ─── RECURSIVE HIERARCHY ROW COMPONENT ───
const UserRow = ({ 
  user, 
  allUsers, 
  onEdit,
  depth = 0
}: { 
  user: CompanyUser, 
  allUsers: CompanyUser[], 
  onEdit: (user: CompanyUser) => void,
  depth?: number
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Find immediate children
  const children = allUsers.filter(u => u.parent_id === user.id);
  const hasChildren = children.length > 0;
  const actualRole = extractRole(user);

  // Math for seamless tree-lines
  const isRoot = depth === 0;
  const threadLeft = isRoot ? 'left-[35px]' : 'left-[27px]';
  const contentMargin = isRoot ? 'ml-[56px]' : 'ml-[48px]';

  return (
    <React.Fragment>
      <tr 
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
        className={`group transition-colors duration-300 border-b border-slate-100 ${hasChildren ? 'cursor-pointer' : ''} ${isExpanded ? 'bg-slate-50' : 'hover:bg-slate-50/60'}`}
      >
        <td className={`p-4 ${isRoot ? 'pl-6' : 'pl-4'}`}>
          <div className="flex items-center gap-3">
            {/* Expand Chevron */}
            <div className="w-6 h-6 shrink-0 flex items-center justify-center">
              {hasChildren && (
                <button 
                  className={`p-1 rounded-full transition-all duration-300 ${isExpanded ? 'bg-distributor-100 text-distributor-700 rotate-90 shadow-sm' : 'text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-700'}`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Avatar & Name */}
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 transition-colors shadow-sm ${isExpanded ? 'bg-distributor-600 text-white' : 'bg-white border border-slate-200 text-slate-600 group-hover:border-distributor-300 group-hover:text-distributor-700'}`}>
                {getInitials(user.name)}
              </div>
              <div className="flex flex-col">
                <span className={`font-bold transition-colors tracking-tight ${isExpanded ? 'text-distributor-900' : 'text-slate-800 group-hover:text-distributor-700'}`}>
                  {toTitleCase(user.name || "Unknown User")}
                </span>
                {!isRoot && (
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-[1px]">
                    ID: {user.id.substring(0, 6)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </td>
        <td className="p-4">
          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${getRoleBadgeStyle(actualRole)}`}>
            <Shield className="w-3 h-3" />
            {actualRole.replace('_', ' ')}
          </span>
        </td>
        <td className="p-4 font-mono text-[11px] font-bold text-slate-500">
          {user.arn_id || <span className="text-slate-300">N/A</span>}
        </td>
        <td className="p-4 text-right font-black text-slate-700 tabular-nums">
          {user.share_percentage !== null && user.share_percentage !== undefined 
            ? <span className="bg-slate-100 border border-slate-200 text-slate-700 px-2 py-1 rounded-md text-xs">{user.share_percentage}%</span> 
            : <span className="text-slate-300">-</span>}
        </td>
        <td className="p-4 pr-6 text-right">
          
          <button 
            onClick={(e) => {
              e.stopPropagation(); 
              onEdit(user);
            }}
            className="group/edit inline-flex items-center overflow-hidden rounded-full bg-white border border-slate-200 text-slate-400 hover:text-distributor-700 hover:border-distributor-300 hover:bg-distributor-50 transition-all duration-300 ease-in-out h-8 w-8 hover:w-[88px] shadow-sm hover:shadow"
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
        <tr className="bg-slate-50/40">
          <td colSpan={5} className={`p-0 ${isExpanded ? 'border-b border-slate-100' : ''}`}>
            {/* The CSS Grid "1fr to 0fr" trick makes the height perfectly animate */}
            <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
              <div className="overflow-hidden">
                <div className="relative py-3 pr-4 sm:pr-6">
                  
                  {/* Vertical Thread Line */}
                  <div className={`absolute top-0 bottom-5 w-[2px] bg-slate-200 rounded-b-full ${threadLeft}`} />
                  
                  {/* Horizontal Corner Thread */}
                  <div className={`absolute h-[2px] bg-slate-200 rounded-r-full top-[23px] w-5 ${threadLeft}`} />
                  
                  <div className={`relative flex flex-col gap-2.5 ${contentMargin}`}>
                    
                    {/* Subtle Inline Label */}
                    <div className="inline-block">
                      <span className="bg-white border border-slate-200 text-slate-500 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1.5 w-fit">
                        <Briefcase className="w-3 h-3 text-distributor-500" />
                        Sub-Brokers ({children.length})
                      </span>
                    </div>
                    
                    {/* Nested Table Card (Ultra-minimal) */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] overflow-hidden">
                      <div className="overflow-x-auto table-scrollbar">
                        <table className="w-full text-left text-sm border-collapse min-w-[700px]">
                          <thead className="bg-slate-50/80 border-b border-slate-100">
                            <tr>
                              <th className="py-2.5 pl-4 text-[9px] font-black text-slate-400 uppercase tracking-widest w-[35%]">Name</th>
                              <th className="py-2.5 px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest w-[25%]">Role</th>
                              <th className="py-2.5 px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest w-[15%]">ARN</th>
                              <th className="py-2.5 px-4 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest w-[15%]">Share %</th>
                              <th className="py-2.5 pr-6 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest w-[10%]">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {children.map(child => (
                              <UserRow 
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

// ─── MAIN PAGE ───
export default function UsersPage() {
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CompanyUserPayload>({
    role: 'COMPANY_USER',
    name: '',
    email: '', 
    arn_id: '',
    parent_id: '',
    share_percentage: null
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

  const validParentIds = new Set(users.map(u => u.id));
  const rootUsers = users.filter(u => !u.parent_id || !validParentIds.has(u.parent_id));

  const handleOpenModal = (user?: CompanyUser) => {
    if (user) {
      setEditingUserId(user.id);
      setFormData({
        role: extractRole(user),
        name: user.name || '',
        email: user.email || '',
        arn_id: user.arn_id || '',
        parent_id: user.parent_id || '',
        share_percentage: user.share_percentage || null
      });
    } else {
      setEditingUserId(null);
      setFormData({
        role: 'COMPANY_USER',
        name: '',
        email: '',
        arn_id: '',
        parent_id: '', 
        share_percentage: null
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
        role: formData.role,
        name: formData.name,
        email: formData.email,
        arn_id: formData.arn_id,
        parent_id: formData.parent_id === '' ? null : formData.parent_id,
        share_percentage: formData.share_percentage === 0 ? null : formData.share_percentage
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
    <div className="flex flex-col h-full relative z-10 animate-in fade-in duration-500 overflow-hidden">
      
      {/* Header & Controls */}
      <div className="shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 mb-1">
            User <span className="text-distributor-600">Management</span>
          </h1>
          <p className="text-slate-500 font-medium text-xs lg:text-sm">
            Manage roles, hierarchy, and access for your distributor network.
          </p>
        </div>
        
        <button 
          onClick={() => handleOpenModal()}
          className="group flex items-center gap-2 px-5 py-2.5 bg-distributor-700 text-white rounded-xl text-sm font-bold shadow-md hover:bg-distributor-800 transition-all duration-300 active:scale-95"
        >
          <div className="bg-white/20 p-1 rounded-md group-hover:bg-white/30 transition-colors">
            <Plus className="w-3.5 h-3.5" />
          </div>
          Add New User
        </button>
      </div>

      {/* Main Hierarchical Table */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden">
        {isLoading ? (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-distributor-600 animate-spin" />
          </div>
        ) : rootUsers.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
              <User className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-700">No Users Found</h3>
            <p className="text-sm text-slate-500 mt-1">Get started by adding your first independent broker.</p>
          </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-auto table-scrollbar">
            <table className="w-full text-left text-sm min-w-[800px] border-collapse">
              <thead className="bg-slate-50/90 backdrop-blur-sm border-b border-slate-200 text-[10px] uppercase tracking-widest text-slate-500 font-black sticky top-0 z-20 shadow-sm">
                <tr>
                  <th className="py-3.5 pl-6 border-b border-slate-200 w-[35%]">Name</th>
                  <th className="py-3.5 px-4 border-b border-slate-200 w-[20%]">Role</th>
                  <th className="py-3.5 px-4 border-b border-slate-200 w-[20%]">ARN</th>
                  <th className="py-3.5 px-4 border-b border-slate-200 text-right w-[15%]">Share %</th>
                  <th className="py-3.5 pr-6 border-b border-slate-200 text-right w-[10%]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rootUsers.map((user) => (
                  <UserRow 
                    key={user.id} 
                    user={user} 
                    allUsers={users} 
                    onEdit={handleOpenModal} 
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-out Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
            
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                {editingUserId ? (
                  <><Edit2 className="w-4 h-4 text-distributor-600" /> Edit User</>
                ) : (
                  <><User className="w-4 h-4 text-distributor-600" /> Add New User</>
                )}
              </h2>
              <button onClick={handleCloseModal} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[80vh] custom-scrollbar">
              
              <div className="grid grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Full Name</label>
                  <div className="relative group">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-distributor-600 transition-colors" />
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Aman Gupta"
                      className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-distributor-500 focus:ring-1 focus:ring-distributor-500 shadow-sm hover:border-slate-300 transition-all"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
                  <div className="relative group">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-distributor-600 transition-colors" />
                    <input 
                      type="email" 
                      required
                      value={formData.email || ''}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="aman@company.com"
                      className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-distributor-500 focus:ring-1 focus:ring-distributor-500 shadow-sm hover:border-slate-300 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Assign Role</label>
                <div className="relative group">
                  <Shield className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-distributor-600 transition-colors" />
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-distributor-500 focus:ring-1 focus:ring-distributor-500 appearance-none shadow-sm hover:border-slate-300 transition-all"
                  >
                    <option value="SUB_BROKER">Sub Broker</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* ARN */}
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">ARN Number</label>
                  <div className="relative group">
                    <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-distributor-600 transition-colors" />
                    <input 
                      type="text" 
                      value={formData.arn_id}
                      onChange={(e) => setFormData({...formData, arn_id: e.target.value})}
                      placeholder="ARN-XXXX"
                      className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:border-distributor-500 focus:ring-1 focus:ring-distributor-500 shadow-sm hover:border-slate-300 transition-all"
                    />
                  </div>
                </div>

                {/* Share Percentage */}
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Revenue Share %</label>
                  <div className="relative group">
                    <Percent className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-distributor-600 transition-colors" />
                    <input 
                      type="number" 
                      min="0" max="100"
                      value={formData.share_percentage === null ? '' : formData.share_percentage}
                      onChange={(e) => setFormData({...formData, share_percentage: e.target.value === '' ? null : Number(e.target.value)})}
                      placeholder="0"
                      className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-black tabular-nums focus:outline-none focus:border-distributor-500 focus:ring-1 focus:ring-distributor-500 shadow-sm hover:border-slate-300 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Parent ID */}
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Reports To (Parent ID)</label>
                <div className="relative group">
                  <Briefcase className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-distributor-600 transition-colors" />
                  <select 
                    value={formData.parent_id || ''}
                    onChange={(e) => setFormData({...formData, parent_id: e.target.value})}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-distributor-500 focus:ring-1 focus:ring-distributor-500 appearance-none shadow-sm hover:border-slate-300 transition-all"
                  >
                    <option value="">Independent (No Parent)</option>
                    {users.filter(u => u.id !== editingUserId).map(u => (
                      <option key={u.id} value={u.id}>
                        {toTitleCase(u.name || "Unknown")} (ID: {u.id.substring(0, 8)}...)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-distributor-700 text-white rounded-xl text-sm font-bold shadow-md hover:bg-distributor-800 transition-all duration-300 disabled:opacity-70 active:scale-95"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editingUserId ? 'Save Changes' : 'Create User'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}