import React from 'react';
import { Cpu } from 'lucide-react';

export const AnomalyRuleCatalogWidget: React.FC = () => {
  const SURVEILLANCE_RULES = [
    {
      code: 'RULE-01',
      name: 'Dynamic Surge Escalation Trigger',
      condition: 'P_quote > 1.30 × P_baseline (30d rolling)',
      action: 'Dispatches high-priority alert to MoSPI monitoring queue',
      status: 'Active',
      color: 'border-rose-500 text-rose-400',
    },
    {
      code: 'RULE-02',
      name: 'Sub-Tax Fare Glitch Floor',
      condition: 'P_total < ₹1,500 statutory minimum',
      action: 'Quarantines quote from index aggregation basket',
      status: 'Active',
      color: 'border-amber-500 text-amber-400',
    },
    {
      code: 'RULE-03',
      name: 'Tukey Extreme Tail Outlier',
      condition: 'P_quote > Q3 + 3.0 × IQR',
      action: 'Flags data point for manual analyst verification',
      status: 'Active',
      color: 'border-purple-500 text-purple-400',
    },
    {
      code: 'RULE-04',
      name: 'Coordinated Tariff Parallelism',
      condition: 'Synchronous >25% spike across 2+ carriers within 2 hours',
      action: 'Logs anti-competitive surveillance audit trail',
      status: 'Active',
      color: 'border-cyan-500 text-cyan-400',
    },
  ];

  return (
    <div className="cmd-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
            Real-Time Surveillance Rules Engine
          </span>
        </div>
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
          MoSPI Competition Auditing
        </span>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
        {SURVEILLANCE_RULES.map((r) => (
          <div key={r.code} className="p-3 bg-[#070D1E] rounded border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs">{r.name}</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-800 text-slate-300 font-bold border border-slate-700">
                {r.code}
              </span>
            </div>

            <div className="text-[10px] text-cyan-300 font-mono">
              <code>{r.condition}</code>
            </div>

            <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
              {r.action}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
