import React from 'react';
import type { NavItemKey } from '../components/layout/Sidebar';
import { Database, Activity, CheckCircle, Clock } from 'lucide-react';
import { usePersona } from '../context/PersonaContext';

interface PlaceholderViewProps {
  stageKey: NavItemKey;
  title: string;
  stageNumber: string;
  description: string;
  dataRequirements: string[];
}

export const PlaceholderView: React.FC<PlaceholderViewProps> = ({
  stageKey,
  title,
  stageNumber,
  description,
  dataRequirements,
}) => {
  const { isAnalyst } = usePersona();

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="cmd-panel p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-2 border-l-blue-500">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono font-semibold mb-1">
            <span>COMMAND MODULE {stageNumber}</span>
            <span className="text-slate-600">•</span>
            <span className="uppercase">{stageKey.replace('-', ' ')}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">{title}</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">{description}</p>
        </div>

        <div className="flex items-center space-x-2 text-xs shrink-0">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded bg-[#101B39] text-cyan-300 border border-cyan-500/30 font-mono text-[11px]">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Master Roadmap Phase</span>
          </span>
        </div>
      </div>

      {/* Data Contract / Specification Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="cmd-panel p-4 space-y-2.5">
          <h3 className="font-semibold text-xs font-mono uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <span>Underlying Data Inputs Required</span>
          </h3>
          <ul className="space-y-2 text-xs text-slate-400">
            {dataRequirements.map((req, i) => (
              <li key={i} className="flex items-start space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span className="font-mono text-xs text-slate-300">{req}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="cmd-panel p-4 space-y-2.5">
          <h3 className="font-semibold text-xs font-mono uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            <span>{isAnalyst ? 'Analyst Diagnostic Specification' : 'Plain-Language Overview'}</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {isAnalyst
              ? 'This module computes direct price relatives against the base period 2024-01, evaluating deviations against DGCA traffic proportions and IQR threshold bounds.'
              : 'This section allows you to see how airfare prices are behaving in this sector, why they are rising or falling, and how reliable the collected numbers are.'}
          </p>
          <div className="pt-2 border-t border-[#1B2A4A] text-[10px] font-mono text-slate-400">
            Status: Ready for sequenced Phase implementation upon instruction.
          </div>
        </div>
      </div>
    </div>
  );
};
