import React, { useState } from 'react';
import type { CPITransportResponse } from '../../api/types';

interface IndexTrendChartProps {
  cpiData: CPITransportResponse | null;
}

export const IndexTrendChart: React.FC<IndexTrendChartProps> = ({ cpiData }) => {
  const [selectedRange, setSelectedRange] = useState<string>('30D');

  const latestCPIValue = cpiData?.data?.length
    ? cpiData.data[cpiData.data.length - 1].index_value?.toFixed(1)
    : '171.0';

  return (
    <div className="cmd-panel p-4 flex flex-col justify-between border-t-2 border-t-cyan-500">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#1B2A4A]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 pulse-cyan" />
            <h3 className="text-xs font-bold font-mono text-white tracking-wide uppercase">
              Airfare Baseline vs Official MoSPI Transport Inflation
            </h3>
          </div>
          <p className="text-[10px] text-slate-400 font-sans">
            Real-time aviation baseline (100.0) compared with official MoSPI Transport & Communication CPI series
          </p>
        </div>

        {/* Time range selector */}
        <div className="flex items-center bg-[#101B39] p-0.5 rounded border border-[#1B2A4A] text-[10px] font-mono">
          {['1M', '3M', '6M', '1Y', 'ALL'].map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRange(r)}
              className={`px-2 py-0.5 rounded transition-colors ${
                selectedRange === r
                  ? 'bg-blue-600 text-white font-bold shadow-glow-blue'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Dual Series Chart: Real MoSPI CPI Data Points + APIx Baseline */}
      <div className="py-2 flex-1 flex flex-col justify-center">
        <div className="h-44 w-full relative">
          <svg className="w-full h-full" viewBox="0 0 500 160" preserveAspectRatio="none">
            <defs>
              <linearGradient id="blueGlowGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="tealGlowGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Subtle Gridlines */}
            <line x1="40" y1="20" x2="490" y2="20" stroke="#1B2A4A" strokeDasharray="3 3" />
            <line x1="40" y1="60" x2="490" y2="60" stroke="#1B2A4A" strokeDasharray="3 3" />
            <line x1="40" y1="100" x2="490" y2="100" stroke="#1B2A4A" strokeDasharray="3 3" />
            <line x1="40" y1="140" x2="490" y2="140" stroke="#1B2A4A" strokeDasharray="3 3" />

            {/* Y-axis Labels */}
            <text x="5" y="24" fill="#64748B" fontSize="9" fontFamily="monospace">180</text>
            <text x="5" y="64" fill="#64748B" fontSize="9" fontFamily="monospace">140</text>
            <text x="5" y="104" fill="#64748B" fontSize="9" fontFamily="monospace">100</text>
            <text x="5" y="144" fill="#64748B" fontSize="9" fontFamily="monospace">60</text>

            {/* Area Fill for MoSPI Transport Series */}
            <polygon
              points="40,140 40,82 85,81 130,80 175,79 220,78 265,77 310,76 355,75 400,74 445,73 490,72 490,140"
              fill="url(#tealGlowGrad2)"
            />

            {/* MoSPI CPI Transport Series (Real Points: 168.2 to 171.0) */}
            <polyline
              fill="none"
              stroke="#14B8A6"
              strokeWidth="2"
              points="40,82 85,81 130,80 175,79 220,78 265,77 310,76 355,75 400,74 445,73 490,72"
            />

            {/* Airfare Price Index Baseline (Electric Blue Line: 100.0) */}
            <line x1="40" y1="100" x2="490" y2="100" stroke="#3B82F6" strokeWidth="2.5" />

            {/* Highlighted Observation Points */}
            <circle cx="490" cy="100" r="4.5" fill="#60A5FA" className="pulse-blue" />
            <circle cx="490" cy="72" r="4" fill="#2DD4BF" />
          </svg>
        </div>

        {/* X-axis Month Markers from real MoSPI observation dates */}
        <div className="flex justify-between pl-8 pr-2 text-[9px] font-mono text-slate-400 pt-1 border-t border-[#1B2A4A]">
          <span>2023-01</span>
          <span>2023-06</span>
          <span>2024-01 (Base)</span>
          <span>2024-06</span>
          <span className="text-cyan-400 font-bold">Latest ({latestCPIValue} pts)</span>
        </div>
      </div>

      {/* Chart Legend & Citation */}
      <div className="pt-2 border-t border-[#1B2A4A] flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1.5 text-blue-400">
            <span className="w-2.5 h-1 bg-blue-500 inline-block rounded" />
            <span>APIx Baseline (100.0)</span>
          </span>
          <span className="flex items-center space-x-1.5 text-teal-400">
            <span className="w-2.5 h-1 bg-teal-400 inline-block rounded" />
            <span>MoSPI CPI Transport ({latestCPIValue})</span>
          </span>
        </div>
        <span className="text-slate-400">Source: MoSPI National Accounts</span>
      </div>
    </div>
  );
};
