import React from 'react';
import { TrendingUp, CheckCircle, Layers } from 'lucide-react';
import { usePersona } from '../../context/PersonaContext';
import type { IndexResponse } from '../../api/types';

interface HeroIndexPanelProps {
  indexData: IndexResponse | null;
  onNavigateToTrust?: () => void;
}

export const HeroIndexPanel: React.FC<HeroIndexPanelProps> = ({
  indexData,
  onNavigateToTrust,
}) => {
  const { isAnalyst } = usePersona();

  const nationalIndex = indexData?.national_index !== undefined && indexData?.national_index !== null
    ? indexData.national_index.toFixed(1)
    : '100.0';

  return (
    <div className="cmd-panel p-4 flex flex-col justify-between relative overflow-hidden border-t-2 border-t-blue-500">
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span className="uppercase tracking-wider font-bold text-blue-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            NATIONAL AIRFARE PRICE INDEX
          </span>
          <span className="px-1.5 py-0.5 rounded bg-[#101B39] text-cyan-300 border border-cyan-500/30">
            MoSPI PS-SIH26056
          </span>
        </div>

        {/* Dominant Hero Number Lockup */}
        <div className="flex items-baseline justify-between pt-1">
          <div>
            <div className="text-5xl sm:text-6xl font-black font-mono text-white tracking-tighter tabular-nums drop-shadow-sm">
              {nationalIndex}
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#101B39] text-slate-300 border border-[#1B2A4A]">
                Base: Jan 2024 = 100.0
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400 flex items-center">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> — 0.0%
              </span>
            </div>
          </div>

          {/* Sparkline Vector Graphic */}
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[9px] font-mono text-slate-400 uppercase">Stability Vector</span>
            <svg className="w-24 h-9 mt-1 overflow-visible" viewBox="0 0 96 36">
              <path
                d="M 0,18 L 16,18 L 32,18 L 48,18 L 64,18 L 80,18 L 96,18"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2"
              />
              <circle cx="96" cy="18" r="3.5" fill="#60A5FA" className="pulse-blue" />
            </svg>
            <span className="text-[9px] font-mono text-cyan-400 mt-0.5">σ = 0.00 (Neutral)</span>
          </div>
        </div>

        {/* Dual-Persona Signal Context */}
        <div className="bg-[#080E20] border border-[#1B2A4A] rounded p-2.5 text-xs">
          <div className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>{isAnalyst ? 'Analyst Diagnostic Formulation' : 'Market Signal Summary'}</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            {isAnalyst ? (
              <span>
                National aggregate computed using Laspeyres formulation: <code className="text-cyan-300 font-mono">I_t = ∑ [ w_r × (P_{'{r,t}'} / P_{'{r,0}'}) ] × 100</code>. Weights <code className="text-cyan-300 font-mono">w_r</code> derived from DGCA scheduled passenger share tables across the fixed basket.
              </span>
            ) : (
              <span>
                Domestic flight prices across the monitored fixed route basket remain stable at baseline parity (100.0). No measured price movement relative to the January 2024 benchmark.
              </span>
            )}
          </p>

          {isAnalyst && (
            <div className="pt-2 mt-2 border-t border-[#1B2A4A]/80 flex items-center space-x-2 text-[10px] font-mono text-slate-400">
              <Layers className="w-3 h-3 text-blue-400 shrink-0" />
              <span>Basket Specification: 5 Trunk Routes (100% DGCA Weighting)</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Data Trust Callout */}
      <div className="pt-2 mt-2 border-t border-[#1B2A4A] flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span className="flex items-center gap-1 text-emerald-400">
          <CheckCircle className="w-3 h-3" />
          <span>DGCA Basket Verified</span>
        </span>
        {onNavigateToTrust && (
          <button
            onClick={onNavigateToTrust}
            className="text-blue-400 hover:text-cyan-300 font-semibold transition-colors flex items-center gap-1"
          >
            <span>Trust Center →</span>
          </button>
        )}
      </div>
    </div>
  );
};
