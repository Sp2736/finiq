import React from 'react';
import { ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

interface MobileClientListProps {
  clients: any[];
  onSelectClient: (client: any) => void;
}

export default function MobileClientList({ clients, onSelectClient }: MobileClientListProps) {
  return (
    <div className="space-y-4 overflow-y-auto h-full pr-1">
      {clients.map((client, idx) => {
        const isPositive = client.notional_pl >= 0;

        return (
          <div 
            key={client.pan || idx} 
            onClick={() => onSelectClient(client)}
            className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm active:scale-[0.98] transition-transform cursor-pointer relative overflow-hidden"
          >
            {/* Green accent line on the left */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500" />
            
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 font-black text-sm">
                  {client.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 leading-tight">{client.name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{client.pan}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Current Value</p>
                <p className="text-lg font-black text-slate-900 tracking-tight">{formatCurrency(client.total_current)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Returns</p>
                <div className={`flex items-center gap-1 font-black ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  <span>{client.abs_pct}%</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}