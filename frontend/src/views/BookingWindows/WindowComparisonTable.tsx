import React from 'react';
import { Table, Download, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { WindowMetric } from './LeadTimeCurveVisualizer';

interface WindowComparisonTableProps {
  route: string;
  windows: WindowMetric[];
}

export const WindowComparisonTable: React.FC<WindowComparisonTableProps> = ({
  route,
  windows,
}) => {
  // Sort from T+1 to T+45 for logical reading
  const sorted = [...windows].sort((a, b) => a.advanceDays - b.advanceDays);

  const handleExportCSV = () => {
    const headers = [
      'Advance Window',
      'Days Ahead',
      'Horizon Category',
      'Base Fare (INR)',
      'Expected Fare (INR)',
      'Escalation Multiplier',
      'Consumer Risk Level',
      'Provenance Status',
    ];

    const rows = sorted.map((w) => [
      w.window,
      w.advanceDays,
      `"${w.label}"`,
      w.baseFare.toFixed(2),
      w.expectedFare.toFixed(2),
      `${w.multiplier.toFixed(2)}x`,
      w.risk,
      w.status,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `booking_windows_${route}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="cmd-card p-4 space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center space-x-2">
            <Table className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
              5-Window Advance Booking Dynamics Matrix ({route})
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Discrete evaluation of T+1, T+7, T+15, T+30, and T+45 departure brackets
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#070D1E] hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-[11px] font-mono transition-colors"
          title="Download window comparison as CSV"
        >
          <Download className="w-3.5 h-3.5 text-blue-400" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-800/80 rounded bg-[#070D1E]">
        <table className="w-full text-left border-collapse text-[11px] font-mono">
          <thead>
            <tr className="bg-[#0B132B] border-b border-slate-800 text-slate-400 uppercase text-[10px]">
              <th className="py-2 px-3">Window</th>
              <th className="py-2 px-3">Horizon Description</th>
              <th className="py-2 px-3 text-right">Lead Time</th>
              <th className="py-2 px-3 text-right">Base Fare</th>
              <th className="py-2 px-3 text-right">Expected Tariff</th>
              <th className="py-2 px-3 text-right">Escalation</th>
              <th className="py-2 px-3 text-center">Consumer Risk</th>
              <th className="py-2 px-3 text-center">Data Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {sorted.map((w) => {
              const deltaAmt = w.expectedFare - w.baseFare;

              return (
                <tr key={w.window} className="hover:bg-slate-800/30 transition-colors">
                  {/* Window code */}
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-white tracking-wider text-xs px-2 py-0.5 rounded bg-blue-950/80 border border-blue-800/60">
                      {w.window}
                    </span>
                  </td>

                  {/* Horizon label */}
                  <td className="py-2.5 px-3 text-slate-300 font-medium">
                    {w.label}
                  </td>

                  {/* Advance Days */}
                  <td className="py-2.5 px-3 text-right text-slate-400">
                    {w.advanceDays} Days
                  </td>

                  {/* Base Fare */}
                  <td className="py-2.5 px-3 text-right text-slate-400">
                    ₹{w.baseFare.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>

                  {/* Expected Tariff */}
                  <td className="py-2.5 px-3 text-right font-bold text-white">
                    ₹{w.expectedFare.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>

                  {/* Escalation Multiplier */}
                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={`font-bold ${
                        w.multiplier > 1.4
                          ? 'text-rose-400'
                          : w.multiplier > 1.15
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {w.multiplier.toFixed(2)}x
                    </span>
                    <span className="text-[9px] text-slate-500 ml-1">
                      ({deltaAmt >= 0 ? `+₹${Math.round(deltaAmt)}` : `-₹${Math.round(Math.abs(deltaAmt))}`})
                    </span>
                  </td>

                  {/* Consumer Risk Badge */}
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[9px] font-semibold ${
                        w.risk === 'High Surge'
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                          : w.risk === 'Moderate Surge'
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                          : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                      }`}
                    >
                      {w.risk === 'High Surge' && <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />}
                      {w.risk === 'Optimal Window' && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />}
                      <span>{w.risk}</span>
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-2.5 px-3 text-center text-[10px] text-slate-400">
                    {w.status}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
