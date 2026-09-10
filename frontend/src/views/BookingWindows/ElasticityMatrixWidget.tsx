import React from 'react';
import { Activity, Gauge } from 'lucide-react';
import type { WindowMetric } from './LeadTimeCurveVisualizer';

interface ElasticityMatrixWidgetProps {
  windows: WindowMetric[];
}

export const ElasticityMatrixWidget: React.FC<ElasticityMatrixWidgetProps> = ({
  windows,
}) => {
  // Ordered from T+45 down to T+1
  const map = new Map(windows.map((w) => [w.window, w]));

  const w45 = map.get('T+45');
  const w30 = map.get('T+30');
  const w15 = map.get('T+15');
  const w7 = map.get('T+7');
  const w1 = map.get('T+1');

  const computeStep = (wFrom?: WindowMetric, wTo?: WindowMetric) => {
    if (!wFrom || !wTo) return { fareChangePct: 0, daysChangePct: 0, elasticity: 0 };
    const fareChangePct = ((wTo.expectedFare - wFrom.expectedFare) / wFrom.expectedFare) * 100;
    const daysChangePct = ((wFrom.advanceDays - wTo.advanceDays) / wFrom.advanceDays) * 100;
    const elasticity = daysChangePct !== 0 ? Math.abs(fareChangePct / daysChangePct) : 0;
    return { fareChangePct, daysChangePct, elasticity };
  };

  const step1 = computeStep(w45, w30);
  const step2 = computeStep(w30, w15);
  const step3 = computeStep(w15, w7);
  const step4 = computeStep(w7, w1);

  const TRANSITIONS = [
    {
      name: 'T+45 → T+30',
      phase: 'Early Bird Stability',
      fareChange: step1.fareChangePct,
      elasticity: step1.elasticity,
      status: 'Flat Parity',
      color: 'text-emerald-400',
      badgeBg: 'bg-emerald-950/60 border-emerald-800/60',
    },
    {
      name: 'T+30 → T+15',
      phase: 'Advance Firming',
      fareChange: step2.fareChangePct,
      elasticity: step2.elasticity,
      status: 'Moderate Firming',
      color: 'text-blue-400',
      badgeBg: 'bg-blue-950/60 border-blue-800/60',
    },
    {
      name: 'T+15 → T+7',
      phase: 'Tactical Escalation',
      fareChange: step3.fareChangePct,
      elasticity: step3.elasticity,
      status: 'Surge Acceleration',
      color: 'text-amber-400',
      badgeBg: 'bg-amber-950/60 border-amber-800/60',
    },
    {
      name: 'T+7 → T+1',
      phase: 'Last-Minute Inelastic',
      fareChange: step4.fareChangePct,
      elasticity: step4.elasticity,
      status: 'Peak Hyper-Surge',
      color: 'text-rose-400',
      badgeBg: 'bg-rose-950/60 border-rose-800/60',
    },
  ];

  return (
    <div className="cmd-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
            Lead-Time Elasticity Transition Matrix
          </span>
        </div>
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-950/80 text-purple-300 border border-purple-800/60">
          Marginal Price Velocity
        </span>
      </div>

      {/* Grid of Step-wise Elasticities */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
        {TRANSITIONS.map((t) => (
          <div key={t.name} className="p-3 bg-[#070D1E] rounded border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs">{t.name}</span>
              <span className={`px-1.5 py-0.2 rounded text-[9px] border font-semibold ${t.badgeBg} ${t.color}`}>
                {t.status}
              </span>
            </div>

            <div className="text-[10px] text-slate-400 font-normal">{t.phase}</div>

            <div className="flex items-baseline justify-between pt-1 border-t border-slate-800/60">
              <div>
                <span className="text-[9px] text-slate-400">Price Drift:</span>
                <div className={`font-bold ${t.color}`}>
                  {t.fareChange >= 0 ? `+${t.fareChange.toFixed(1)}%` : `${t.fareChange.toFixed(1)}%`}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[9px] text-slate-400">Elasticity (E):</span>
                <div className="font-bold text-white font-mono">{t.elasticity.toFixed(2)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Econometric Note */}
      <div className="p-2 bg-[#070D1E] rounded border border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <div className="flex items-center space-x-1.5">
          <Gauge className="w-3.5 h-3.5 text-cyan-400" />
          <span>Elasticity |E| &gt; 1.0 indicates high price sensitivity as departure date approaches.</span>
        </div>
        <div className="text-slate-400">DGCA Yield Formula</div>
      </div>
    </div>
  );
};
