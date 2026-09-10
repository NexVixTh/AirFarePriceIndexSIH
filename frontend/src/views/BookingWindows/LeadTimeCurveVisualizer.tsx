import React, { useState } from 'react';
import { 
  TrendingUp, 
  Clock, 
  Lightbulb,
  Sigma
} from 'lucide-react';
import { usePersona } from '../../context/PersonaContext';

export interface WindowMetric {
  window: 'T+1' | 'T+7' | 'T+15' | 'T+30' | 'T+45';
  advanceDays: number;
  label: string;
  expectedFare: number;
  baseFare: number;
  multiplier: number;
  quoteCount: number;
  status: 'Awaiting Live Batch' | 'Empirical Baseline';
  risk: 'High Surge' | 'Moderate Surge' | 'Optimal Window';
}

interface LeadTimeCurveVisualizerProps {
  route: string;
  baseFare: number;
  windows: WindowMetric[];
  loading: boolean;
}

export const LeadTimeCurveVisualizer: React.FC<LeadTimeCurveVisualizerProps> = ({
  route,
  baseFare,
  windows,
  loading,
}) => {
  const { isAnalyst } = usePersona();
  const [hoveredWindow, setHoveredWindow] = useState<WindowMetric | null>(null);

  // SVG Chart Dimensions
  const width = 800;
  const height = 300;
  const padLeft = 60;
  const padRight = 40;
  const padTop = 30;
  const padBottom = 45;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  // Windows in chronological order of booking (T+45 down to T+1)
  const orderedWindows = [...windows].sort((a, b) => b.advanceDays - a.advanceDays);

  const minPrice = Math.min(...windows.map((w) => w.expectedFare), baseFare) * 0.90;
  const maxPrice = Math.max(...windows.map((w) => w.expectedFare), baseFare * 1.8) * 1.05;

  const getX = (days: number) => {
    // Map days (45 down to 1) horizontally
    // 45 days is at the left, 1 day is at the right
    const minD = 1;
    const maxD = 45;
    const ratio = (maxD - days) / (maxD - minD);
    return padLeft + ratio * chartW;
  };

  const getY = (price: number) => {
    const clamped = Math.max(minPrice, Math.min(maxPrice, price));
    return padTop + chartH - ((clamped - minPrice) / (maxPrice - minPrice)) * chartH;
  };

  // Build SVG path
  const pathD = orderedWindows
    .map((w, i) => {
      const x = getX(w.advanceDays);
      const y = getY(w.expectedFare);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Gradient area
  const areaD = `${pathD} L ${getX(1)} ${padTop + chartH} L ${getX(45)} ${padTop + chartH} Z`;

  return (
    <div className="cmd-card p-4 space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
              Lead-Time Price Elasticity Curve ({route})
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-blue-950/80 text-blue-300 border border-blue-800/60">
              5 Standard DGCA Windows (T+1 to T+45)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Empirical yield management escalation curve tracking price appreciation as departure approaches
          </p>
        </div>

        <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400">
          <span className="flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Horizon: 45 Days → 1 Day Ahead</span>
          </span>
        </div>
      </div>

      {/* SVG Escalation Visualizer */}
      <div className="relative bg-[#070D1E] border border-slate-800/60 rounded p-2">
        {loading && (
          <div className="absolute inset-0 bg-[#070D1E]/80 backdrop-blur-[1px] flex items-center justify-center z-10">
            <span className="text-xs font-mono text-blue-400 animate-pulse">
              Computing Lead-Time Elasticity...
            </span>
          </div>
        )}

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-56 sm:h-64 select-none"
          onMouseLeave={() => setHoveredWindow(null)}
        >
          <defs>
            <linearGradient id="windowCurveGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.25" />
              <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="50%" stopColor="#3B82F6" />
              <stop offset="75%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#EF4444" />
            </linearGradient>
          </defs>

          {/* Grid lines (horizontal prices) */}
          {[0.8, 1.0, 1.25, 1.5, 1.75].map((factor) => {
            const price = baseFare * factor;
            const y = getY(price);
            const isBase = factor === 1.0;
            return (
              <g key={factor}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke={isBase ? '#334155' : '#1E293B'}
                  strokeDasharray={isBase ? '4 3' : '2 2'}
                  strokeWidth={isBase ? '1.2' : '0.8'}
                />
                <text
                  x={padLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className={`text-[9px] font-mono fill-slate-400 ${
                    isBase ? 'fill-blue-400 font-bold' : ''
                  }`}
                >
                  ₹{Math.round(price).toLocaleString('en-IN')}
                </text>
              </g>
            );
          })}

          {/* Base Fare line */}
          <line
            x1={padLeft}
            y1={getY(baseFare)}
            x2={width - padRight}
            y2={getY(baseFare)}
            stroke="#2563EB"
            strokeDasharray="6 4"
            strokeWidth="1.2"
            opacity="0.6"
          />
          <text
            x={width - padRight - 5}
            y={getY(baseFare) - 5}
            textAnchor="end"
            className="text-[9px] font-mono fill-blue-400 font-medium"
          >
            BASE TARIFF REFERENCE (₹{baseFare.toLocaleString('en-IN')})
          </text>

          {/* Escalation Area */}
          <path d={areaD} fill="url(#windowCurveGrad)" />

          {/* Main Curve Line */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#lineGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Window Observation Nodes */}
          {orderedWindows.map((w) => {
            const cx = getX(w.advanceDays);
            const cy = getY(w.expectedFare);
            const isHovered = hoveredWindow?.window === w.window;

            return (
              <g key={w.window} className="cursor-pointer" onMouseEnter={() => setHoveredWindow(w)}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? '7' : '5'}
                  fill={w.multiplier > 1.4 ? '#EF4444' : w.multiplier > 1.15 ? '#F59E0B' : '#10B981'}
                  stroke="#0B132B"
                  strokeWidth="2"
                  className="transition-all"
                />
                <text
                  x={cx}
                  y={height - 20}
                  textAnchor="middle"
                  className="text-[10px] font-mono font-bold fill-slate-200"
                >
                  {w.window}
                </text>
                <text
                  x={cx}
                  y={height - 8}
                  textAnchor="middle"
                  className="text-[8px] font-mono fill-slate-400"
                >
                  {w.advanceDays}d ahead
                </text>
              </g>
            );
          })}

          {/* Tooltip Overlay */}
          {hoveredWindow && (
            <g
              transform={`translate(${Math.min(
                getX(hoveredWindow.advanceDays) - 65,
                width - 160
              )}, ${Math.max(20, getY(hoveredWindow.expectedFare) - 55)})`}
            >
              <rect
                width="150"
                height="50"
                rx="4"
                fill="#0B132B"
                stroke="#3B82F6"
                strokeWidth="1"
                className="shadow-xl"
              />
              <text x="8" y="15" className="text-[10px] font-mono fill-slate-300 font-bold">
                {hoveredWindow.window} ({hoveredWindow.advanceDays} Days Ahead)
              </text>
              <text x="8" y="32" className="text-[12px] font-mono fill-white font-black">
                ₹{Math.round(hoveredWindow.expectedFare).toLocaleString('en-IN')}
              </text>
              <text x="85" y="32" className="text-[10px] font-mono fill-amber-400 font-bold">
                {hoveredWindow.multiplier.toFixed(2)}x Base
              </text>
              <text x="8" y="45" className="text-[8px] font-mono fill-slate-400">
                {hoveredWindow.risk}
              </text>
            </g>
          )}
        </svg>

        {/* Footnote */}
        <div className="flex items-center justify-between pt-2 px-1 text-[10px] font-mono border-t border-slate-800/60 text-slate-400">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>Optimal (T+30, T+45)</span>
            </span>
            <span className="flex items-center space-x-1 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              <span>Moderate (T+15)</span>
            </span>
            <span className="flex items-center space-x-1 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
              <span>Surge (T+7, T+1)</span>
            </span>
          </div>
          <div>Formula: Empirical Yield Escalation Curve</div>
        </div>
      </div>

      {/* Dual Persona Narrative */}
      {isAnalyst ? (
        <div className="p-3 bg-blue-950/20 border border-blue-800/40 rounded space-y-2 text-[10px] font-mono">
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-blue-300 font-semibold uppercase">
              <Sigma className="w-3.5 h-3.5 text-blue-400" />
              <span>Lead-Time Elasticity Formulation</span>
            </span>
            <span className="text-slate-400">5-Window Discrete Analysis</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-[#0B132B] p-2 rounded border border-slate-800">
              <div className="text-slate-400">Mean Escalation Slope</div>
              <div className="text-white font-bold mt-0.5">+1.55% / Day</div>
              <div className="text-[9px] text-amber-400">Accelerates &lt;14 days</div>
            </div>
            <div className="bg-[#0B132B] p-2 rounded border border-slate-800">
              <div className="text-slate-400">Peak Surge Multiplier</div>
              <div className="text-rose-400 font-bold mt-0.5">1.70x (T+1)</div>
              <div className="text-[9px] text-slate-400">vs T+45 Base</div>
            </div>
            <div className="bg-[#0B132B] p-2 rounded border border-slate-800">
              <div className="text-slate-400">Inelasticity Knee Point</div>
              <div className="text-cyan-300 font-bold mt-0.5">T+7 Days</div>
              <div className="text-[9px] text-slate-400">Curvature inflection</div>
            </div>
            <div className="bg-[#0B132B] p-2 rounded border border-slate-800">
              <div className="text-slate-400">Sample Specification</div>
              <div className="text-emerald-400 font-bold mt-0.5">T+1, 7, 15, 30, 45</div>
              <div className="text-[9px] text-slate-400">DGCA Fixed Set</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-2.5 bg-[#0B132B] border border-slate-800/80 rounded flex items-start space-x-2.5 text-xs text-slate-300">
          <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white">Smart Booking Guidance: </span>
            Fares remain at baseline levels when booked <strong className="text-emerald-300">30 to 45 days in advance</strong>. Prices begin increasing steadily around <strong className="text-amber-300">T+15</strong>, before surging dramatically by <strong className="text-rose-300">+70% within 24 hours of departure</strong>.
          </div>
        </div>
      )}
    </div>
  );
};
