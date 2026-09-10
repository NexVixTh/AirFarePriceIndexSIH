import React from 'react';

export interface InflationFilters {
  basePeriod: string;
  comparisonPeriod: string;
  route: string;
  carrier: string;
  bookingWindow: string;
}

interface InflationControlPanelProps {
  filters: InflationFilters;
  onChangeFilters: (filters: InflationFilters) => void;
  availableRoutes: string[];
  availableCarriers: { code: string; name: string }[];
}

const PERIOD_OPTIONS = [
  { value: '2023-03', label: 'March 2023 (FY23 Year-End)' },
  { value: '2023-06', label: 'June 2023 (Summer Peak)' },
  { value: '2023-09', label: 'September 2023 (Q2 Post-Monsoon)' },
  { value: '2023-12', label: 'December 2023 (Winter Festive)' },
  { value: '2024-01', label: 'January 2024 (Official Base)' },
  { value: '2024-03', label: 'March 2024 (FY24 Year-End)' },
  { value: '2024-06', label: 'June 2024 (Summer Holiday)' },
  { value: '2024-09', label: 'September 2024 (Q2 End)' },
  { value: '2024-12', label: 'December 2024 (Latest Closed)' },
];

export const InflationControlPanel: React.FC<InflationControlPanelProps> = ({
  filters,
  onChangeFilters,
  availableRoutes,
  availableCarriers,
}) => {
  const handlePreset = (base: string, comp: string) => {
    onChangeFilters({
      ...filters,
      basePeriod: base,
      comparisonPeriod: comp,
    });
  };

  return (
    <div className="bg-[#0B132B] border border-[#1B2A4A] rounded-xl p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1B2A4A]/60">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-wide uppercase flex items-center gap-2">
            <span>⚙️</span>
            <span>Inflation Simulation & Rebase Controls</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure reference periods, corridors, and carrier segments to compute customized airfare inflation rates.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase text-slate-400 font-mono mr-1">Presets:</span>
          <button
            onClick={() => handlePreset('2024-01', '2024-12')}
            className="px-2.5 py-1 text-xs bg-[#060A13] hover:bg-[#1B2A4A] text-blue-300 border border-blue-500/30 rounded font-mono transition"
          >
            YoY 2024
          </button>
          <button
            onClick={() => handlePreset('2024-06', '2024-12')}
            className="px-2.5 py-1 text-xs bg-[#060A13] hover:bg-[#1B2A4A] text-slate-300 border border-[#1B2A4A] rounded font-mono transition"
          >
            H2 2024
          </button>
          <button
            onClick={() => handlePreset('2024-09', '2024-12')}
            className="px-2.5 py-1 text-xs bg-[#060A13] hover:bg-[#1B2A4A] text-slate-300 border border-[#1B2A4A] rounded font-mono transition"
          >
            QoQ (Q3→Q4)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
        {/* Base Month Selector */}
        <div>
          <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
            Base Period (I₀ = 100.0)
          </label>
          <select
            value={filters.basePeriod}
            onChange={(e) => onChangeFilters({ ...filters, basePeriod: e.target.value })}
            className="w-full bg-[#060A13] border border-[#1B2A4A] text-xs text-white rounded-lg p-2 focus:outline-none focus:border-blue-500 font-mono"
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.value} — {opt.label.split('(')[1]?.replace(')', '') || opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Comparison Month Selector */}
        <div>
          <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
            Comparison Period (I_t)
          </label>
          <select
            value={filters.comparisonPeriod}
            onChange={(e) => onChangeFilters({ ...filters, comparisonPeriod: e.target.value })}
            className="w-full bg-[#060A13] border border-[#1B2A4A] text-xs text-white rounded-lg p-2 focus:outline-none focus:border-blue-500 font-mono"
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.value} — {opt.label.split('(')[1]?.replace(')', '') || opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Route Filter */}
        <div>
          <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
            Corridor / Route
          </label>
          <select
            value={filters.route}
            onChange={(e) => onChangeFilters({ ...filters, route: e.target.value })}
            className="w-full bg-[#060A13] border border-[#1B2A4A] text-xs text-white rounded-lg p-2 focus:outline-none focus:border-blue-500 font-mono"
          >
            <option value="ALL">ALL — National Basket (11 Routes)</option>
            {availableRoutes.map((r) => (
              <option key={r} value={r}>
                {r} Corridor
              </option>
            ))}
          </select>
        </div>

        {/* Carrier Filter */}
        <div>
          <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
            Airline Carrier
          </label>
          <select
            value={filters.carrier}
            onChange={(e) => onChangeFilters({ ...filters, carrier: e.target.value })}
            className="w-full bg-[#060A13] border border-[#1B2A4A] text-xs text-white rounded-lg p-2 focus:outline-none focus:border-blue-500 font-mono"
          >
            <option value="ALL">ALL — All Carriers</option>
            {availableCarriers.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>

        {/* Booking Window Filter */}
        <div>
          <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
            Booking Window
          </label>
          <select
            value={filters.bookingWindow}
            onChange={(e) => onChangeFilters({ ...filters, bookingWindow: e.target.value })}
            className="w-full bg-[#060A13] border border-[#1B2A4A] text-xs text-white rounded-lg p-2 focus:outline-none focus:border-blue-500 font-mono"
          >
            <option value="ALL">ALL — Multi-Window Basket</option>
            <option value="T+1">T+1 (Emergency / Next Day)</option>
            <option value="T+7">T+7 (Weekly Business)</option>
            <option value="T+15">T+15 (Mid-Range Purchase)</option>
            <option value="T+30">T+30 (Standard Leisure)</option>
            <option value="T+45">T+45 (Early Bird Booking)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
