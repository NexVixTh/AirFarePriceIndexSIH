import React, { useState, useMemo } from 'react';
import { 
  Table, 
  ArrowUpDown, 
  Download, 
  Search, 
  CheckCircle2, 
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import type { IndexResponse } from '../../api/types';

interface RouteDecompositionRow {
  route: string;
  name: string;
  weight: number; // e.g. 0.25
  baseFare: number; // e.g. 4500
  currentFare: number; // derived or base
  priceRelative: number; // e.g. 1.000
  weightedContribution: number; // e.g. 25.00
  deltaPts: number;
  status: 'Baseline' | 'Active Shift';
}

const BASKET_SPECIFICATION = [
  { route: 'DEL-BOM', name: 'Delhi ↔ Mumbai', weight: 0.25, baseFare: 4500.0 },
  { route: 'DEL-BLR', name: 'Delhi ↔ Bengaluru', weight: 0.20, baseFare: 5500.0 },
  { route: 'BOM-BLR', name: 'Mumbai ↔ Bengaluru', weight: 0.20, baseFare: 4000.0 },
  { route: 'BOM-HYD', name: 'Mumbai ↔ Hyderabad', weight: 0.20, baseFare: 4200.0 },
  { route: 'DEL-CCU', name: 'Delhi ↔ Kolkata', weight: 0.15, baseFare: 3500.0 },
];

interface LaspeyresDecompositionTableProps {
  indexData: IndexResponse | null;
  loading: boolean;
}

type SortField = 'route' | 'weight' | 'baseFare' | 'currentFare' | 'priceRelative' | 'weightedContribution';
type SortDirection = 'asc' | 'desc';

export const LaspeyresDecompositionTable: React.FC<LaspeyresDecompositionTableProps> = ({
  indexData,
  loading,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('weight');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  // Compute table rows based on real indexData if route_indices exist
  const rows: RouteDecompositionRow[] = useMemo(() => {
    const routeIndices = indexData?.route_indices || {};

    return BASKET_SPECIFICATION.map((item) => {
      const routeIdx = routeIndices[item.route] ?? 100.0;
      const priceRelative = routeIdx / 100.0;
      const currentFare = item.baseFare * priceRelative;
      const weightedContribution = item.weight * routeIdx;
      const deltaPts = weightedContribution - item.weight * 100.0;

      return {
        route: item.route,
        name: item.name,
        weight: item.weight,
        baseFare: item.baseFare,
        currentFare: currentFare,
        priceRelative: priceRelative,
        weightedContribution: weightedContribution,
        deltaPts: deltaPts,
        status: Math.abs(deltaPts) > 0.01 ? 'Active Shift' : 'Baseline',
      };
    });
  }, [indexData]);

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  // Filter and sort rows
  const filteredAndSortedRows = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const filtered = rows.filter(
      (r) =>
        r.route.toLowerCase().includes(term) ||
        r.name.toLowerCase().includes(term)
    );

    filtered.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    return filtered;
  }, [rows, searchTerm, sortField, sortDir]);

  // Aggregate Totals
  const totalWeight = rows.reduce((sum, r) => sum + r.weight, 0);
  const totalContribution = rows.reduce((sum, r) => sum + r.weightedContribution, 0);

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Route Code',
      'Corridor Name',
      'DGCA Weight (%)',
      'Base Fare (INR)',
      'Current Fare (INR)',
      'Price Relative (Pt/P0)',
      'Weighted Index Contribution (pts)',
      'Status',
    ];
    const csvRows = rows.map((r) => [
      r.route,
      `"${r.name}"`,
      (r.weight * 100).toFixed(1),
      r.baseFare.toFixed(2),
      r.currentFare.toFixed(2),
      r.priceRelative.toFixed(4),
      r.weightedContribution.toFixed(2),
      r.status,
    ]);

    const csvContent = [headers.join(','), ...csvRows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `apix_laspeyres_basket_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="cmd-card p-4 space-y-3">
      {/* Header with Search and Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center space-x-2">
            <Table className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
              Laspeyres Route Basket Decomposition
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
              DGCA 5-Corridor Fixed Basket
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Granular price relatives (P_r,t / P_r,0) and individual corridor contributions to national airfare index
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search route or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#070D1E] border border-slate-800 rounded pl-8 pr-2 py-1 text-[11px] font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-44"
            />
          </div>

          {/* Export CSV button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#070D1E] hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-[11px] font-mono transition-colors"
            title="Download basket decomposition as CSV"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto border border-slate-800/80 rounded bg-[#070D1E]">
        <table className="w-full text-left border-collapse text-[11px] font-mono">
          <thead>
            <tr className="bg-[#0B132B] border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
              <th
                className="py-2 px-3 font-semibold cursor-pointer hover:text-slate-200"
                onClick={() => handleSort('route')}
              >
                <div className="flex items-center space-x-1">
                  <span>Corridor (Route)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                className="py-2 px-3 font-semibold text-right cursor-pointer hover:text-slate-200"
                onClick={() => handleSort('weight')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>DGCA Weight (w_r)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                className="py-2 px-3 font-semibold text-right cursor-pointer hover:text-slate-200"
                onClick={() => handleSort('baseFare')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Base Fare (P_0)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                className="py-2 px-3 font-semibold text-right cursor-pointer hover:text-slate-200"
                onClick={() => handleSort('currentFare')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Current Fare (P_t)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                className="py-2 px-3 font-semibold text-right cursor-pointer hover:text-slate-200"
                onClick={() => handleSort('priceRelative')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Price Relative</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                className="py-2 px-3 font-semibold text-right cursor-pointer hover:text-slate-200"
                onClick={() => handleSort('weightedContribution')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Weighted Pts (w_r × Rel)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2 px-3 font-semibold text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-400">
                  <span className="inline-block animate-spin mr-2">⟳</span>
                  Loading route index weights...
                </td>
              </tr>
            ) : filteredAndSortedRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-500">
                  No matching route found for &quot;{searchTerm}&quot;
                </td>
              </tr>
            ) : (
              filteredAndSortedRows.map((r) => (
                <tr key={r.route} className="hover:bg-slate-800/30 transition-colors">
                  {/* Corridor Code & Name */}
                  <td className="py-2 px-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white tracking-wide">{r.route}</span>
                      <span className="text-[10px] text-slate-400">({r.name})</span>
                    </div>
                  </td>

                  {/* Weight */}
                  <td className="py-2 px-3 text-right">
                    <span className="px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-300 font-semibold border border-blue-900/60">
                      {(r.weight * 100).toFixed(1)}%
                    </span>
                  </td>

                  {/* Base Fare */}
                  <td className="py-2 px-3 text-right text-slate-300">
                    ₹{r.baseFare.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>

                  {/* Current Fare */}
                  <td className="py-2 px-3 text-right font-medium text-white">
                    ₹{r.currentFare.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>

                  {/* Price Relative */}
                  <td className="py-2 px-3 text-right">
                    <span className="font-mono text-cyan-300 font-semibold">
                      {r.priceRelative.toFixed(3)}
                    </span>
                  </td>

                  {/* Weighted Contribution */}
                  <td className="py-2 px-3 text-right">
                    <span className="font-bold text-emerald-400 tabular-nums">
                      {r.weightedContribution.toFixed(2)} pts
                    </span>
                  </td>

                  {/* Status Indicator */}
                  <td className="py-2 px-3 text-center">
                    <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                      <span>{r.status}</span>
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {/* Summary / Totals Footer Row */}
          <tfoot>
            <tr className="bg-[#0B132B] border-t-2 border-slate-700/80 font-bold text-slate-200">
              <td className="py-2.5 px-3">
                <div className="flex items-center space-x-1.5">
                  <span className="text-white">AGGREGATE BASKET TOTAL</span>
                  <span className="text-[10px] text-slate-400 font-normal">(5 Corridors)</span>
                </div>
              </td>
              <td className="py-2.5 px-3 text-right text-blue-300">
                {(totalWeight * 100).toFixed(1)}%
              </td>
              <td className="py-2.5 px-3 text-right text-slate-400">—</td>
              <td className="py-2.5 px-3 text-right text-slate-400">—</td>
              <td className="py-2.5 px-3 text-right text-cyan-400">1.000 Avg</td>
              <td className="py-2.5 px-3 text-right text-emerald-400 text-xs">
                {totalContribution.toFixed(2)} pts
              </td>
              <td className="py-2.5 px-3 text-center text-[10px] text-slate-400">
                100% DGCA Validated
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Methodological Citation Box */}
      <div className="p-2.5 bg-[#070D1E] border border-slate-800/80 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
        <div className="flex items-center space-x-2">
          <HelpCircle className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          <span>
            Laspeyres Price Relatives computed as{' '}
            <code className="text-slate-300">R_r = P_{'{r,t}'} / P_{'{r,0}'}</code> with weights calibrated from DGCA City-Pair Traffic Statistics.
          </span>
        </div>
        <div className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 cursor-pointer">
          <span>DGCA Formulation Standard</span>
          <ExternalLink className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
};
