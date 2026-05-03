"use client";

import React, { useState, useEffect } from 'react';
import { distributorService, CompanyUser, CompanyUserPayload } from '@/services/distributor.service';
import { Loader2, Plus, Edit2, Shield, User, X, Briefcase, Percent, Hash } from 'lucide-react';
import { toTitleCase } from '@/lib/utils';

export default function UsersPage() {
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CompanyUserPayload>({
    role: 'SUB_BROKER',
    name: '',
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

  const handleOpenModal = (user?: CompanyUser) => {
    if (user) {
      setEditingUserId(user.id);
      setFormData({
        role: user.role || 'SUB_BROKER',
        name: user.name || '',
        arn_id: user.arn_id || '',
        parent_id: user.parent_id || '',
        share_percentage: user.share_percentage || null
      });
    } else {
      setEditingUserId(null);
      setFormData({
        role: 'SUB_BROKER',
        name: '',
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
      // Ensure empty strings are sent as null to the backend for optional fields
      const payload: CompanyUserPayload = {
        ...formData,
        parent_id: formData.parent_id === '' ? null : formData.parent_id,
        share_percentage: formData.share_percentage === 0 ? null : formData.share_percentage
      };

      if (editingUserId) {
        await distributorService.updateCompanyUser(editingUserId, payload);
      } else {
        await distributorService.createCompanyUser(payload);
      }
      await fetchUsers(); // Refresh list
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
            User <span className="text-emerald-600">Management</span>
          </h1>
          <p className="text-slate-500 font-medium text-xs lg:text-sm">
            Manage roles, hierarchy, and access for your distributor network.
          </p>
        </div>
        
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-emerald-700 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add New User
        </button>
      </div>

      {/* Main Table Area */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden">
        {isLoading ? (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-700">No Users Found</h3>
            <p className="text-sm text-slate-500 mt-1">Get started by adding your first sub-broker.</p>
          </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-auto table-scrollbar">
            <table className="w-full text-left text-sm min-w-[800px] border-separate border-spacing-0">
              <thead className="bg-slate-50/90 backdrop-blur-sm border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-500 font-black sticky top-0 z-20">
                <tr>
                  <th className="p-4 pl-6 border-b border-slate-200">Name</th>
                  <th className="p-4 border-b border-slate-200">Role</th>
                  <th className="p-4 border-b border-slate-200">ARN</th>
                  <th className="p-4 border-b border-slate-200">Reports To</th>
                  <th className="p-4 border-b border-slate-200 text-right">Share %</th>
                  <th className="p-4 pr-6 border-b border-slate-200 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 pl-6 font-bold text-slate-800">
                      {toTitleCase(user.name)}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider">
                        <Shield className="w-3 h-3" />
                        {user.role ? user.role.replace('_', ' ') : 'SUB BROKER'}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-[11px] font-bold text-slate-500">
                      {user.arn_id || <span className="text-slate-300">N/A</span>}
                    </td>
                    <td className="p-4 text-xs font-bold text-slate-600">
                      {user.parent_name || <span className="text-slate-300">Independent</span>}
                    </td>
                    <td className="p-4 text-right font-black text-slate-700 tabular-nums">
                      {user.share_percentage !== null ? `${user.share_percentage}%` : <span className="text-slate-300">-</span>}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button 
                        onClick={() => handleOpenModal(user)}
                        className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-out Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-lg font-black text-slate-800">
                {editingUserId ? 'Edit User' : 'Add New User'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[80vh]">
              
              {/* Role Selection (Locked) */}
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Assign Role</label>
                <div className="relative">
                  <Shield className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none cursor-not-allowed"
                  >
                    <option value="SUB_BROKER">Sub Broker</option>
                  </select>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Aman Gupta"
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* ARN */}
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">ARN Number</label>
                  <div className="relative">
                    <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      value={formData.arn_id}
                      onChange={(e) => setFormData({...formData, arn_id: e.target.value})}
                      placeholder="ARN-XXXX"
                      className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Share Percentage */}
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Revenue Share %</label>
                  <div className="relative">
                    <Percent className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="number" 
                      min="0" max="100"
                      value={formData.share_percentage === null ? '' : formData.share_percentage}
                      onChange={(e) => setFormData({...formData, share_percentage: e.target.value === '' ? null : Number(e.target.value)})}
                      placeholder="0"
                      className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-black tabular-nums focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Parent ID */}
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Reports To (Parent ID)</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select 
                    value={formData.parent_id || ''}
                    onChange={(e) => setFormData({...formData, parent_id: e.target.value})}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none"
                  >
                    <option value="">Independent (No Parent)</option>
                    {users.filter(u => u.id !== editingUserId).map(u => (
                      <option key={u.id} value={u.id}>
                        {toTitleCase(u.name)} (ID: {u.id.substring(0, 8)}...)
                      </option>
                    ))}
                    <option value="3660908c-34d0-492e-b544-ea0c40fbb756">Default Admin / Root User</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-md hover:bg-slate-800 transition-all disabled:opacity-70"
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