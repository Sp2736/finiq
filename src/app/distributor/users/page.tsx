// "use client";

// import React, { useState } from 'react';
// import { Search, UserPlus, Shield, MoreVertical, Mail, ChevronRight, ChevronDown } from 'lucide-react';
// import Badge from '@/components/investor/Badge';

// const TEAM_MEMBERS = [
//   { id: 1, name: 'Rahul Verma', email: 'rahul.v@finiq.com', role: 'Relationship Manager', status: 'Active', clients: 45 },
//   { id: 2, name: 'Pooja Singh', email: 'pooja.s@finiq.com', role: 'Sub-Broker', status: 'Active', clients: 112 },
//   { id: 3, name: 'Anil Desai', email: 'anil.d@finiq.com', role: 'Admin', status: 'Inactive', clients: 0 },
//   { id: 4, name: 'Kavita Iyer', email: 'kavita.i@finiq.com', role: 'Relationship Manager', status: 'Active', clients: 28 },
// ];

// const MobileUserCard = ({ member }: { member: any }) => {
//   const [isExpanded, setIsExpanded] = useState(false);

//   return (
//     <div 
//       onClick={() => setIsExpanded(!isExpanded)}
//       className={`bg-white p-4 rounded-md border cursor-pointer ${isExpanded ? 'border-emerald-200 shadow-md ring-1 ring-emerald-50' : 'border-slate-200 shadow-sm'} relative overflow-hidden transition-all group`}
//     >
//       <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${member.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
      
//       <div className="flex justify-between items-start pl-2">
//         <div className="flex items-start gap-3">
//           <button className={`mt-0.5 text-slate-400 p-1 rounded-md transition-colors ${isExpanded ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50'}`}>
//             {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
//           </button>
//           <div>
//             <h3 className="text-slate-900 font-bold text-sm leading-tight pr-2">{member.name}</h3>
//             <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 block">{member.role}</span>
//           </div>
//         </div>
        
//         <div className="shrink-0">
//            <Badge intent={member.status === 'Active' ? 'success' : 'neutral'}>{member.status}</Badge>
//         </div>
//       </div>

//       <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
//         <div className="overflow-hidden">
//           <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-md ml-2">
//             <div className="col-span-2">
//               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Mail className="w-3 h-3" /> Email Address</p>
//               <p className="text-sm font-black text-slate-700 truncate">{member.email}</p>
//             </div>
//             <div className="pt-2 border-t border-slate-200 col-span-2 flex justify-between items-end">
//               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Assigned Clients</p>
//               <p className="text-lg font-black text-slate-900">{member.clients}</p>
//             </div>
//           </div>
//           <div className="flex justify-end gap-2 mt-3 ml-2">
//              <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-md text-xs font-bold hover:bg-slate-50 transition-colors">Edit</button>
//              <button className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-md text-xs font-bold hover:bg-emerald-100 transition-colors">View Details</button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default function DistributorUsersPage() {
//   const [searchTerm, setSearchTerm] = useState('');

//   const filteredTeam = TEAM_MEMBERS.filter(member => 
//     member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     member.role.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   return (
//     <div className="h-full flex flex-col relative z-10 animate-[fadeIn_0.5s_ease-out] overflow-hidden">
      
//       {/* Fixed Header */}
//       <div className="shrink-0 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6 md:mb-8">
//         <div>
//           <h1 className="text-3xl font-black tracking-tight text-slate-900">
//             User <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800">Management</span>
//           </h1>
//           <p className="text-slate-500 font-medium mt-1 text-sm">Manage access, roles, and assignments for your staff.</p>
//         </div>
//         <div className="flex gap-3 w-full md:w-auto">
//           <div className="relative flex-1 md:w-64">
//             <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
//             <input
//               type="text"
//               placeholder="Search team..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all shadow-sm"
//             />
//           </div>
//           <button className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-md font-medium text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20">
//             <UserPlus className="w-4 h-4" />
//             <span>Add Member</span>
//           </button>
//         </div>
//       </div>

//       {/* Table handles its own scroll internally */}
//       <div className="flex-1 min-h-0 flex flex-col">
        
