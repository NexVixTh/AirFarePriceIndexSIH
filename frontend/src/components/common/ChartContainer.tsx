import React from 'react';
import { Download, Layers, Info } from 'lucide-react';
import { LoadingSkeleton } from './LoadingSkeleton';
import { EmptyState } from './EmptyState';
import { ErrorAlert } from './ErrorAlert';
import { usePersona } from '../../context/PersonaContext';

export interface ChartContainerProps {
  title: string;
  subtitle?: string;
  timeRange?: string;
  onTimeRangeChange?: (range: string) => void;
  timeRangeOptions?: string[];
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMessage?: string;
  formula?: string;
  analystExplanation?: string;
  simpleExplanation?: string;
  sourceCitation?: string;
  onExportCSV?: () => void;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  subtitle,
  timeRange,
  onTimeRangeChange,
  timeRangeOptions = ['7D', '30D', '90D', '1Y', 'ALL'],
  loading = false,
  error = null,
  empty = false,
  emptyMessage,
  formula,
  analystExplanation,
  simpleExplanation,
  sourceCitation = 'MoSPI CPI Reference • DGCA Form 27A Passenger Traffic Proportions',
  onExportCSV,
  headerRight,
  children,
  className = '',
}) => {
  const { isAnalyst } = usePersona();

  return (
    <div className={`cmd-panel p-4 sm:p-5 flex flex-col space-y-3.5 ${className}`}>
      {/* Chart Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-[#1B2A4A]">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold font-mono text-white tracking-wide uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 pulse-blue" />
              <span>{title}</span>
            </h3>
            {formula && isAnalyst && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-blue-950/70 text-cyan-300 border border-cyan-500/30">
                Laspeyres Engine
              </span>
            )}
          </div>
          {subtitle && <p className="text-[11px] text-slate-400 font-sans">{subtitle}</p>}
        </div>

        {/* Action Controls: Time Range & Export */}
        <div className="flex items-center space-x-2 shrink-0">
          {timeRange && onTimeRangeChange && (
            <div className="flex items-center bg-[#101B39] p-0.5 rounded border border-[#1B2A4A] text-xs font-mono">
              {timeRangeOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => onTimeRangeChange(opt)}
                  className={`px-2 py-0.5 rounded transition-all ${
                    timeRange === opt
                      ? 'bg-blue-600 text-white font-bold shadow-glow-blue'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {headerRight}

          {onExportCSV && (
            <button
              onClick={onExportCSV}
              title="Export Chart Data as CSV"
              className="p-1.5 rounded bg-[#101B39] hover:bg-[#142247] border border-[#1B2A4A] text-slate-300 hover:text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Contextual Dual-Persona Explanation */}
      {isAnalyst && (formula || analystExplanation) ? (
        <div className="bg-[#080E20] border border-[#1B2A4A] rounded p-2.5 text-xs text-slate-300 space-y-1">
          {formula && (
            <div className="flex items-center space-x-2 font-mono">
              <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Formula:</span>
              <code className="bg-[#101B39] px-2 py-0.5 rounded border border-cyan-500/30 text-[11px] text-cyan-200 font-semibold">
                {formula}
              </code>
            </div>
          )}
          {analystExplanation && (
            <p className="text-slate-400 leading-relaxed text-[11px] font-sans">{analystExplanation}</p>
          )}
        </div>
      ) : (
        simpleExplanation && (
          <div className="bg-[#080E20] border border-[#1B2A4A] rounded p-2 text-xs text-slate-300 flex items-start space-x-2">
            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px] font-sans">{simpleExplanation}</p>
          </div>
        )
      )}

      {/* Main Chart Canvas Area */}
      <div className="min-h-[260px] flex-1 flex flex-col justify-center relative">
        {loading ? (
          <div className="space-y-3 py-6">
            <LoadingSkeleton className="h-52 w-full rounded bg-[#0B132B] border border-[#1B2A4A]" />
            <LoadingSkeleton className="h-5 w-1/3 rounded bg-[#0B132B] border border-[#1B2A4A]" />
          </div>
        ) : error ? (
          <ErrorAlert message={error} />
        ) : empty ? (
          <EmptyState
            title="Awaiting Data Points"
            description={emptyMessage || 'No index points exist for the current filter settings.'}
          />
        ) : (
          children
        )}
      </div>

      {/* Chart Footer: Official Source Line */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] font-mono text-slate-400 pt-2 border-t border-[#1B2A4A]/60">
        <span className="truncate">Ref: {sourceCitation}</span>
        <span className="shrink-0 text-cyan-400 font-semibold">DGCA Form 27A Scheduled Basket</span>
      </div>
    </div>
  );
};
