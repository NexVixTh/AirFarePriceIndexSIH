import React from 'react';
import { AlertCircle } from 'lucide-react';

export const WaterfallDecomposition: React.FC = () => {
  return (
    <div className="cmd-panel p-3.5 flex flex-col justify-between border-t-2 border-t-purple-500">
      <div>
        <div className="flex items-center justify-between pb-2 border-b border-[#1B2A4A]">
          <div className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
              Waterfall Decomposition
            </h4>
          </div>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-500/30">
            Baseline (100.0)
          </span>
        </div>

        <div className="space-y-3 mt-3 text-xs font-mono">
          <div className="p-3 rounded bg-[#080E20] border border-[#1B2A4A] space-y-2">
            <div className="flex items-center space-x-2 text-amber-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-bold text-[11px] uppercase tracking-wider">Contribution Analysis</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
              Contribution analysis awaiting sufficient route-level observations. National index is tracking at baseline parity (100.0) with zero net route variance.
            </p>
            <div className="pt-1 text-[10px] font-mono text-slate-400 border-t border-[#1B2A4A]">
              Net Movement: <span className="text-emerald-400 font-bold">0.00 pts</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-[#1B2A4A] text-[9px] font-mono text-slate-400 flex items-center justify-between">
        <span>Decomposition Engine</span>
        <span className="text-purple-400">Awaiting Ingestion</span>
      </div>
    </div>
  );
};
