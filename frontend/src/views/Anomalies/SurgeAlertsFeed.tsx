import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2 
} from 'lucide-react';
import type { AnomalyRecord } from '../../api/types';

interface SurgeAlertsFeedProps {
  anomalies: AnomalyRecord[];
  loading: boolean;
  onRefresh: () => void;
}

export const SurgeAlertsFeed: React.FC<SurgeAlertsFeedProps> = ({
  anomalies,
  loading,
}) => {
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM'>('ALL');
  const [resolvedIds, setResolvedIds] = useState<Set<number>>(new Set());

  const handleToggleResolve = (id: number) => {
    setResolvedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filtered = anomalies.filter((a) => {
    if (severityFilter === 'ALL') return true;
    return a.severity === severityFilter;
  });

  return (
    <div className="cmd-card p-4 space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
              Live Fare Surge Alert Stream
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Real-time feed of detected price anomalies exceeding +30% baseline surge thresholds
          </p>
        </div>

        {/* Severity Filter Tabs */}
        <div className="flex items-center bg-[#070D1E] rounded border border-slate-800 p-0.5 text-[10px] font-mono">
          {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                severityFilter === sev
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Alert Feed Container */}
      <div className="space-y-2 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
        {loading ? (
          <div className="py-10 text-center text-xs font-mono text-slate-400">
            <span className="inline-block animate-spin mr-2">⟳</span>
            Querying anomaly records from PostgreSQL...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center bg-[#070D1E] rounded border border-slate-800 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto opacity-80" />
            <div className="text-xs font-mono font-bold text-slate-200">
              Active Surveillance Standby — Zero Critical Fare Surges
            </div>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto">
              All domestic trunk routes are currently tracking within acceptable Tukey IQR boundaries. The alert engine will automatically dispatch notifications if any quote spikes &gt;30% above baseline.
            </p>
          </div>
        ) : (
          filtered.map((item) => {
            const isResolved = resolvedIds.has(item.id) || item.status === 'RESOLVED';

            return (
              <div
                key={item.id}
                className={`p-3 rounded border transition-all ${
                  isResolved
                    ? 'bg-[#070D1E]/60 border-slate-800/50 opacity-60'
                    : item.severity === 'CRITICAL'
                    ? 'bg-rose-950/20 border-rose-800/60'
                    : item.severity === 'HIGH'
                    ? 'bg-amber-950/20 border-amber-800/60'
                    : 'bg-blue-950/20 border-blue-800/60'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white tracking-wide">{item.route}</span>
                    {item.carrier && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-cyan-300 font-semibold">
                        {item.carrier}
                      </span>
                    )}
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        item.severity === 'CRITICAL'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : item.severity === 'HIGH'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-blue-950 text-blue-300 border border-blue-800'
                      }`}
                    >
                      {item.severity}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-slate-400">
                      {new Date(item.detected_at).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <button
                      onClick={() => handleToggleResolve(item.id)}
                      className={`px-2 py-0.5 rounded text-[10px] transition-colors border ${
                        isResolved
                          ? 'bg-slate-800 border-slate-700 text-slate-300'
                          : 'bg-emerald-950/80 hover:bg-emerald-900 border-emerald-800 text-emerald-300'
                      }`}
                    >
                      {isResolved ? 'Resolved' : 'Acknowledge'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-800/60 text-[10px] font-mono">
                  <div>
                    <span className="text-slate-400">Recorded Fare:</span>
                    <div className="font-bold text-white text-xs">
                      ₹{item.fare.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Baseline Fare:</span>
                    <div className="text-slate-300">
                      ₹{item.baseline_fare.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Spike Magnitude:</span>
                    <div className="font-bold text-rose-400 text-xs">
                      +{item.spike_percent.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {item.notes && (
                  <div className="text-[9px] text-slate-400 mt-1.5 font-mono line-clamp-1">
                    {item.notes}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
