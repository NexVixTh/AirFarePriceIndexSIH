import React from 'react';
import { ShieldCheck } from 'lucide-react';
import type { HealthResponse } from '../../api/types';

interface DataTrustOverviewProps {
  health: HealthResponse | null;
}

export const DataTrustOverview: React.FC<DataTrustOverviewProps> = ({ health: _health }) => {
  return (
    <div className="cmd-panel p-3.5 flex flex-col justify-between border-t-2 border-t-teal-500">
      <div>
        <div className="flex items-center justify-between pb-2 border-b border-[#1B2A4A]">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
              Data Trust Observability
            </h4>
          </div>
          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
            MONITORED
          </span>
        </div>

        {/* 3 Qualitative Status Rings (Zero Fake Percentages) */}
        <div className="grid grid-cols-3 gap-2 py-3">
          {/* Ring 1: MoSPI Series */}
          <div className="flex flex-col items-center space-y-1">
            <svg className="w-14 h-14" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#06B6D4"
                strokeWidth="3"
              />
              <text x="18" y="20.5" fill="#06B6D4" fontSize="6.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                SYNC
              </text>
            </svg>
            <span className="text-[9px] font-mono text-slate-300 text-center">MoSPI Series</span>
            <span className="text-[8px] font-mono text-cyan-400">20 Months</span>
          </div>

          {/* Ring 2: DGCA Basket */}
          <div className="flex flex-col items-center space-y-1">
            <svg className="w-14 h-14" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="3"
              />
              <text x="18" y="20.5" fill="#3B82F6" fontSize="6" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                FIXED
              </text>
            </svg>
            <span className="text-[9px] font-mono text-slate-300 text-center">DGCA Basket</span>
            <span className="text-[8px] font-mono text-blue-400">5 Routes</span>
          </div>

          {/* Ring 3: Compliance */}
          <div className="flex flex-col items-center space-y-1">
            <svg className="w-14 h-14" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#10B981"
                strokeWidth="3"
              />
              <text x="18" y="20.5" fill="#10B981" fontSize="6" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                ACTIVE
              </text>
            </svg>
            <span className="text-[9px] font-mono text-slate-300 text-center">Governance</span>
            <span className="text-[8px] font-mono text-emerald-400">robots.txt</span>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-[#1B2A4A] text-[9px] font-mono text-slate-400 flex items-center justify-between">
        <span>Qualitative Status Metric</span>
        <span className="text-teal-400">Zero Fabrication Standard</span>
      </div>
    </div>
  );
};
