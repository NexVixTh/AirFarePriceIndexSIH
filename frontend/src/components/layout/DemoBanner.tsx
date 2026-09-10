import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useDemoMode } from '../../context/DemoModeContext';

export const DemoBanner: React.FC = () => {
  const { isDemoMode, setDemoMode } = useDemoMode();

  if (!isDemoMode) return null;

  return (
    <div className="bg-amber-950/70 border-b border-amber-600/50 px-3 sm:px-6 py-1.5 text-amber-200 text-xs flex flex-wrap items-center justify-between gap-2 shadow-panel">
      <div className="flex items-center space-x-2">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-bounce" />
        <span className="font-bold tracking-wide uppercase font-mono text-[10px] bg-amber-900/60 text-amber-300 px-1.5 py-0.5 rounded border border-amber-700/50">
          DEMO EVALUATION ACTIVE
        </span>
        <span className="text-amber-200/90 text-[11px] font-sans">
          Curated simulated observations are active for evaluator testing when live airline scrapers are rate-limited.
        </span>
      </div>
      <button
        onClick={() => setDemoMode(false)}
        className="text-amber-300 hover:text-white px-2 py-0.5 rounded bg-amber-900/50 hover:bg-amber-800/80 border border-amber-600/50 text-[10px] font-mono transition-colors"
      >
        Switch to Live Engine
      </button>
    </div>
  );
};
