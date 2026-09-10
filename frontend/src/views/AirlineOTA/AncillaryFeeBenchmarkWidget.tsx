import React from 'react';
import { Landmark, PieChart, ShieldCheck } from 'lucide-react';

export const AncillaryFeeBenchmarkWidget: React.FC = () => {
  const FARE_ANATOMY = [
    { label: 'Base Airfare', percent: 68, color: 'bg-blue-500', desc: 'Retained by carrier for flight operation' },
    { label: 'Fuel Surcharge (YQ)', percent: 12, color: 'bg-cyan-400', desc: 'Aviation turbine fuel (ATF) surcharge' },
    { label: 'Airport UDF / ADF', percent: 9, color: 'bg-purple-500', desc: 'User Development Fee set by AERA' },
    { label: 'Passenger Security Fee', percent: 3, color: 'bg-teal-400', desc: 'CISF statutory deployment fee' },
    { label: 'Statutory GST', percent: 5, color: 'bg-amber-400', desc: '5% Goods & Services Tax on economy' },
    { label: 'Convenience Fee', percent: 3, color: 'bg-rose-400', desc: 'Digital payment gateway processing' },
  ];

  return (
    <div className="cmd-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <PieChart className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
            Domestic Ticket Fare Breakdown Anatomy
          </span>
        </div>
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-950/80 text-purple-300 border border-purple-800/60">
          AERA & DGCA Statutory Norms
        </span>
      </div>

      {/* Stacked Percentage Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>Component Breakdown (% of Headline Ticket Price)</span>
          <span className="text-white font-bold">100.0% Aggregate</span>
        </div>

        <div className="h-3 w-full rounded-full bg-slate-900 flex overflow-hidden p-0.5 border border-slate-800">
          {FARE_ANATOMY.map((item) => (
            <div
              key={item.label}
              className={`h-full ${item.color} first:rounded-l-full last:rounded-r-full transition-all`}
              style={{ width: `${item.percent}%` }}
              title={`${item.label}: ${item.percent}%`}
            />
          ))}
        </div>
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[10px] font-mono">
        {FARE_ANATOMY.map((item) => (
          <div key={item.label} className="p-2 rounded bg-[#070D1E] border border-slate-800/80">
            <div className="flex items-center space-x-1.5">
              <span className={`w-2 h-2 rounded-full ${item.color} flex-shrink-0`} />
              <span className="font-bold text-slate-200 truncate">{item.label}</span>
              <span className="text-cyan-300 font-bold ml-auto">{item.percent}%</span>
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">{item.desc}</div>
          </div>
        ))}
      </div>

      {/* Regulatory Standard Callout */}
      <div className="p-2.5 bg-[#070D1E] rounded border border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <div className="flex items-center space-x-1.5">
          <Landmark className="w-3.5 h-3.5 text-blue-400" />
          <span>Compliant with DGCA CAR Section 3, Series M, Part IV (Airfare Transparency).</span>
        </div>
        <div className="flex items-center space-x-1 text-slate-400">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>Audited</span>
        </div>
      </div>
    </div>
  );
};
