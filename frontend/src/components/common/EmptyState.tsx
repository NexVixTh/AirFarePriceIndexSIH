import React from 'react';
import { Database, Inbox } from 'lucide-react';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  statusBadge?: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Data Available',
  description = 'No observations recorded for the specified criteria. Check route and date selections.',
  icon,
  actionLabel,
  onAction,
  statusBadge = 'Awaiting Ingestion',
  className = '',
}) => {
  return (
    <div
      className={`border border-dashed border-[#1B2A4A] rounded-lg p-6 flex flex-col items-center justify-center text-center bg-[#070D1C] space-y-2.5 ${className}`}
    >
      <div className="w-10 h-10 rounded-full bg-[#101B39] border border-[#1B2A4A] flex items-center justify-center text-slate-400">
        {icon || <Inbox className="w-5 h-5 text-slate-400" />}
      </div>

      <div className="space-y-1 max-w-md">
        <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded bg-amber-950/60 border border-amber-600/40 text-[10px] font-mono text-amber-300 mb-0.5">
          <Database className="w-3 h-3 text-amber-400" />
          <span>{statusBadge}</span>
        </div>
        <h4 className="text-xs font-bold font-mono uppercase text-slate-200">{title}</h4>
        <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{description}</p>
      </div>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-3 py-1 bg-[#101B39] hover:bg-[#142247] border border-[#1B2A4A] rounded text-xs font-mono text-white transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
