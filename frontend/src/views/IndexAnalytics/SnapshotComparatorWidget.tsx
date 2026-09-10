import React, { useState } from 'react';
import { 
  GitCompare, 
  Camera, 
  Calendar, 
  Check, 
  RefreshCw, 
  Clock
} from 'lucide-react';
import type { IndexResponse, IndexHistoryItem } from '../../api/types';
import { api } from '../../api/client';

interface SnapshotComparatorWidgetProps {
  currentIndex: IndexResponse | null;
  history: IndexHistoryItem[];
  onSnapshotCreated?: () => void;
}

export const SnapshotComparatorWidget: React.FC<SnapshotComparatorWidgetProps> = ({
  currentIndex,
  history,
  onSnapshotCreated,
}) => {
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [captureSuccess, setCaptureSuccess] = useState<string | null>(null);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>('latest');

  // Trigger snapshot calculation
  const handleTriggerSnapshot = async () => {
    setIsCapturing(true);
    setCaptureSuccess(null);
    try {
      const res = await api.triggerIndexSnapshot(currentIndex?.base_period || '2024-01');
      setCaptureSuccess(`Snapshot #${res.snapshot_id} stored in PostgreSQL!`);
      if (onSnapshotCreated) {
        onSnapshotCreated();
      }
      setTimeout(() => setCaptureSuccess(null), 4000);
    } catch (err: unknown) {
      console.error('Failed capturing snapshot:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  // Base Period details
  const basePeriodStr = currentIndex?.base_period || '2024-01';
  const currentPeriodStr = currentIndex?.current_period || '2026-09';

  return (
    <div className="cmd-card p-4 space-y-3">
      {/* Header with trigger button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <GitCompare className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
            Temporal Snapshot Comparator
          </span>
        </div>

        <button
          onClick={handleTriggerSnapshot}
          disabled={isCapturing}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-mono transition-colors disabled:opacity-50 shadow-sm"
          title="Compute and persist a new index snapshot to PostgreSQL index_history"
        >
          {isCapturing ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Camera className="w-3.5 h-3.5" />
          )}
          <span>{isCapturing ? 'Persisting...' : 'Capture Snapshot'}</span>
        </button>
      </div>

      {captureSuccess && (
        <div className="p-2 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-[11px] font-mono flex items-center space-x-2">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{captureSuccess}</span>
        </div>
      )}

      {/* Snapshot Selector Toolbar */}
      <div className="flex items-center justify-between gap-2 p-2 bg-[#070D1E] rounded border border-slate-800/60 text-[11px] font-mono">
        <div className="flex items-center space-x-1.5 text-slate-400">
          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          <span>Compare Against:</span>
        </div>
        <select
          value={selectedSnapshotId}
          onChange={(e) => setSelectedSnapshotId(e.target.value)}
          className="bg-[#0B132B] border border-slate-700 text-slate-200 rounded px-2 py-0.5 text-[11px] font-mono focus:outline-none focus:border-blue-500"
        >
          <option value="latest">Latest Snapshot (Current)</option>
          {history.map((item) => (
            <option key={item.id} value={item.id.toString()}>
              Snapshot #{item.id} — {new Date(item.calculated_at).toLocaleDateString('en-IN')} ({item.national_index.toFixed(1)})
            </option>
          ))}
        </select>
      </div>

      {/* Side-by-side Dual Period Matrix */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        {/* Left Column: Reference Period */}
        <div className="bg-[#070D1E] p-3 rounded border border-slate-800 space-y-2">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Base Anchor (t₀)</span>
            <span className="px-1 py-0.2 rounded bg-slate-800 text-[9px] text-slate-300">FIXED</span>
          </div>
          <div className="text-xl font-bold font-mono text-white tabular-nums">
            100.0 <span className="text-[10px] text-slate-400 font-normal">pts</span>
          </div>
          <div className="text-[10px] text-slate-400 space-y-0.5 border-t border-slate-800/80 pt-1.5">
            <div>Period: <strong className="text-slate-300">{basePeriodStr}</strong></div>
            <div>Weights: <span className="text-blue-300">DGCA Scheduled</span></div>
            <div>Basket: <span className="text-slate-300">5 Top Trunks</span></div>
          </div>
        </div>

        {/* Right Column: Observation Period */}
        <div className="bg-[#070D1E] p-3 rounded border border-cyan-900/40 space-y-2">
          <div className="text-[10px] text-cyan-400 uppercase tracking-wider flex items-center justify-between">
            <span>Observed (t₁)</span>
            <span className="px-1 py-0.2 rounded bg-cyan-950/80 text-[9px] text-cyan-300 border border-cyan-800/60">LIVE</span>
          </div>
          <div className="text-xl font-bold font-mono text-cyan-300 tabular-nums">
            {currentIndex?.national_index ? currentIndex.national_index.toFixed(1) : '100.0'}{' '}
            <span className="text-[10px] text-slate-400 font-normal">pts</span>
          </div>
          <div className="text-[10px] text-slate-400 space-y-0.5 border-t border-slate-800/80 pt-1.5">
            <div>Period: <strong className="text-cyan-200">{currentPeriodStr}</strong></div>
            <div>Net Shift: <span className="text-emerald-400 font-bold">0.00 pts (0.0%)</span></div>
            <div>Status: <span className="text-emerald-400">Parity Baseline</span></div>
          </div>
        </div>
      </div>

      {/* Snapshot Provenance History Audit Log */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider">
          <span>Persisted DB History Log</span>
          <span>{history.length} Records</span>
        </div>

        <div className="max-h-36 overflow-y-auto space-y-1 custom-scrollbar">
          {history.length === 0 ? (
            <div className="text-[11px] font-mono text-slate-500 p-2 text-center bg-[#070D1E] rounded border border-slate-800">
              No historical snapshots persisted yet. Click &quot;Capture Snapshot&quot; to write one.
            </div>
          ) : (
            history.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between p-2 rounded bg-[#070D1E] border border-slate-800/80 hover:border-slate-700 text-[10px] font-mono transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Clock className="w-3 h-3 text-blue-400 flex-shrink-0" />
                  <div>
                    <span className="text-slate-200 font-bold">Snapshot #{h.id}</span>
                    <span className="text-slate-500 ml-1.5">
                      {new Date(h.calculated_at).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-slate-400">{h.base_period} → {h.current_period}</span>
                  <span className="font-bold text-white bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-900/60">
                    {h.national_index.toFixed(1)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
