// "use client";

// import React from 'react';
// import { Calculator, TrendingUp, Target, ArrowUpRight, BarChart, ChevronRight } from 'lucide-react';

// const CALCULATORS = [
//   { id: 1, name: 'SIP Calculator', description: 'Calculate wealth accumulation through regular monthly investments.', icon: TrendingUp, color: 'text-[var(--fin-brand-600)]', bg: 'bg-[var(--fin-brand-50)]' },
//   { id: 2, name: 'Lumpsum Calculator', description: 'Estimate the future value of a one-time investment over time.', icon: BarChart, color: 'text-[var(--fin-badge-broker-text)]', bg: 'bg-[var(--fin-badge-broker-bg)]' },
//   { id: 3, name: 'Goal Planner', description: 'Determine the required investment to reach a specific financial target.', icon: Target, color: 'text-[var(--fin-badge-admin-text)]', bg: 'bg-[var(--fin-badge-admin-bg)]' },
//   { id: 4, name: 'Step-up SIP', description: 'Project returns when increasing SIP amounts annually to match income growth.', icon: ArrowUpRight, color: 'text-[var(--fin-badge-broker-text)]', bg: 'bg-[var(--fin-badge-broker-bg)]' },
// ];

// export default function DistributorCalculatorsPage() {
//   return (
//     <div className="h-full flex flex-col relative z-10 animate-[fadeIn_0.5s_ease-out] overflow-hidden">
      
//       <div className="shrink-0 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
//         <div>
//           <h1 className="text-3xl font-black tracking-tight text-[var(--fin-heading-primary)]">
//             Financial <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--fin-brand-600)] via-[var(--fin-badge-broker-text)] to-[var(--fin-brand-800)]">Calculators</span>
//           </h1>
//           <p className="text-[var(--fin-muted-text)] font-medium mt-1 text-sm">Tools to project wealth and plan client investment strategies.</p>
//         </div>
//       </div>

//       <div className="flex-1 overflow-y-auto pr-2 pb-6 flex flex-col gap-6 scrollbar-none">
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           {CALCULATORS.map((calc) => (
//             <div key={calc.id} className="bg-[var(--fin-table-bg)] p-6 md:p-8 rounded-md border border-[var(--fin-border)] shadow-sm hover:border-[var(--fin-brand-200)] transition-all group flex flex-col sm:flex-row items-start sm:items-center gap-6 cursor-pointer relative overflow-hidden">
//               <div className={`w-16 h-16 shrink-0 ${calc.bg} ${calc.color} rounded-md flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
//                 <calc.icon className="w-8 h-8" />
//               </div>
//               <div className="flex-1">
//                 <h3 className="text-xl font-black text-[var(--fin-heading-primary)] tracking-tight mb-1 group-hover:text-[var(--fin-brand-700)] transition-colors">{calc.name}</h3>
//                 <p className="text-sm text-[var(--fin-muted-text)] font-medium leading-relaxed">{calc.description}</p>
//               </div>
//               <div className="hidden sm:flex w-10 h-10 rounded-full bg-[var(--fin-page-bg)] items-center justify-center group-hover:bg-[var(--fin-brand-50)] transition-colors shrink-0">
//                 <ChevronRight className="w-5 h-5 text-[var(--fin-aux-text)] group-hover:text-[var(--fin-brand-600)]" />
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
      <div className="w-16 h-16 bg-[var(--fin-skeleton-base)] rounded-2xl flex items-center justify-center text-[var(--fin-aux-text)] mb-4">
        <Settings className="w-8 h-8 animate-[spin_4s_linear_infinite]" />
      </div>
      <h1 className="text-2xl font-black text-[var(--fin-heading-primary)] mb-2">Calculators</h1>
      <p className="text-[var(--fin-muted-text)] font-medium">This module is currently under development and will be available soon.</p>
    </div>
  );
}