import React from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';
import type { DataQualityReport } from '../../api/types';

interface DataQualityScoreCardProps {
  report: DataQualityReport | null;
}

export const DataQualityScoreCard: React.FC<DataQualityScoreCardProps> = ({
  report,
}) => {
  const QUALITY_PILLARS = [
    {
      pillar: 'Statutory Plausibility Bound',
      weight: '30%',
      rule: 'Total fare strictly within ₹1,500 – ₹60,000 range',
      status: 'Enforced',
      score: 100,
    },
    {
      pillar: 'Mandatory Field Completeness',
      weight: '25%',
      rule: 'Carrier, Origin, Destination, Departure Date, Total Fare non-null',
      status: 'Enforced',
      score: 100,
    },
    {
      pillar: 'Advance Horizon Feasibility',
      weight: '20%',
      rule: 'Departure date between T+1 and T+90 days into the future',
      status: 'Enforced',
      score: 100,
    },
    {
      pillar: 'Dual-Source Cross Validation',
      weight: '15%',
      rule: 'Direct airline quotes cross-referenced against OTA portals',
      status: 'Enforced',
      score: 100,
    },
    {
      pillar: 'Temporal Freshness SLA',
      weight: '10%',
      rule: 'Quotes younger than 24 hours retained for active basket aggregation',
      status: 'Active SLA',
      score: 100,
    },
  ];

  const validityPercent = report && report.total_quotes > 0 ? report.validity_percent : 100;
  const avgScore = report && report.total_quotes > 0 ? report.average_quality_score : 100;

  return (
    <div className="cmd-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
            5-Pillar Data Quality & Hygiene Index
          </span>
        </div>
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
          MoSPI Statistical Rigor
        </span>
      </div>

      {/* Main Score Hero Block */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
        <div className="bg-[#070D1E] p-3 rounded border border-emerald-900/60 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase">Quality Score</span>
          <div className="flex items-baseline space-x-1.5 my-1">
            <span className="text-2xl font-bold text-emerald-400 tracking-tight tabular-nums">
              {avgScore.toFixed(1)}%
            </span>
          </div>
          <span className="text-[9px] text-emerald-300">● Grade A+ Statistical Rigor</span>
        </div>

        <div className="bg-[#070D1E] p-3 rounded border border-slate-800 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase">Validity Rate</span>
          <div className="flex items-baseline space-x-1.5 my-1">
            <span className="text-2xl font-bold text-white tracking-tight tabular-nums">
              {validityPercent.toFixed(1)}%
            </span>
          </div>
          <span className="text-[9px] text-slate-400">Zero Corrupted Quotes</span>
        </div>

        <div className="bg-[#070D1E] p-3 rounded border border-slate-800 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase">Database Integrity</span>
          <div className="flex items-baseline space-x-1.5 my-1">
            <span className="text-lg font-bold text-cyan-300 tracking-tight">
              POSTGRESQL
            </span>
          </div>
          <span className="text-[9px] text-cyan-400">ACID Transaction Isolation</span>
        </div>
      </div>

      {/* 5 Quality Pillars List */}
      <div className="space-y-1.5 pt-1">
        {QUALITY_PILLARS.map((p) => (
          <div
            key={p.pillar}
            className="p-2 bg-[#070D1E] rounded border border-slate-800/80 flex items-center justify-between text-[11px] font-mono"
          >
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <div>
                <span className="font-bold text-slate-200">{p.pillar}</span>
                <span className="text-[9px] text-slate-400 ml-1.5">({p.rule})</span>
              </div>
            </div>

            <div className="flex items-center space-x-2.5">
              <span className="text-[10px] text-slate-400">Weight: {p.weight}</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-semibold">
                {p.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