//         {/* Mobile Scroll Area */}
//         <div className="md:hidden overflow-y-auto pr-1 pb-6 space-y-2">
//            {filteredTeam.map((member) => (
//              <MobileUserCard key={member.id} member={member} />
//            ))}
//         </div>

//         {/* Desktop Fixed Table Wrapper */}
//         <div className="hidden md:flex flex-col flex-1 min-h-0 bg-white rounded-md border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
//           <div className="overflow-auto table-scrollbar flex-1">
//             <table className="w-full text-left border-collapse min-w-[800px]">
//               <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-md z-10 shadow-sm border-b border-slate-200">
//                 <tr>
//                   <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Team Member</th>
//                   <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Contact Info</th>
//                   <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Assigned Clients</th>
//                   <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
//                   <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-100 text-[13px]">
//                 {filteredTeam.map((member) => (
//                   <tr key={member.id} className="hover:bg-slate-50/50 transition-colors group">
//                     <td className="px-6 py-4">
//                       <div className="flex items-center gap-4">
//                         <div className="flex items-center justify-center w-10 h-10 rounded-md bg-emerald-50 text-emerald-700 font-black text-sm border border-emerald-100">
//                           {member.name.substring(0, 2).toUpperCase()}
//                         </div>
//                         <div>
//                           <p className="font-black text-slate-900 leading-tight">{member.name}</p>
//                           <p className="text-[10px] font-medium text-slate-400 mt-0.5 flex items-center gap-1">
//                             <Shield className="w-3 h-3 text-emerald-600" /> {member.role}
//                           </p>
//                         </div>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 text-sm font-medium text-slate-600">
//                       <div className="flex items-center gap-2">
//                         <Mail className="w-4 h-4 text-slate-400" />
//                         {member.email}
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 text-center font-black text-slate-900 text-lg tabular-nums">
//                       {member.clients}
//                     </td>
//                     <td className="px-6 py-4 text-center">
//                       <Badge intent={member.status === 'Active' ? 'success' : 'neutral'}>{member.status}</Badge>
//                     </td>
//                     <td className="px-6 py-4 text-right">
//                       <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-all">
//                         <MoreVertical className="w-4 h-4" />
//                       </button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>
      
//     </div>
//   );
// }

// "use client";

// import React from 'react';
// import { Settings } from 'lucide-react';

// export default function UserManagementPage() {
//   return (
//     <div className="flex flex-col items-center justify-center h-full text-center animate-in fade-in duration-500">
//       <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
//         <Settings className="w-8 h-8 animate-[spin_4s_linear_infinite]" />
//       </div>
//       <h1 className="text-2xl font-black text-slate-900 mb-2">User Management</h1>
//       <p className="text-slate-500 font-medium">This module is currently under development and will be available soon.</p>
//     </div>
//   );
// }

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
    arn: '',
    parent_id: '',
    share_percentage: 0
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await distributorService.getCompanyUsers();
      if (res.success && res.data) {
        // Handle array whether it's wrapped in a .data key or returned directly
        const dataArr = Array.isArray(res.data) ? res.data : (res.data as any).data || [];
        setUsers(dataArr);
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
        arn: user.arn || '',
        parent_id: user.parent_id || '',
        share_percentage: user.share_percentage || 0
      });
    } else {
      setEditingUserId(null);
      setFormData({
        role: 'SUB_BROKER',
        name: '',
        arn: '',
        parent_id: '', 
        share_percentage: 0
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
      if (editingUserId) {
        await distributorService.updateCompanyUser(editingUserId, formData);
      } else {
        await distributorService.createCompanyUser(formData);
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
                        {user.role?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-[11px] font-bold text-slate-500">
                      {user.arn || 'N/A'}
                    </td>
                    <td className="p-4 text-right font-black text-slate-700 tabular-nums">
                      {user.share_percentage}%
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
                      value={formData.arn}
                      onChange={(e) => setFormData({...formData, arn: e.target.value})}
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
                      min="0" max="100" required
                      value={formData.share_percentage === 0 && !editingUserId ? '' : formData.share_percentage}
                      onChange={(e) => setFormData({...formData, share_percentage: Number(e.target.value)})}
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
                    value={formData.parent_id}
                    onChange={(e) => setFormData({...formData, parent_id: e.target.value})}
                    required
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none"
                  >
                    <option value="" disabled>Select a Parent User...</option>
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