import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export interface ErrorAlertProps {
  title?: string;
  message: string;
  details?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  title = 'Data Retrieval Notice',
  message,
  details,
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`bg-red-950/40 border border-red-500/40 rounded-lg p-3 flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 text-red-200 shadow-panel ${className}`}
    >
      <div className="flex items-start space-x-2.5">
        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-red-300 font-mono">
            {title}
          </h4>
          <p className="text-xs text-red-200 leading-relaxed font-sans">{message}</p>
          {details && (
            <p className="text-[10px] font-mono text-red-400 bg-red-950/80 p-1.5 rounded border border-red-800/40 mt-1 break-all">
              {details}
            </p>
          )}
        </div>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-red-900/50 hover:bg-red-800/80 border border-red-500/50 rounded text-xs font-mono text-red-200 self-start sm:self-center transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
};
