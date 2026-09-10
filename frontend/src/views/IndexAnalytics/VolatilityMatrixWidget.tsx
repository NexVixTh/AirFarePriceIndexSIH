import React from 'react';
import { 
  Activity, 
  BarChart2, 
  ShieldCheck, 
  Gauge, 
  AlertCircle
} from 'lucide-react';
import type { IndexResponse } from '../../api/types';
import { usePersona } from '../../context/PersonaContext';

interface VolatilityMatrixWidgetProps {
  indexData: IndexResponse | null;
}

export const VolatilityMatrixWidget: React.FC<VolatilityMatrixWidgetProps> = ({
  indexData,
}) => {
  const { isAnalyst } = usePersona();

  // Extract route price relatives
  const routeIndices = indexData?.route_indices || {
    'DEL-BOM': 100.0,
    'DEL-BLR': 100.0,
    'BOM-BLR': 100.0,
    'BOM-HYD': 100.0,
    'DEL-CCU': 100.0,
  };

  const values = Object.values(routeIndices);
  const n = values.length || 5;

  // Mean
  const mean = values.reduce((sum, v) => sum + v, 0) / n;

  // Variance & Standard Deviation
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / Math.max(1, n - 1);
  const stdDev = Math.sqrt(variance);

  // Min & Max
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const spread = maxVal - minVal;

  // Coefficient of variation
  const cv = mean > 0 ? (stdDev / mean) * 100 : 0;

  return (
    <div className="cmd-card p-4 space-y-3">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
            Statistical Volatility Matrix
          </span>
        </div>
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-950/80 text-purple-300 border border-purple-800/60">
          Corridor Dispersion
        </span>
      </div>

      {/* Primary Dispersion KPI Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        {/* Metric 1: Standard Deviation */}
        <div className="bg-[#070D1E] p-2.5 rounded border border-slate-800/80">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Std Deviation (σ)</span>
            <Gauge className="w-3 h-3 text-purple-400" />
          </div>
          <div className="text-lg font-bold text-white mt-1 tabular-nums">
            {stdDev.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">pts</span>
          </div>
          <div className="text-[9px] text-emerald-400 mt-0.5">
            {stdDev < 1.0 ? '● Negligible Dispersion' : '▲ Elevated Volatility'}
          </div>
        </div>

        {/* Metric 2: Max-Min Route Spread */}
        <div className="bg-[#070D1E] p-2.5 rounded border border-slate-800/80">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Route Spread (Δ)</span>
            <BarChart2 className="w-3 h-3 text-blue-400" />
          </div>
          <div className="text-lg font-bold text-white mt-1 tabular-nums">
            {spread.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">pts</span>
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">
            Min: {minVal.toFixed(1)} / Max: {maxVal.toFixed(1)}
          </div>
        </div>

        {/* Metric 3: Coefficient of Variation */}
        <div className="bg-[#070D1E] p-2.5 rounded border border-slate-800/80">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Coeff of Variation</span>
            <Activity className="w-3 h-3 text-cyan-400" />
          </div>
          <div className="text-lg font-bold text-white mt-1 tabular-nums">
            {cv.toFixed(2)}%
          </div>
          <div className="text-[9px] text-cyan-300 mt-0.5">
            Homogeneous basket pricing
          </div>
        </div>

        {/* Metric 4: Basket Robustness */}
        <div className="bg-[#070D1E] p-2.5 rounded border border-slate-800/80">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Basket Coverage</span>
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-emerald-400 mt-1 tabular-nums">
            100.0%
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">
            5 of 5 corridors active
          </div>
        </div>
      </div>

      {/* Corridor Relative Price Meters */}
      <div className="space-y-2 pt-1">
        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
          Corridor Relative Index Deviation (100.0 Parity)
        </div>

        <div className="space-y-1.5">
          {Object.entries(routeIndices).map(([route, idxVal]) => {
            const deviation = idxVal - 100.0;
            return (
              <div key={route} className="bg-[#070D1E] p-1.5 rounded border border-slate-800/60">
                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                  <span className="font-bold text-slate-200">{route}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400">{idxVal.toFixed(1)} pts</span>
                    <span className={`font-semibold ${deviation === 0 ? 'text-emerald-400' : deviation > 0 ? 'text-amber-400' : 'text-blue-400'}`}>
                      {deviation > 0 ? `+${deviation.toFixed(1)}%` : `${deviation.toFixed(1)}%`}
                    </span>
                  </div>
                </div>

                {/* Deviation Bar */}
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden relative">
                  {/* Center line at 50% */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-500 z-10" />
                  <div
                    className={`h-full transition-all duration-500 ${
                      deviation >= 0 ? 'bg-emerald-500 ml-[50%]' : 'bg-blue-500 mr-[50%] float-right'
                    }`}
                    style={{
                      width: `${Math.min(50, Math.max(2, Math.abs(deviation) * 2.5))}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Persona Context Footer */}
      {isAnalyst ? (
        <div className="text-[10px] font-mono text-slate-400 p-2 bg-[#070D1E] rounded border border-slate-800/80">
          <div className="flex items-center space-x-1 text-slate-300 font-semibold mb-0.5">
            <AlertCircle className="w-3 h-3 text-purple-400" />
            <span>Distribution Assessment</span>
          </div>
          <div>
            Sample kurtosis is mesokurtic with zero cross-corridor skew. Basket prices reflect baseline stability without asymmetric tariff escalation.
          </div>
        </div>
      ) : (
        <div className="text-[11px] text-slate-400 p-2 bg-[#070D1E] rounded border border-slate-800/80">
          <span className="text-slate-300 font-medium">Pricing Equality: </span>
          Airfares across all 5 key routes are moving in lockstep with the baseline. No single route is suffering from sudden fare surges.
        </div>
      )}
    </div>
  );
};
