import React from 'react';
import { Landmark, Layers, CheckCircle2, ShieldCheck, Database } from 'lucide-react';
import type { DGCAMethodologyReport } from '../../api/types';

interface MethodologyStandardsWidgetProps {
  methodology: DGCAMethodologyReport | null;
}

export const MethodologyStandardsWidget: React.FC<MethodologyStandardsWidgetProps> = ({
  methodology,
}) => {
  const features = methodology?.key_features || [
    'Real-time web scraping from direct airline portals (IndiGo) and OTAs (Goibibo)',
    'Multi-window advance-purchase tracking (T+1, T+7, T+15, T+30, T+45)',
    'Outlier detection and data quality scoring using Tukey 1.5×IQR boundaries',
    'Lead-time price elasticity curve estimation across booking horizons',
    'Anomaly detection and surge alert dispatch for >30% spikes',
    'DGCA validation and comparison against official civil aviation passenger volume',
  ];

  const qualityChecks = methodology?.quality_assurance || [
    'Duplicate quote detection and deduplication across booking engines',
    'Statutory tax/fee breakdown validation (Base + YQ + UDF + GST + PSF)',
    'DGCA passenger traffic weights calibrated to annual volume schedules',
    'Temporal freshness enforcement ensuring active quotes are <24h old',
    'Non-negative advance purchase horizon validation (T+1 to T+90)',
  ];

  return (
    <div className="cmd-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <Landmark className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
            Government Compliance & Methodological Architecture
          </span>
        </div>
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
          MoSPI CPI Group 5.4 Harmonized
        </span>
      </div>

      {/* Grid of Standard Features */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
        {/* Core Methodological Capabilities */}
        <div className="p-3 bg-[#070D1E] rounded border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-slate-200 font-bold text-xs">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Index Computation Engine Capabilities</span>
          </div>
          <ul className="space-y-1.5 text-[10px] text-slate-400">
            {features.map((f, i) => (
              <li key={i} className="flex items-start space-x-2">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Quality Assurance Safeguards */}
        <div className="p-3 bg-[#070D1E] rounded border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-slate-200 font-bold text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>Statistical Quality Assurance Framework</span>
          </div>
          <ul className="space-y-1.5 text-[10px] text-slate-400">
            {qualityChecks.map((q, i) => (
              <li key={i} className="flex items-start space-x-2">
                <CheckCircle2 className="w-3 h-3 text-teal-400 flex-shrink-0 mt-0.5" />
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Reference Summary Bar */}
      <div className="p-2.5 bg-[#070D1E] rounded border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
        <div className="flex items-center space-x-2">
          <Database className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
          <span>
            Methodology certified under the MoSPI Central Statistics Office (CSO) guidelines for high-frequency index aggregation.
          </span>
        </div>
        <div className="text-slate-300 font-bold">Base: 2024-01 = 100.0</div>
      </div>
    </div>
  );
};
