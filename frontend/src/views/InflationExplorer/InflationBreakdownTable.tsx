import React from 'react';
import type { InflationFilters } from './InflationControlPanel';

export interface RouteInflationRow {
  route: string;
  originName: string;
  destName: string;
  weight: number;
  baseIndex: number;
  compIndex: number;
  relative: number;
  inflationPct: number;
  contributionBps: number;
}

interface InflationBreakdownTableProps {
  filters: InflationFilters;
  rows: RouteInflationRow[];
  totalInflation: number;
}

export const InflationBreakdownTable: React.FC<InflationBreakdownTableProps> = ({
  filters,
  rows,
  totalInflation,
}) => {
  const exportToCSV = () => {
    const headers = [
      'Corridor_Code',
      'Origin_City',
      'Destination_City',
      'DGCA_Traffic_Weight',
      `Base_Period_${filters.basePeriod}`,
      `Comparison_Period_${filters.comparisonPeriod}`,
      'Price_Relative',
      'Sector_Inflation_Pct',
      'Contribution_to_National_Inflation_bps',
    ];

    const csvData = rows.map((r) => [
      r.route,
      r.originName,
      r.destName,
      r.weight,
      r.baseIndex.toFixed(2),
      r.compIndex.toFixed(2),
      r.relative.toFixed(3),
      r.inflationPct.toFixed(2),
      r.contributionBps,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        '# Airfare Price Index (APIx) - Sectoral Inflation Decomposition',
        `# Base Period: ${filters.basePeriod}`,
        `# Comparison Period: ${filters.comparisonPeriod}`,
        `# Total National Inflation: ${totalInflation.toFixed(2)}%`,
        `# Generated: ${new Date().toISOString()}`,
        headers.join(','),
        ...csvData.map((e) => e.join(',')),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `apix_sectoral_inflation_${filters.basePeriod}_to_${filters.comparisonPeriod}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#0B132B] border border-[#1B2A4A] rounded-xl p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1B2A4A]/60">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-wide uppercase flex items-center gap-2">
            <span>📊</span>
            <span>Corridor-Level Inflation Decomposition & Laspeyres Weights</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Contribution of each high-density domestic aviation corridor to national airfare inflation between {filters.basePeriod} and {filters.comparisonPeriod}.
          </p>
        </div>

        <button
          onClick={exportToCSV}
          className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition flex items-center gap-1.5 shadow-sm font-medium self-start sm:self-auto"
        >
          <span>📥</span>
          <span>Export Sector Decomposition CSV</span>
        </button>
      </div>

      <div className="overflow-x-auto mt-3">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#1B2A4A] text-slate-400 bg-[#060A13]/60 font-mono">
              <th className="py-2.5 px-3">Corridor</th>
              <th className="py-2.5 px-3">Sector Name</th>
              <th className="py-2.5 px-3">DGCA Weight</th>
              <th className="py-2.5 px-3">Base ({filters.basePeriod})</th>
              <th className="py-2.5 px-3">Comp ({filters.comparisonPeriod})</th>
              <th className="py-2.5 px-3">Price Relative</th>
              <th className="py-2.5 px-3">Sector Inflation</th>
              <th className="py-2.5 px-3 text-right">Contribution (bps)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1B2A4A]/40 font-mono">
            {rows.map((row) => (
              <tr
                key={row.route}
                className="hover:bg-[#1B2A4A]/30 transition-colors text-slate-300"
              >
                <td className="py-2.5 px-3 font-semibold text-white">
                  {row.route}
                </td>
                <td className="py-2.5 px-3 text-slate-400 font-sans">
                  {row.originName} ⇄ {row.destName}
                </td>
                <td className="py-2.5 px-3 text-blue-300">
                  {(row.weight * 100).toFixed(1)}%
                </td>
                <td className="py-2.5 px-3 text-slate-400">
                  {row.baseIndex.toFixed(1)}
                </td>
                <td className="py-2.5 px-3 font-semibold text-white">
                  {row.compIndex.toFixed(1)}
                </td>
                <td className="py-2.5 px-3 text-slate-300">
                  {row.relative.toFixed(3)}
                </td>
                <td className="py-2.5 px-3">
                  <span
                    className={`font-semibold ${
                      row.inflationPct > 0
                        ? 'text-rose-400'
                        : row.inflationPct < 0
                        ? 'text-emerald-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {row.inflationPct > 0
                      ? `+${row.inflationPct.toFixed(2)}%`
                      : `${row.inflationPct.toFixed(2)}%`}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right">
                  <span className="text-amber-300 font-semibold block">
                    {row.contributionBps > 0
                      ? `+${row.contributionBps}`
                      : row.contributionBps}{' '}
                    bps
                  </span>
                  <span className="text-[10px] text-slate-400 block font-sans">
                    ({row.contributionBps > 0 ? '+' : ''}{(row.contributionBps / 100).toFixed(2)}% pts)
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 pt-2 border-t border-[#1B2A4A]/40 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono">
        <span>Cumulative DGCA Weights: 1.000 (100.0%)</span>
        <span className="text-white font-semibold">
          Weighted Aggregate Inflation:{' '}
          <span className={totalInflation >= 0 ? 'text-rose-400' : 'text-emerald-400'}>
            {totalInflation >= 0 ? `+${totalInflation.toFixed(2)}%` : `${totalInflation.toFixed(2)}%`}
          </span>
        </span>
      </div>
    </div>
  );
};
