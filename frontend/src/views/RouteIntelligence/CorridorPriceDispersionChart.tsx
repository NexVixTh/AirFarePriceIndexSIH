import React from 'react';
import { BarChart3, TrendingUp, HelpCircle } from 'lucide-react';

export interface RouteCorridorItem {
  route: string;
  name: string;
  originCity: string;
  destCity: string;
  dgcaWeight: number; // e.g. 0.18
  isBasketRoute: boolean;
  baseFare: number;
  currentFare: number;
  relative: number;
  quoteCount: number;
  category: 'Metro-Metro' | 'Metro-Tier2';
}

interface CorridorPriceDispersionChartProps {
  corridors: RouteCorridorItem[];
  selectedRoute: string | null;
  onSelectRoute: (route: string) => void;
}

export const CorridorPriceDispersionChart: React.FC<CorridorPriceDispersionChartProps> = ({
  corridors,
  selectedRoute,
  onSelectRoute,
}) => {
  // Sort by DGCA weight descending
  const sorted = [...corridors].sort((a, b) => b.dgcaWeight - a.dgcaWeight);
  const maxWeight = Math.max(...sorted.map((c) => c.dgcaWeight), 0.2);

  return (
    <div className="cmd-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
            Corridor Weight & Fare Dispersion
          </span>
        </div>
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
          DGCA Passenger Volume Rank
        </span>
      </div>

      {/* Horizontal Bar Chart */}
      <div className="space-y-2 pt-1">
        {sorted.map((c) => {
          const isSelected = selectedRoute === c.route;
          const weightPercent = c.dgcaWeight * 100;
          const barWidth = (c.dgcaWeight / maxWeight) * 100;

          return (
            <div
              key={c.route}
              onClick={() => onSelectRoute(c.route)}
              className={`p-2 rounded cursor-pointer transition-all border ${
                isSelected
                  ? 'bg-blue-950/40 border-blue-500 shadow-md'
                  : 'bg-[#070D1E] border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/30'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white tracking-wide">{c.route}</span>
                  <span className="text-[10px] text-slate-400">({c.originCity} ↔ {c.destCity})</span>
                  {c.isBasketRoute && (
                    <span className="px-1 py-0.2 rounded text-[8px] font-mono bg-blue-950 text-blue-300 border border-blue-800/60">
                      BASKET
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-[10px] text-slate-400">
                    Base: <strong className="text-slate-200">₹{c.baseFare.toLocaleString('en-IN')}</strong>
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-cyan-300 font-semibold tabular-nums">
                    {weightPercent.toFixed(1)}% Share
                  </span>
                </div>
              </div>

              {/* Progress Bar of Weight */}
              <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    c.isBasketRoute
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
                      : 'bg-gradient-to-r from-slate-600 to-slate-400'
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-2 bg-[#070D1E] rounded border border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <div className="flex items-center space-x-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
          <span>Click any corridor to inspect granular statistical percentiles and outlier IQR bounds.</span>
        </div>
        <div className="flex items-center space-x-1 text-slate-500">
          <HelpCircle className="w-3 h-3" />
          <span>DGCA Official Traffic Share</span>
        </div>
      </div>
    </div>
  );
};
