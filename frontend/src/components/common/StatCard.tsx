import React from 'react';
import { HelpCircle, Layers } from 'lucide-react';
import { DeltaIndicator } from './DeltaIndicator';
import { LoadingSkeleton } from './LoadingSkeleton';
import { usePersona } from '../../context/PersonaContext';

export interface StatCardProps {
  title: string;
  value: string | number | null | undefined;
  unit?: string;
  subtext?: string;
  delta?: {
    value: number | null | undefined;
    label?: string;
    direction?: 'up' | 'down' | 'neutral';
    invertColors?: boolean;
  };
  tooltip?: string;
  badge?: string;
  icon?: React.ReactNode;
  status?: 'normal' | 'warning' | 'alert' | 'success';
  loading?: boolean;
  analystNote?: string;
  formula?: string;
  sourceCitation?: string;
  variant?: 'default' | 'hero' | 'compact';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit = '',
  subtext,
  delta,
  tooltip,
  badge,
  icon,
  loading = false,
  analystNote,
  formula,
  sourceCitation,
  variant = 'default',
  className = '',
}) => {
  const { isAnalyst } = usePersona();

  if (loading) {
    return <LoadingSkeleton className="h-28 w-full rounded-lg bg-[#0B132B] border border-[#1B2A4A]" />;
  }

  const isValueAvailable = value !== null && value !== undefined && value !== '';

  return (
    <div
      className={`cmd-panel p-4 flex flex-col justify-between group hover:border-[#2A3F6D] transition-all ${className}`}
    >
      <div>
        {/* Header: Title, Tooltip & Badges */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center space-x-1.5 truncate">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider truncate">
              {title}
            </span>
            {tooltip && (
              <span title={tooltip} className="cursor-help text-slate-400 hover:text-blue-400">
                <HelpCircle className="w-3 h-3" />
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            {badge && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#101B39] text-cyan-300 border border-cyan-500/30">
                {badge}
              </span>
            )}
            {icon && <span className="text-slate-400">{icon}</span>}
          </div>
        </div>

        {/* Primary Large Tabular Value */}
        <div className="flex items-baseline space-x-2 my-1">
          {isValueAvailable ? (
            <>
              <span
                className={`font-bold font-mono text-white tabular-nums tracking-tight ${
                  variant === 'hero' ? 'text-3xl sm:text-4xl text-blue-400' : 'text-2xl sm:text-3xl'
                }`}
              >
                {value}
              </span>
              {unit && <span className="text-xs text-slate-400 font-mono">{unit}</span>}
            </>
          ) : (
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-600/40">
              Awaiting Ingestion
            </span>
          )}

          {/* Delta Indicator */}
          {delta && isValueAvailable && (
            <div className="flex items-center space-x-1 ml-1">
              <DeltaIndicator
                value={delta.value}
                invertColors={delta.invertColors}
              />
              {delta.label && (
                <span className="text-[10px] text-slate-400 font-mono">({delta.label})</span>
              )}
            </div>
          )}
        </div>

        {/* Subtext or Analyst Formula Annotation */}
        {isAnalyst && (formula || analystNote) ? (
          <div className="mt-2 pt-1.5 border-t border-[#1B2A4A] text-[11px] font-mono text-slate-300 space-y-1 bg-[#080E20] p-2 rounded border border-[#1B2A4A]">
            {formula && (
              <div className="flex items-center space-x-1.5 text-blue-400 font-semibold">
                <Layers className="w-3 h-3 text-blue-400 shrink-0" />
                <code className="bg-[#101B39] px-1.5 py-0.5 rounded border border-blue-500/30 text-[10px] text-cyan-300">
                  {formula}
                </code>
              </div>
            )}
            {analystNote && <p className="text-slate-400 leading-snug text-[10px]">{analystNote}</p>}
          </div>
        ) : (
          subtext && <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{subtext}</p>
        )}
      </div>

      {/* Source Citation */}
      {sourceCitation && (
        <div className="text-[9px] font-mono text-slate-400 truncate mt-2.5 pt-1.5 border-t border-[#1B2A4A]/60 flex items-center justify-between">
          <span className="truncate">Ref: {sourceCitation}</span>
        </div>
      )}
    </div>
  );
};
