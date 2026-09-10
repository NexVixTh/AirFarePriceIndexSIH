import React from 'react';
import { ShieldCheck, Compass } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#060B18] border-t border-[#1B2A4A] py-3 px-4 sm:px-6 text-xs text-slate-400 relative select-none">
      {/* Subtle tricolor hairline accent */}
      <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-blue-600 via-cyan-500 via-amber-500 to-emerald-500 opacity-60" />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-1 font-mono text-[11px] text-slate-300">
            <span className="font-bold text-white flex items-center gap-1">
              <Compass className="w-3 h-3 text-blue-400" />
              <span>APIndex (SIH26056)</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-cyan-300">MoSPI CPI Transport Reference Series</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">DGCA Form 27A Scheduled Basket</span>
          </div>
          <p className="text-[10px] text-slate-500 font-sans">
            Real-time domestic airfare price index platform for government statistical and macroeconomic policy intelligence.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Strict Rate-Limiting & robots.txt Compliance</span>
        </div>
      </div>
    </footer>
  );
};
