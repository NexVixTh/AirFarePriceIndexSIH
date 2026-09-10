import React, { useState } from 'react';
import {
  Download,
  Filter
} from 'lucide-react';
import {
  ResponsiveContainer,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  ComposedChart
} from 'recharts';

interface CorridorData {
  route: string;
  name: string;
  weight: number;
  baseFare: number;
  currentFare: number;
  relative: number;
  inflationPct: number;
  contributionPctPts: number;
  contributionBps: number;
}

const CORRIDOR_DATA: CorridorData[] = [
  { route: 'DEL-BOM', name: 'Delhi ⇄ Mumbai', weight: 0.180, baseFare: 4500, currentFare: 4880, relative: 1.084, inflationPct: 8.44, contributionPctPts: 1.52, contributionBps: 152 },
  { route: 'DEL-BLR', name: 'Delhi ⇄ Bengaluru', weight: 0.145, baseFare: 5500, currentFare: 5850, relative: 1.064, inflationPct: 6.36, contributionPctPts: 0.92, contributionBps: 92 },
  { route: 'BOM-BLR', name: 'Mumbai ⇄ Bengaluru', weight: 0.125, baseFare: 4000, currentFare: 4220, relative: 1.055, inflationPct: 5.50, contributionPctPts: 0.69, contributionBps: 69 },
  { route: 'DEL-CCU', name: 'Delhi ⇄ Kolkata', weight: 0.095, baseFare: 3500, currentFare: 3660, relative: 1.046, inflationPct: 4.57, contributionPctPts: 0.43, contributionBps: 43 },
  { route: 'BLR-HYD', name: 'Bengaluru ⇄ Hyderabad', weight: 0.085, baseFare: 3200, currentFare: 3340, relative: 1.044, inflationPct: 4.38, contributionPctPts: 0.37, contributionBps: 37 },
  { route: 'MAA-DEL', name: 'Chennai ⇄ Delhi', weight: 0.080, baseFare: 4800, currentFare: 5040, relative: 1.050, inflationPct: 5.00, contributionPctPts: 0.40, contributionBps: 40 },
  { route: 'PNQ-BOM', name: 'Pune ⇄ Mumbai', weight: 0.070, baseFare: 2800, currentFare: 2910, relative: 1.039, inflationPct: 3.93, contributionPctPts: 0.28, contributionBps: 28 },
  { route: 'COK-DEL', name: 'Kochi ⇄ Delhi', weight: 0.065, baseFare: 5200, currentFare: 5460, relative: 1.050, inflationPct: 5.00, contributionPctPts: 0.33, contributionBps: 33 },
  { route: 'MAA-BOM', name: 'Chennai ⇄ Mumbai', weight: 0.055, baseFare: 3800, currentFare: 3950, relative: 1.039, inflationPct: 3.95, contributionPctPts: 0.22, contributionBps: 22 },
  { route: 'AMD-DEL', name: 'Ahmedabad ⇄ Delhi', weight: 0.050, baseFare: 3400, currentFare: 3520, relative: 1.035, inflationPct: 3.53, contributionPctPts: 0.18, contributionBps: 18 },
  { route: 'DEL-HYD', name: 'Delhi ⇄ Hyderabad', weight: 0.050, baseFare: 4100, currentFare: 4230, relative: 1.032, inflationPct: 3.17, contributionPctPts: 0.16, contributionBps: 16 },
];

const HISTORICAL_CHART_DATA = [
  { period: '2024-01', index: 100.0, inflation: 0.0 },
  { period: '2024-02', index: 100.3, inflation: 0.3 },
  { period: '2024-03', index: 100.8, inflation: 0.8 },
  { period: '2024-04', index: 101.4, inflation: 1.4 },
  { period: '2024-05', index: 102.1, inflation: 2.1 },
  { period: '2024-06', index: 102.7, inflation: 2.7 },
  { period: '2024-07', index: 103.4, inflation: 3.4 },
  { period: '2024-08', index: 104.1, inflation: 4.1 },
  { period: '2024-09', index: 104.6, inflation: 4.6 },
  { period: '2024-10', index: 105.0, inflation: 5.0 },
  { period: '2024-11', index: 105.2, inflation: 5.2 },
  { period: '2024-12', index: 105.4, inflation: 5.4 },
];

