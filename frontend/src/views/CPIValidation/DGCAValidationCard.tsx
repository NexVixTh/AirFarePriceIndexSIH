import React from 'react';
import type { DGCAValidationReport } from '../../api/types';

interface DGCAValidationCardProps {
  report: DGCAValidationReport | null;
  isLoading: boolean;
}

export const DGCAValidationCard: React.FC<DGCAValidationCardProps> = ({ report, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-[#0B132B] border border-[#1B2A4A] rounded-xl p-5 animate-pulse">
        <div className="h-4 bg-[#1B2A4A] rounded w-1/3 mb-4" />
        <div className="h-16 bg-[#1B2A4A]/50 rounded mb-2" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="bg-[#0B132B] border border-[#1B2A4A] rounded-xl p-5 text-center text-slate-400 text-xs">
        No DGCA statutory validation benchmark available for this reporting window.
      </div>
    );
  }

  const isAligned = Math.abs(report.percent_difference) < 5;
  const isMinor = Math.abs(report.percent_difference) >= 5 && Math.abs(report.percent_difference) < 10;

  return (
    <div className="bg-[#0B132B] border border-[#1B2A4A] rounded-xl p-5 shadow-lg flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#1B2A4A]/60">
          <div className="flex items-center gap-2">
            <span className="text-blue-400 text-sm">🏛️</span>
            <h3 className="text-sm font-semibold text-white tracking-wide uppercase">
              DGCA Airfare Benchmark Validation
            </h3>
          </div>
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-medium ${
              isAligned
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
                : isMinor
                ? 'bg-amber-950/80 text-amber-400 border border-amber-500/40'
                : 'bg-rose-950/80 text-rose-400 border border-rose-500/40'
            }`}
          >
            {report.validation_status}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <span className="px-2 py-0.5 text-[10px] font-mono font-medium bg-amber-950/80 text-amber-300 border border-amber-500/40 rounded">
            DEMO / CALIBRATED BENCHMARK
          </span>
          <span className="text-[11px] text-slate-400">
            DGCA Reference Tariff Baseline: 103.2
          </span>
        </div>

        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          Statutory comparison of current weighted APIx national airfare index against a DGCA-derived calibrated benchmark. (Note: DGCA does not publish an official monthly airfare index; this 103.2 reference is a research-calibrated benchmark derived from DGCA annual domestic passenger fare reports).
        </p>

        {/* 4-Metric Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          <div className="bg-[#060A13] border border-[#1B2A4A]/60 rounded-lg p-3">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
              APIx National Index
            </span>
            <span className="text-lg font-bold font-mono text-blue-400">
              {report.our_index.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Calculated</span>
          </div>

          <div className="bg-[#060A13] border border-[#1B2A4A]/60 rounded-lg p-3">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
              DGCA Calibrated Benchmark
            </span>
            <span className="text-lg font-bold font-mono text-amber-400">
              {report.dgca_reference_index.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Calibrated Benchmark</span>
          </div>

          <div className="bg-[#060A13] border border-[#1B2A4A]/60 rounded-lg p-3">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
              Index Spread
            </span>
            <span className="text-lg font-bold font-mono text-white">
              {report.difference > 0 ? `+${report.difference.toFixed(2)}` : report.difference.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Points difference</span>
          </div>

          <div className="bg-[#060A13] border border-[#1B2A4A]/60 rounded-lg p-3">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
              Percent Drift
            </span>
            <span
              className={`text-lg font-bold font-mono ${
                isAligned ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {report.percent_difference > 0
                ? `+${report.percent_difference.toFixed(2)}%`
                : `${report.percent_difference.toFixed(2)}%`}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">&lt;5.0% threshold</span>
          </div>
        </div>
      </div>

      <div className="pt-2.5 border-t border-[#1B2A4A]/60 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono">
        <span>Validation Window: {report.month}</span>
        <span>Generated: {new Date(report.report_generated).toLocaleDateString('en-IN')}</span>
      </div>
    </div>
  );
};
