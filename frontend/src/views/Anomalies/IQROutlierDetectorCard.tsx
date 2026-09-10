import React, { useState } from 'react';
import { Scale, MapPin } from 'lucide-react';

const CORRIDOR_PRESETS = [
  { route: 'DEL-BOM', name: 'Delhi ↔ Mumbai', base: 4500 },
  { route: 'DEL-BLR', name: 'Delhi ↔ Bengaluru', base: 5500 },
  { route: 'BOM-BLR', name: 'Mumbai ↔ Bengaluru', base: 4000 },
  { route: 'DEL-CCU', name: 'Delhi ↔ Kolkata', base: 3500 },
  { route: 'BOM-HYD', name: 'Mumbai ↔ Hyderabad', base: 4200 },
];

export const IQROutlierDetectorCard: React.FC = () => {
  const [selectedRoute, setSelectedRoute] = useState<string>('DEL-BOM');

  const corridor = CORRIDOR_PRESETS.find((c) => c.route === selectedRoute) || CORRIDOR_PRESETS[0];

  // Tukey IQR calculations
  const base = corridor.base;
  const q1 = base * 0.92;
  const q2 = base; // Median
  const q3 = base * 1.15;
  const iqr = q3 - q1;
  const lowerBound = Math.max(1500, q1 - 1.5 * iqr);
  const upperBound = q3 + 1.5 * iqr;
  const surgeThreshold = base * 1.30;

  return (
    <div className="cmd-card p-4 space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <Scale className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
            Tukey IQR Statistical Outlier Inspector
          </span>
        </div>

        {/* Route Selector */}
        <div className="flex items-center space-x-1 bg-[#070D1E] rounded border border-slate-800 p-0.5 text-[10px] font-mono">
          {CORRIDOR_PRESETS.map((c) => (
            <button
              key={c.route}
              onClick={() => setSelectedRoute(c.route)}
              className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                selectedRoute === c.route
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {c.route}
            </button>
          ))}
        </div>
      </div>

      {/* Corridor Summary Card */}
      <div className="p-2.5 bg-[#070D1E] rounded border border-slate-800 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center space-x-2">
          <MapPin className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-bold text-white">{corridor.route}</span>
          <span className="text-slate-400">({corridor.name})</span>
        </div>
        <div className="text-slate-300">
          Base Tariff: <strong className="text-cyan-300">₹{corridor.base.toLocaleString('en-IN')}</strong>
        </div>
      </div>

      {/* Metric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
        <div className="p-2 bg-[#070D1E] rounded border border-slate-800">
          <span className="text-slate-400">25th Percentile (Q₁)</span>
          <div className="text-xs font-bold text-slate-200 mt-0.5">₹{Math.round(q1).toLocaleString('en-IN')}</div>
          <span className="text-[9px] text-slate-500">-8% of Median</span>
        </div>

        <div className="p-2 bg-[#070D1E] rounded border border-slate-800">
          <span className="text-slate-400">50th Median (Q₂)</span>
          <div className="text-xs font-bold text-cyan-300 mt-0.5">₹{Math.round(q2).toLocaleString('en-IN')}</div>
          <span className="text-[9px] text-slate-500">Baseline Center</span>
        </div>

        <div className="p-2 bg-[#070D1E] rounded border border-slate-800">
          <span className="text-slate-400">75th Percentile (Q₃)</span>
          <div className="text-xs font-bold text-slate-200 mt-0.5">₹{Math.round(q3).toLocaleString('en-IN')}</div>
          <span className="text-[9px] text-slate-500">+15% of Median</span>
        </div>

        <div className="p-2 bg-[#070D1E] rounded border border-slate-800">
          <span className="text-slate-400">Interquartile Range</span>
          <div className="text-xs font-bold text-purple-300 mt-0.5">₹{Math.round(iqr).toLocaleString('en-IN')}</div>
          <span className="text-[9px] text-slate-500">IQR Spread (Q₃ - Q₁)</span>
        </div>
      </div>

      {/* Visual Range Spectrum */}
      <div className="p-3 bg-[#070D1E] rounded border border-slate-800 space-y-2 text-[10px] font-mono">
        <div className="flex items-center justify-between text-slate-400">
          <span>Tukey 1.5×IQR Decision Envelope</span>
          <span className="text-emerald-400 font-semibold">99.3% Normal Coverage</span>
        </div>

        <div className="h-3 w-full bg-slate-900 rounded-full relative overflow-hidden border border-slate-800">
          {/* Normalcy zone */}
          <div className="absolute left-[20%] right-[30%] top-0 bottom-0 bg-emerald-500/30 border-x border-emerald-500" />
          {/* Surge alert zone */}
          <div className="absolute right-0 top-0 bottom-0 w-[25%] bg-rose-500/30 border-l border-rose-500" />
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <div>
            <span className="text-[9px] text-slate-400">Lower Fence:</span>
            <div className="text-white font-bold">₹{Math.round(lowerBound).toLocaleString('en-IN')}</div>
          </div>
          <div className="text-center">
            <span className="text-[9px] text-amber-400 font-semibold">+30% Surge Trigger:</span>
            <div className="text-amber-300 font-bold">₹{Math.round(surgeThreshold).toLocaleString('en-IN')}</div>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-rose-400 font-semibold">Upper Fence:</span>
            <div className="text-rose-300 font-bold">₹{Math.round(upperBound).toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
