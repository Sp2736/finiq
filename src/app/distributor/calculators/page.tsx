// "use client";

// import React from 'react';
// import { Calculator, TrendingUp, Target, ArrowUpRight, BarChart, ChevronRight } from 'lucide-react';

// const CALCULATORS = [
//   { id: 1, name: 'SIP Calculator', description: 'Calculate wealth accumulation through regular monthly investments.', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
//   { id: 2, name: 'Lumpsum Calculator', description: 'Estimate the future value of a one-time investment over time.', icon: BarChart, color: 'text-teal-600', bg: 'bg-teal-50' },
//   { id: 3, name: 'Goal Planner', description: 'Determine the required investment to reach a specific financial target.', icon: Target, color: 'text-indigo-600', bg: 'bg-indigo-50' },
//   { id: 4, name: 'Step-up SIP', description: 'Project returns when increasing SIP amounts annually to match income growth.', icon: ArrowUpRight, color: 'text-sky-600', bg: 'bg-sky-50' },
// ];

// export default function DistributorCalculatorsPage() {
//   return (
//     <div className="h-full flex flex-col relative z-10 animate-[fadeIn_0.5s_ease-out] overflow-hidden">
      
//       <div className="shrink-0 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
//         <div>
//           <h1 className="text-3xl font-black tracking-tight text-slate-900">
//             Financial <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800">Calculators</span>
//           </h1>
//           <p className="text-slate-500 font-medium mt-1 text-sm">Tools to project wealth and plan client investment strategies.</p>
//         </div>
//       </div>

//       <div className="flex-1 overflow-y-auto pr-2 pb-6 flex flex-col gap-6 scrollbar-none">
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           {CALCULATORS.map((calc) => (
//             <div key={calc.id} className="bg-white p-6 md:p-8 rounded-md border border-slate-200 shadow-sm hover:border-emerald-200 transition-all group flex flex-col sm:flex-row items-start sm:items-center gap-6 cursor-pointer relative overflow-hidden">
//               <div className={`w-16 h-16 shrink-0 ${calc.bg} ${calc.color} rounded-md flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
//                 <calc.icon className="w-8 h-8" />
//               </div>
//               <div className="flex-1">
//                 <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1 group-hover:text-emerald-700 transition-colors">{calc.name}</h3>
//                 <p className="text-sm text-slate-500 font-medium leading-relaxed">{calc.description}</p>
//               </div>
//               <div className="hidden sm:flex w-10 h-10 rounded-full bg-slate-50 items-center justify-center group-hover:bg-emerald-50 transition-colors shrink-0">
//                 <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600" />
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//     </div>
//   );
// }
"use client";

import React from 'react';
import { Settings } from 'lucide-react';

export default function CalculatorsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center animate-in fade-in duration-500">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
        <Settings className="w-8 h-8 animate-[spin_4s_linear_infinite]" />
      </div>
      <h1 className="text-2xl font-black text-slate-900 mb-2">Calculators</h1>
      <p className="text-slate-500 font-medium">This module is currently under development and will be available soon.</p>
    </div>
  );
}