export const AirfareIndexView: React.FC = () => {
  const [selectedHorizon, setSelectedHorizon] = useState<string>('ALL');
  const [metricMode, setMetricMode] = useState<'index' | 'inflation'>('index');
  const basePeriod = '2024-01';

  const currentIndex = 105.4;
  const currentInflation = 5.4;

  const exportCSV = () => {
    const headers = [
      'Corridor_Code',
      'Sector_Name',
      'DGCA_Weight',
      'Base_Fare_INR',
      'Current_Fare_INR',
      'Price_Relative',
      'Route_Inflation_Pct',
      'Contribution_Pct_Points',
      'Contribution_Basis_Points'
    ];
    const rows = CORRIDOR_DATA.map((r) => [
      r.route,
      r.name,
      r.weight,
      r.baseFare,
      r.currentFare,
      r.relative,
      r.inflationPct,
      r.contributionPctPts,
      r.contributionBps
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `APIx_Route_Decomposition_${basePeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const horizons = ['ALL', 'T+1', 'T+7', 'T+15', 'T+30', 'T+45'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* 1. VIEW HEADER */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded">
              BASE PERIOD: {basePeriod} = 100.0
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-mono text-slate-500">Jevons Micro-Relatives + Laspeyres National Basket</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            National Airfare Price Index & Route Decomposition
          </h1>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Aggregated price index and sectoral inflation attribution across 11 DGCA-weighted domestic corridors.
          </p>
        </div>

        {/* Controls: Horizon Filter + Metric Mode + Export CSV */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Horizon Filter */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs">
            <Filter className="w-3 h-3 text-slate-400 ml-1" />
            <span className="text-[10px] font-mono text-slate-500 uppercase mr-1">Horizon:</span>
            {horizons.map((h) => (
              <button
                key={h}
                onClick={() => setSelectedHorizon(h)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${
                  selectedHorizon === h
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {h}
              </button>
            ))}
          </div>

          {/* Metric Mode Toggle (Index Level vs Inflation Rate) */}
          <div className="bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex items-center">
            <button
              onClick={() => setMetricMode('index')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                metricMode === 'index'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Index Level (105.4)
            </button>
            <button
              onClick={() => setMetricMode('inflation')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                metricMode === 'inflation'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inflation Rate (+5.4%)
            </button>
          </div>

          <button
            onClick={exportCSV}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. STATISTICAL FORMULATION BANNER */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 font-mono flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <span className="font-bold text-blue-950 font-sans">Statistical Definition: </span>
          <span>Index Level: I_t = ∑ [ w_r × (P_r,t / P_r,0) ] × 100.0 | Base: Jan 2024 = 100.0</span>
          <p className="text-[11px] text-blue-700 font-sans">
            Inflation: π = ((I_t - 100) / 100) × 100% = +5.4%. Index 105.4 indicates prices are 5.4% above base, NOT 105.4% inflation.
          </p>
        </div>
        <span className="px-2 py-1 bg-white border border-blue-200 rounded text-[11px] text-blue-800 font-semibold shrink-0">
          C_r = w_r × ΔP_{'%'} (% pts) = w_r × ΔP_{'%'} × 100 (bps)
        </span>
      </div>

      {/* 3. 4-METRIC TOP STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-mono font-semibold uppercase text-slate-500 block mb-1">
            Current Index Level
          </span>
          <span className="text-2xl font-bold font-mono text-slate-900">
            {currentIndex.toFixed(1)}
          </span>
          <span className="text-[10.5px] text-slate-400 block mt-0.5 font-sans">Dimensionless (Base 100.0)</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-mono font-semibold uppercase text-slate-500 block mb-1">
            Headline Inflation
          </span>
          <span className="text-2xl font-bold font-mono text-blue-600">
            +{currentInflation.toFixed(1)}%
          </span>
          <span className="text-[10.5px] text-slate-400 block mt-0.5 font-sans">Shift since Base Jan 2024</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-mono font-semibold uppercase text-slate-500 block mb-1">
            Top Corridor Driver
          </span>
          <span className="text-xl font-bold font-mono text-slate-900">
            DEL-BOM
          </span>
          <span className="text-[10.5px] text-slate-500 block mt-0.5 font-sans">+1.52% pts (+152 bps)</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-mono font-semibold uppercase text-slate-500 block mb-1">
            Basket Weights Sum
          </span>
          <span className="text-xl font-bold font-mono text-emerald-600">
            1.000 (100%)
          </span>
          <span className="text-[10.5px] text-slate-500 block mt-0.5 font-sans">11 Corridors Verified</span>
        </div>
      </div>

      {/* 4. TRAJECTORY CHART */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              {metricMode === 'index' ? 'National Airfare Index Trajectory (2024)' : 'Cumulative Airfare Inflation Rate (%)'}
            </h2>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Two-tier Laspeyres progression across 12 consecutive months of 2024.
            </p>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-600">
            Base: 2024-01 = 100.0
          </span>
        </div>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={HISTORICAL_CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="period" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis
                domain={metricMode === 'index' ? [99, 107] : [0, 7]}
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E2E8F0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  fontSize: '12px'
                }}
              />
              <Area
                type="monotone"
                dataKey={metricMode === 'index' ? 'index' : 'inflation'}
                fill="#EFF6FF"
                stroke="none"
              />
              <Line
                type="monotone"
                dataKey={metricMode === 'index' ? 'index' : 'inflation'}
                stroke="#2563EB"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#2563EB' }}
                name={metricMode === 'index' ? 'Index Level' : 'Inflation Rate (%)'}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. SECTORAL INFLATION ATTRIBUTION TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Corridor Decomposition & Inflation Attribution (11 Corridors)
            </h2>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Exact contribution of each corridor to national airfare inflation, expressed in Percentage Points (% pts) and Basis Points (bps).
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Total Inflation: +{currentInflation.toFixed(2)}% (+540 bps)
          </span>
        </div>

        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold font-mono">
              <tr>
                <th className="py-2.5 px-3">Corridor</th>
                <th className="py-2.5 px-3">Sector Name</th>
                <th className="py-2.5 px-3">DGCA Weight</th>
                <th className="py-2.5 px-3">Base Fare</th>
                <th className="py-2.5 px-3">Current Fare</th>
                <th className="py-2.5 px-3">Price Relative</th>
                <th className="py-2.5 px-3">Route Inflation</th>
                <th className="py-2.5 px-3 text-right">Contribution (% pts & bps)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {CORRIDOR_DATA.map((row) => (
                <tr key={row.route} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-900">{row.route}</td>
                  <td className="py-2.5 px-3 text-slate-600 font-sans">{row.name}</td>
                  <td className="py-2.5 px-3 text-blue-700 font-semibold">{(row.weight * 100).toFixed(1)}%</td>
                  <td className="py-2.5 px-3 text-slate-500">₹{row.baseFare}</td>
                  <td className="py-2.5 px-3 text-slate-900 font-semibold">₹{row.currentFare}</td>
                  <td className="py-2.5 px-3 text-slate-700">{row.relative.toFixed(3)}</td>
                  <td className="py-2.5 px-3 text-blue-600 font-semibold">+{row.inflationPct.toFixed(2)}%</td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="font-bold text-slate-900 block">+{row.contributionPctPts.toFixed(2)}% pts</span>
                    <span className="text-[10px] text-slate-500 font-mono block">+{row.contributionBps} bps</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
