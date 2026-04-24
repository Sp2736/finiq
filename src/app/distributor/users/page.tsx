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
"use client";

import React from 'react';
import { Settings } from 'lucide-react';

export default function UserManagementPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center animate-in fade-in duration-500">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
        <Settings className="w-8 h-8 animate-[spin_4s_linear_infinite]" />
      </div>
      <h1 className="text-2xl font-black text-slate-900 mb-2">User Management</h1>
      <p className="text-slate-500 font-medium">This module is currently under development and will be available soon.</p>
    </div>
  );
}