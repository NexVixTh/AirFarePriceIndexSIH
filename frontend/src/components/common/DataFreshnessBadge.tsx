import React from 'react';
import { Clock, RefreshCw } from 'lucide-react';

export interface DataFreshnessBadgeProps {
  lastUpdated?: string | Date | null;
  status?: 'live' | 'delayed' | 'offline' | 'awaiting';
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

export const DataFreshnessBadge: React.FC<DataFreshnessBadgeProps> = ({
  lastUpdated,
  status = 'live',
  onRefresh,
  isRefreshing = false,
  className = '',
}) => {
  const formatTime = (ts: string | Date | null | undefined): string => {
    if (!ts) return 'Awaiting Batch';
    try {
      const date = typeof ts === 'string' ? new Date(ts) : ts;
      if (isNaN(date.getTime())) return String(ts);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'N/A';
    }
  };

  const statusConfig = {
    live: {
      dot: 'bg-emerald-400 pulse-emerald animate-pulse',
      text: 'text-emerald-400',
      label: 'LIVE SERIES',
    },
    delayed: {
      dot: 'bg-amber-400 pulse-saffron',
      text: 'text-amber-400',
      label: 'BATCH DELAYED',
    },
    offline: {
      dot: 'bg-red-400',
      text: 'text-red-400',
      label: 'FEED OFFLINE',
    },
    awaiting: {
      dot: 'bg-slate-400',
      text: 'text-slate-400',
      label: 'AWAITING INGESTION',
    },
  };

  const currentStatus = statusConfig[status] || statusConfig.live;

  return (
    <div
      className={`inline-flex items-center space-x-2 px-2.5 py-1 rounded bg-[#101B39] border border-[#1B2A4A] text-xs font-mono ${className}`}
    >
      <div className="flex items-center space-x-1.5">
        <span className={`w-2 h-2 rounded-full ${currentStatus.dot}`} />
        <span className={`text-[10px] font-bold tracking-wider ${currentStatus.text}`}>
          {currentStatus.label}
        </span>
      </div>

      <span className="text-slate-600">|</span>

      <div className="flex items-center space-x-1 text-slate-300 text-[11px]">
        <Clock className="w-3 h-3 text-slate-400" />
        <span>{formatTime(lastUpdated)}</span>
      </div>

      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh Data Telemetry"
          className="p-1 hover:bg-[#142247] rounded text-slate-400 hover:text-white transition-colors disabled:opacity-40"
        >
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      )}
    </div>
  );
};
