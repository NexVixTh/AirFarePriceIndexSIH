import React, { useState } from 'react';
import type { InflationFilters } from './InflationControlPanel';

interface InflationTrajectoryChartProps {
  filters: InflationFilters;
  inflationRate: number;
  trajectoryPoints: {
    period: string;
    indexValue: number;
    monthlyChange: number;
  }[];
}

export const InflationTrajectoryChart: React.FC<InflationTrajectoryChartProps> = ({
  filters,
  inflationRate,
  trajectoryPoints,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (trajectoryPoints.length === 0) {
    return (
      <div className="bg-[#0B132B] border border-[#1B2A4A] rounded-xl p-6 text-center text-slate-400">
        Select base and comparison periods to render inflation trajectory.
      </div>
    );
  }

  const values = trajectoryPoints.map((p) => p.indexValue);
  const minVal = Math.min(...values, 96);
  const maxVal = Math.max(...values, 108);
  const range = maxVal - minVal || 1;

  // Chart Dimensions
  const width = 800;
  const height = 240;
  const padLeft = 45;
  const padRight = 30;
  const padTop = 25;
  const padBottom = 35;
  const innerWidth = width - padLeft - padRight;
  const innerHeight = height - padTop - padBottom;

  const getX = (idx: number) =>
    padLeft + (idx / Math.max(1, trajectoryPoints.length - 1)) * innerWidth;
  const getY = (val: number) =>
    padTop + innerHeight - ((val - minVal) / range) * innerHeight;

  // Build SVG Path
  const linePath = trajectoryPoints.reduce((acc, pt, i) => {
    return `${acc} ${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(pt.indexValue)}`;
  }, '');

  // Fill area under curve
  const areaPath = `${linePath} L ${getX(trajectoryPoints.length - 1)} ${padTop + innerHeight} L ${getX(0)} ${padTop + innerHeight} Z`;

  const hoveredPoint = hoveredIdx !== null ? trajectoryPoints[hoveredIdx] : null;

  return (
    <div className="bg-[#0B132B] border border-[#1B2A4A] rounded-xl p-5 shadow-lg relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#1B2A4A]/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            <h3 className="text-sm font-semibold text-white tracking-wide uppercase">
              Rebased Price Index Trajectory ({filters.basePeriod} = 100.0)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Normalized progression from base period ({filters.basePeriod}) to comparison period ({filters.comparisonPeriod}).
          </p>
        </div>

        {/* Inflation Formula Badge */}
        <div className="flex items-center gap-3">
          <div className="bg-[#060A13] border border-blue-500/30 rounded-lg px-3 py-1.5 font-mono text-xs">
            <span className="text-slate-400">Calculated Inflation: </span>
            <span
              className={`font-bold ${
                inflationRate >= 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {inflationRate >= 0 ? `+${inflationRate.toFixed(2)}%` : `${inflationRate.toFixed(2)}%`}
            </span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          style={{ minWidth: '550px' }}
        >
          <defs>
            <linearGradient id="inflationGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = padTop + innerHeight * pct;
            const val = (maxVal - pct * range).toFixed(1);
            return (
              <g key={idx}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#1B2A4A"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 8}
                  y={y + 3}
                  fill="#64748B"
                  fontSize="10"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Base 100 hairline */}
          {minVal <= 100 && maxVal >= 100 && (
            <line
              x1={padLeft}
              y1={getY(100)}
              x2={width - padRight}
              y2={getY(100)}
              stroke="#60A5FA"
              strokeDasharray="4 4"
              strokeWidth="1.2"
              strokeOpacity="0.5"
            />
          )}

          {/* Area Fill */}
          <path d={areaPath} fill="url(#inflationGrad)" />

          {/* Line Path */}
          <path
            d={linePath}
            fill="none"
            stroke="#38BDF8"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points */}
          {trajectoryPoints.map((pt, idx) => {
            const cx = getX(idx);
            const cy = getY(pt.indexValue);
            const isHovered = hoveredIdx === idx;
            const isBase = pt.period === filters.basePeriod;
            const isTarget = pt.period === filters.comparisonPeriod;

            return (
              <g key={idx}>
                {isHovered && (
                  <line
                    x1={cx}
                    y1={padTop}
                    x2={cx}
                    y2={height - padBottom}
                    stroke="#475569"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}

                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 6 : isBase || isTarget ? 5 : 3.5}
                  fill={isBase ? '#10B981' : isTarget ? '#F59E0B' : '#0B132B'}
                  stroke="#38BDF8"
                  strokeWidth={2}
                />

                <text
                  x={cx}
                  y={height - padBottom + 16}
                  fill="#64748B"
                  fontSize="9.5"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {pt.period}
                </text>

                {/* Hit target */}
                <rect
                  x={cx - innerWidth / (trajectoryPoints.length * 2)}
                  y={padTop}
                  width={innerWidth / trajectoryPoints.length}
                  height={innerHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              </g>
            );
          })}
        </svg>

        {/* Tooltip Card */}
        {hoveredPoint && hoveredIdx !== null && (
          <div
            className="absolute z-10 pointer-events-none bg-[#050A18]/95 border border-blue-500/40 rounded-lg p-3 shadow-xl backdrop-blur-md text-xs"
            style={{
              left: `${Math.min(Math.max(getX(hoveredIdx) - 80, 10), width - 180)}px`,
              top: '12px',
            }}
          >
            <div className="font-semibold text-white border-b border-slate-700 pb-1 mb-1 font-mono">
              Period: {hoveredPoint.period}
            </div>
            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex justify-between gap-4 text-blue-300">
                <span>Rebased Index:</span>
                <span className="font-bold">{hoveredPoint.indexValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between gap-4 text-slate-400">
                <span>MoM Drift:</span>
                <span className={hoveredPoint.monthlyChange >= 0 ? 'text-rose-400' : 'text-emerald-400'}>
                  {hoveredPoint.monthlyChange >= 0 ? `+${hoveredPoint.monthlyChange}%` : `${hoveredPoint.monthlyChange}%`}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-2 border-t border-[#1B2A4A]/40 font-mono">
        <span>Formula: Inflation % = ((I_t - I_base) / I_base) × 100</span>
        <span className="text-blue-400">Rebased Standard: Laspeyres Constant Basket</span>
      </div>
    </div>
  );
};
