import React, { useState, useMemo } from 'react';
import { 
  Table, 
  ArrowUpDown, 
  Download, 
  Search, 
  Layers, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import type { RouteCorridorItem } from './CorridorPriceDispersionChart';

interface RouteMatrixTableProps {
  corridors: RouteCorridorItem[];
  selectedRoute: string | null;
  onSelectRoute: (route: string) => void;
  loading: boolean;
}

type SortField = 'route' | 'dgcaWeight' | 'baseFare' | 'currentFare' | 'relative' | 'quoteCount';
type SortDirection = 'asc' | 'desc';

export const RouteMatrixTable: React.FC<RouteMatrixTableProps> = ({
  corridors,
  selectedRoute,
  onSelectRoute,
  loading,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'BASKET' | 'METRO-METRO' | 'METRO-TIER2'>('ALL');
  const [sortField, setSortField] = useState<SortField>('dgcaWeight');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const filteredAndSorted = useMemo(() => {
    const term = searchTerm.toLowerCase();
    let list = corridors.filter(
      (c) =>
        c.route.toLowerCase().includes(term) ||
        c.name.toLowerCase().includes(term) ||
        c.originCity.toLowerCase().includes(term) ||
        c.destCity.toLowerCase().includes(term)
    );

    if (categoryFilter === 'BASKET') {
      list = list.filter((c) => c.isBasketRoute);
    } else if (categoryFilter === 'METRO-METRO') {
      list = list.filter((c) => c.category === 'Metro-Metro');
    } else if (categoryFilter === 'METRO-TIER2') {
      list = list.filter((c) => c.category === 'Metro-Tier2');
    }

    list.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    return list;
  }, [corridors, searchTerm, categoryFilter, sortField, sortDir]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Route Code',
      'Corridor Name',
      'Origin City',
      'Destination City',
      'Category',
      'Is Basket Route',
      'DGCA Traffic Weight (%)',
      'Base Fare (INR)',
      'Current Fare (INR)',
      'Price Relative',
      'Quote Density Count',
    ];

    const rows = filteredAndSorted.map((c) => [
      c.route,
      `"${c.name}"`,
      c.originCity,
      c.destCity,
      c.category,
      c.isBasketRoute ? 'YES' : 'NO',
      (c.dgcaWeight * 100).toFixed(1),
      c.baseFare.toFixed(2),
      c.currentFare.toFixed(2),
      c.relative.toFixed(3),
      c.quoteCount,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dgca_route_matrix_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="cmd-card p-4 space-y-3">
      {/* Header with Search and Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center space-x-2">
            <Table className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
              Domestic Corridor Intelligence Matrix
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-blue-950/80 text-blue-300 border border-blue-800/60">
              11 DGCA Priority Corridors
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Real-time domestic route price relatives, DGCA volume rankings, and on-demand scraper triggers
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Category Filter Tabs */}
          <div className="flex items-center bg-[#070D1E] rounded border border-slate-800 p-0.5 text-[10px] font-mono">
            {(['ALL', 'BASKET', 'METRO-METRO', 'METRO-TIER2'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                  categoryFilter === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search route or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#070D1E] border border-slate-800 rounded pl-8 pr-2 py-1 text-[11px] font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-36 sm:w-44"
            />
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#070D1E] hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-[11px] font-mono transition-colors"
            title="Download complete route matrix as CSV"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>CSV</span>
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
                  <span>Corridor</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2 px-3 font-semibold">Tier Category</th>
              <th
                className="py-2 px-3 font-semibold text-right cursor-pointer hover:text-slate-200"
                onClick={() => handleSort('dgcaWeight')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>DGCA Weight</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                className="py-2 px-3 font-semibold text-right cursor-pointer hover:text-slate-200"
                onClick={() => handleSort('baseFare')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Base Fare (P₀)</span>
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
                onClick={() => handleSort('relative')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Relative</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                className="py-2 px-3 font-semibold text-right cursor-pointer hover:text-slate-200"
                onClick={() => handleSort('quoteCount')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Quote Density</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2 px-3 font-semibold text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  <span className="inline-block animate-spin mr-2">⟳</span>
                  Loading DGCA priority route telemetry...
                </td>
              </tr>
            ) : filteredAndSorted.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  No matching corridors found for query &quot;{searchTerm}&quot;
                </td>
              </tr>
            ) : (
              filteredAndSorted.map((c) => {
                const isSelected = selectedRoute === c.route;

                return (
                  <tr
                    key={c.route}
                    onClick={() => onSelectRoute(c.route)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-950/40 text-white'
                        : 'hover:bg-slate-800/30'
                    }`}
                  >
                    {/* Route code & name */}
                    <td className="py-2 px-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white tracking-wide">{c.route}</span>
                        <span className="text-[10px] text-slate-400">({c.originCity} ↔ {c.destCity})</span>
                        {c.isBasketRoute && (
                          <span className="px-1 py-0.2 rounded text-[8px] bg-blue-950 text-blue-300 border border-blue-800/60">
                            CORE
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Tier Category */}
                    <td className="py-2 px-3">
                      <span className="text-[10px] text-slate-300 px-1.5 py-0.5 rounded bg-[#0B132B] border border-slate-800">
                        {c.category}
                      </span>
                    </td>

                    {/* DGCA Weight */}
                    <td className="py-2 px-3 text-right">
                      <span className="px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-300 font-semibold border border-blue-900/60">
                        {(c.dgcaWeight * 100).toFixed(1)}%
                      </span>
                    </td>

                    {/* Base Fare */}
                    <td className="py-2 px-3 text-right text-slate-300">
                      ₹{c.baseFare.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Current Fare */}
                    <td className="py-2 px-3 text-right font-medium text-white">
                      ₹{c.currentFare.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Price Relative */}
                    <td className="py-2 px-3 text-right">
                      <span className="font-mono text-cyan-300 font-semibold">
                        {c.relative.toFixed(3)}
                      </span>
                    </td>

                    {/* Quote Density */}
                    <td className="py-2 px-3 text-right">
                      {c.quoteCount > 0 ? (
                        <span className="text-emerald-400 font-bold">{c.quoteCount} Quotes</span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">Baseline (Par)</span>
                      )}
                    </td>

                    {/* Action Inspector Button */}
                    <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onSelectRoute(c.route)}
                        className="flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white text-[10px] transition-colors mx-auto"
                      >
                        <span>Inspect</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-2.5 bg-[#070D1E] rounded border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
        <div className="flex items-center space-x-1.5">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>
            Weights calibrated from official DGCA scheduled domestic passenger traffic statistics. Baseline fares anchored to January 2024.
          </span>
        </div>
        <div className="flex items-center space-x-1 text-blue-400 cursor-pointer">
          <span>DGCA Official Statistics</span>
          <ExternalLink className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
};
