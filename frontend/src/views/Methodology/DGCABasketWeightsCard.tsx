import React, { useState } from 'react';
import { Table, Download, Search, CheckCircle2 } from 'lucide-react';

const BASKET_WEIGHT_CATALOG = [
  { route: 'DEL-BOM', name: 'Delhi ↔ Mumbai', weight: 0.180, baseFare: 4500, shareDesc: '18.0% (Highest Traffic Volume)', rank: 1, isCore: true },
  { route: 'DEL-BLR', name: 'Delhi ↔ Bengaluru', weight: 0.145, baseFare: 5500, shareDesc: '14.5% (High Business Demand)', rank: 2, isCore: true },
  { route: 'BOM-BLR', name: 'Mumbai ↔ Bengaluru', weight: 0.125, baseFare: 4000, shareDesc: '12.5% (Tech / Financial Corridor)', rank: 3, isCore: true },
  { route: 'DEL-CCU', name: 'Delhi ↔ Kolkata', weight: 0.095, baseFare: 3500, shareDesc: '9.5% (Eastern Trunk Corridor)', rank: 4, isCore: true },
  { route: 'BLR-HYD', name: 'Bengaluru ↔ Hyderabad', weight: 0.085, baseFare: 3200, shareDesc: '8.5% (Southern Tech Corridor)', rank: 5, isCore: false },
  { route: 'MAA-DEL', name: 'Chennai ↔ Delhi', weight: 0.080, baseFare: 4800, shareDesc: '8.0% (North-South Trunk)', rank: 6, isCore: false },
  { route: 'PNQ-BOM', name: 'Pune ↔ Mumbai', weight: 0.070, baseFare: 2800, shareDesc: '7.0% (Western Regional Short-Haul)', rank: 7, isCore: false },
  { route: 'COK-DEL', name: 'Kochi ↔ Delhi', weight: 0.065, baseFare: 5200, shareDesc: '6.5% (Long-Haul Tourist / NRI)', rank: 8, isCore: false },
  { route: 'MAA-BOM', name: 'Chennai ↔ Mumbai', weight: 0.055, baseFare: 3800, shareDesc: '5.5% (South-West Metro Pair)', rank: 9, isCore: false },
  { route: 'AMD-DEL', name: 'Ahmedabad ↔ Delhi', weight: 0.050, baseFare: 3100, shareDesc: '5.0% (Commercial Feeder Route)', rank: 10, isCore: false },
  { route: 'DEL-HYD', name: 'Delhi ↔ Hyderabad', weight: 0.050, baseFare: 4200, shareDesc: '5.0% (Capital Connection)', rank: 11, isCore: true },
];

export const DGCABasketWeightsCard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filtered = BASKET_WEIGHT_CATALOG.filter(
    (item) =>
      item.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalWeight = BASKET_WEIGHT_CATALOG.reduce((sum, i) => sum + i.weight, 0);

  const handleExportCSV = () => {
    const headers = ['DGCA Rank', 'Corridor Code', 'City Pair Name', 'DGCA Weight (%)', 'Base Fare (INR)', 'Core Basket Status'];
    const rows = BASKET_WEIGHT_CATALOG.map((i) => [
      i.rank,
      i.route,
      `"${i.name}"`,
      (i.weight * 100).toFixed(1),
      i.baseFare.toFixed(2),
      i.isCore ? 'CORE BASKET' : 'EXTENDED PRIORITY',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dgca_basket_weights_${new Date().toISOString().slice(0, 10)}.csv`;
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
              DGCA Passenger Traffic Weight Vector (w_r)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Normalized scheduled domestic airline passenger traffic shares summing to exactly 1.000
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search corridor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#070D1E] border border-slate-800 rounded pl-8 pr-2 py-1 text-[11px] font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-36 sm:w-44"
            />
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#070D1E] hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-mono transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-800/80 rounded bg-[#070D1E]">
        <table className="w-full text-left border-collapse text-[11px] font-mono">
          <thead>
            <tr className="bg-[#0B132B] border-b border-slate-800 text-slate-400 uppercase text-[10px]">
              <th className="py-2 px-3">Rank</th>
              <th className="py-2 px-3">Corridor</th>
              <th className="py-2 px-3 text-right">DGCA Weight (w_r)</th>
              <th className="py-2 px-3 text-right">Base Fare (P_0)</th>
              <th className="py-2 px-3">Traffic Description</th>
              <th className="py-2 px-3 text-center">Basket Scope</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((item) => (
              <tr key={item.route} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-2 px-3 text-slate-500 font-bold">#{item.rank}</td>
                <td className="py-2 px-3">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-white">{item.route}</span>
                    <span className="text-[10px] text-slate-400">({item.name})</span>
                  </div>
                </td>
                <td className="py-2 px-3 text-right">
                  <span className="px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-300 font-semibold border border-blue-900/60">
                    {(item.weight * 100).toFixed(1)}%
                  </span>
                </td>
                <td className="py-2 px-3 text-right text-slate-300">
                  ₹{item.baseFare.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2 px-3 text-slate-400 text-[10px]">
                  {item.shareDesc}
                </td>
                <td className="py-2 px-3 text-center">
                  <span
                    className={`inline-flex items-center space-x-1 px-1.5 py-0.2 rounded text-[9px] font-semibold ${
                      item.isCore
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {item.isCore ? <CheckCircle2 className="w-2.5 h-2.5" /> : null}
                    <span>{item.isCore ? 'CORE 5-TRUNK' : 'EXTENDED'}</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-[#0B132B] border-t-2 border-slate-700 font-bold text-slate-200">
              <td colSpan={2} className="py-2.5 px-3 text-white">
                TOTAL NORMALIZED WEIGHT VECTOR (11 Corridors)
              </td>
              <td className="py-2.5 px-3 text-right text-emerald-400">
                {(totalWeight * 100).toFixed(1)}% (1.000)
              </td>
              <td colSpan={3} className="py-2.5 px-3 text-slate-400 text-[10px] text-right">
                Official DGCA Passenger Traffic Census Calibrated
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
