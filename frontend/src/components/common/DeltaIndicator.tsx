import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export interface DeltaIndicatorProps {
  value: number | null | undefined;
  type?: 'percent' | 'points' | 'currency';
  prefix?: string;
  suffix?: string;
  invertColors?: boolean; // If true, up is red/amber (spike) and down is emerald (cheaper)
  asBadge?: boolean;
  className?: string;
}

export const DeltaIndicator: React.FC<DeltaIndicatorProps> = ({
  value,
  type = 'percent',
  prefix = '',
  suffix = '',
  invertColors = false,
  asBadge = true,
  className = '',
}) => {
  if (value === null || value === undefined || isNaN(value)) {
    return <span className={`text-slate-400 text-xs font-mono ${className}`}>—</span>;
  }

  const isZero = Math.abs(value) < 0.001;
  const isPositive = value > 0;

  // Visual semantics for command center:
  let styleClass = '';
  if (isZero) {
    styleClass = asBadge 
      ? 'text-slate-400 bg-[#101B39] border-[#1B2A4A]' 
      : 'text-slate-400';
  } else if (invertColors) {
    styleClass = isPositive 
      ? (asBadge ? 'text-amber-400 bg-amber-950/60 border-amber-600/40' : 'text-amber-400')
      : (asBadge ? 'text-emerald-400 bg-emerald-950/60 border-emerald-600/40' : 'text-emerald-400');
  } else {
    styleClass = isPositive 
      ? (asBadge ? 'text-emerald-400 bg-emerald-950/60 border-emerald-600/40' : 'text-emerald-400')
      : (asBadge ? 'text-red-400 bg-red-950/60 border-red-600/40' : 'text-red-400');
  }

  const formattedValue = Math.abs(value).toFixed(2);
  const displaySuffix = suffix || (type === 'percent' ? '%' : type === 'points' ? ' pts' : '');
  const displaySign = isZero ? '' : isPositive ? '+' : '-';

  return (
    <span
      className={`inline-flex items-center space-x-0.5 font-mono text-xs font-semibold ${
        asBadge ? 'px-1.5 py-0.5 rounded border' : ''
      } ${styleClass} ${className}`}
    >
      {isZero ? (
        <Minus className="w-3 h-3 text-slate-400" />
      ) : isPositive ? (
        <ArrowUpRight className="w-3.5 h-3.5" />
      ) : (
        <ArrowDownRight className="w-3.5 h-3.5" />
      )}
      <span className="tabular-nums">
        {displaySign}
        {prefix}
        {formattedValue}
        {displaySuffix}
      </span>
    </span>
  );
};
