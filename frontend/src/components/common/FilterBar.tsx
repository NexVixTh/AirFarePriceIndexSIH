import React from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';

export interface FilterState {
  route: string;
  airline: string;
  bookingWindow: string;
  baseMonth: string;
}

export interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onReset: () => void;
  routeOptions?: { code: string; label: string }[];
  airlineOptions?: { code: string; name: string }[];
  windowOptions?: { code: string; label: string }[];
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  routeOptions = [
    { code: 'ALL', label: 'All Top 20 Routes' },
    { code: 'DEL-BOM', label: 'DEL ⇄ BOM' },
    { code: 'BOM-BLR', label: 'BOM ⇄ BLR' },
    { code: 'DEL-BLR', label: 'DEL ⇄ BLR' },
    { code: 'DEL-CCU', label: 'DEL ⇄ CCU' },
    { code: 'BOM-MAA', label: 'BOM ⇄ MAA' },
  ],
  airlineOptions = [
    { code: 'ALL', name: 'All Airlines' },
    { code: '6E', name: 'IndiGo' },
    { code: 'AI', name: 'Air India' },
    { code: 'SG', name: 'SpiceJet' },
    { code: 'QP', name: 'Akasa Air' },
  ],
  windowOptions = [
    { code: 'ALL', label: 'All Windows' },
    { code: 'T1', label: 'T-1 Day' },
    { code: 'T3', label: 'T-3 Days' },
    { code: 'T7', label: 'T-7 Days' },
    { code: 'T14', label: 'T-14 Days' },
    { code: 'T30', label: 'T-30 Days' },
  ],
  className = '',
}) => {
  const activeCount = Object.entries(filters).filter(([k, v]) => {
    if (k === 'baseMonth') return v !== '2024-01';
    return v !== 'ALL' && v !== '';
  }).length;

  return (
    <div
      className={`cmd-panel p-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs ${className}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center space-x-1.5 text-slate-400 font-mono text-[11px] px-2 py-1 bg-[#101B39] rounded border border-[#1B2A4A]">
          <Filter className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-bold tracking-wider uppercase">Filter</span>
          {activeCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] flex items-center justify-center font-bold">
              {activeCount}
            </span>
          )}
        </div>

        {/* Route Dropdown */}
        <div className="relative inline-flex items-center bg-[#101B39] hover:bg-[#142247] border border-[#1B2A4A] rounded px-2.5 py-1 transition-colors">
          <span className="text-slate-400 text-[10px] font-mono mr-1.5 uppercase">Route:</span>
          <select
            value={filters.route}
            onChange={(e) => onFilterChange('route', e.target.value)}
            className="bg-transparent text-white text-xs font-mono font-medium focus:outline-none cursor-pointer pr-4 appearance-none"
          >
            {routeOptions.map((r) => (
              <option key={r.code} value={r.code} className="bg-[#0B132B] text-white">
                {r.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 pointer-events-none" />
        </div>

        {/* Carrier Dropdown */}
        <div className="relative inline-flex items-center bg-[#101B39] hover:bg-[#142247] border border-[#1B2A4A] rounded px-2.5 py-1 transition-colors">
          <span className="text-slate-400 text-[10px] font-mono mr-1.5 uppercase">Carrier:</span>
          <select
            value={filters.airline}
            onChange={(e) => onFilterChange('airline', e.target.value)}
            className="bg-transparent text-white text-xs font-mono font-medium focus:outline-none cursor-pointer pr-4 appearance-none"
          >
            {airlineOptions.map((a) => (
              <option key={a.code} value={a.code} className="bg-[#0B132B] text-white">
                {a.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 pointer-events-none" />
        </div>

        {/* Window Dropdown */}
        <div className="relative inline-flex items-center bg-[#101B39] hover:bg-[#142247] border border-[#1B2A4A] rounded px-2.5 py-1 transition-colors">
          <span className="text-slate-400 text-[10px] font-mono mr-1.5 uppercase">Window:</span>
          <select
            value={filters.bookingWindow}
            onChange={(e) => onFilterChange('bookingWindow', e.target.value)}
            className="bg-transparent text-white text-xs font-mono font-medium focus:outline-none cursor-pointer pr-4 appearance-none"
          >
            {windowOptions.map((w) => (
              <option key={w.code} value={w.code} className="bg-[#0B132B] text-white">
                {w.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 pointer-events-none" />
        </div>

        {/* Base Period Dropdown */}
        <div className="relative inline-flex items-center bg-[#101B39] hover:bg-[#142247] border border-[#1B2A4A] rounded px-2.5 py-1 transition-colors">
          <span className="text-slate-400 text-[10px] font-mono mr-1.5 uppercase">Base:</span>
          <select
            value={filters.baseMonth}
            onChange={(e) => onFilterChange('baseMonth', e.target.value)}
            className="bg-transparent text-white text-xs font-mono font-medium focus:outline-none cursor-pointer pr-4 appearance-none"
          >
            <option value="2024-01" className="bg-[#0B132B] text-white">2024-01 (MoSPI Base)</option>
            <option value="2024-02" className="bg-[#0B132B] text-white">2024-02</option>
            <option value="2024-03" className="bg-[#0B132B] text-white">2024-03</option>
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 pointer-events-none" />
        </div>
      </div>

      {/* Clear Filters Action */}
      {activeCount > 0 && (
        <button
          onClick={onReset}
          className="inline-flex items-center space-x-1 text-slate-300 hover:text-white text-xs font-mono px-2 py-1 rounded bg-[#101B39] hover:bg-slate-800 border border-[#1B2A4A] transition-colors"
        >
          <X className="w-3 h-3 text-amber-400" />
          <span>Reset Filters</span>
        </button>
      )}
    </div>
  );
};
