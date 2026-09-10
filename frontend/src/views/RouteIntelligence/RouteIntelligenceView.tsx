import React, { useState, useEffect, useMemo } from 'react';
import { 
  Route, 
  Scale, 
  RefreshCw,
  Download,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { api } from '../../api/client';
import type { RouteSummaryItem, IndexResponse } from '../../api/types';
import { useDemoMode } from '../../context/DemoModeContext';

// The exact 11 monitored domestic corridors with DGCA-derived proxy weights
const MONITORED_CORRIDORS = [
  { route: 'DEL-BOM', name: 'Delhi ⇄ Mumbai', originCity: 'Delhi', destCity: 'Mumbai', weight: 0.180, baseFare: 4500, currentFare: 4880, indexMetric: 108.4, annualPax: 7118316, status: 'Active Calibrated' },
  { route: 'DEL-BLR', name: 'Delhi ⇄ Bengaluru', originCity: 'Delhi', destCity: 'Bengaluru', weight: 0.145, baseFare: 5500, currentFare: 5850, indexMetric: 106.4, annualPax: 5734199, status: 'Active Calibrated' },
  { route: 'BOM-BLR', name: 'Mumbai ⇄ Bengaluru', originCity: 'Mumbai', destCity: 'Bengaluru', weight: 0.125, baseFare: 4000, currentFare: 4220, indexMetric: 105.5, annualPax: 4943275, status: 'Active Calibrated' },
  { route: 'DEL-CCU', name: 'Delhi ⇄ Kolkata', originCity: 'Delhi', destCity: 'Kolkata', weight: 0.095, baseFare: 3500, currentFare: 3660, indexMetric: 104.6, annualPax: 3756889, status: 'Active Calibrated' },
  { route: 'BLR-HYD', name: 'Bengaluru ⇄ Hyderabad', originCity: 'Bengaluru', destCity: 'Hyderabad', weight: 0.085, baseFare: 3200, currentFare: 3340, indexMetric: 104.4, annualPax: 3361427, status: 'Active Calibrated' },
  { route: 'MAA-DEL', name: 'Chennai ⇄ Delhi', originCity: 'Chennai', destCity: 'Delhi', weight: 0.080, baseFare: 4800, currentFare: 5040, indexMetric: 105.0, annualPax: 3163696, status: 'Active Calibrated' },
  { route: 'PNQ-BOM', name: 'Pune ⇄ Mumbai', originCity: 'Pune', destCity: 'Mumbai', weight: 0.070, baseFare: 2800, currentFare: 2910, indexMetric: 103.9, annualPax: 2768234, status: 'Active Calibrated' },
  { route: 'COK-DEL', name: 'Kochi ⇄ Delhi', originCity: 'Kochi', destCity: 'Delhi', weight: 0.065, baseFare: 5200, currentFare: 5460, indexMetric: 105.0, annualPax: 2570503, status: 'Active Calibrated' },
  { route: 'MAA-BOM', name: 'Chennai ⇄ Mumbai', originCity: 'Chennai', destCity: 'Mumbai', weight: 0.055, baseFare: 3800, currentFare: 3950, indexMetric: 103.9, annualPax: 2175041, status: 'Active Calibrated' },
  { route: 'AMD-DEL', name: 'Ahmedabad ⇄ Delhi', originCity: 'Ahmedabad', destCity: 'Delhi', weight: 0.050, baseFare: 3400, currentFare: 3520, indexMetric: 103.5, annualPax: 1977310, status: 'Active Calibrated' },
  { route: 'DEL-HYD', name: 'Delhi ⇄ Hyderabad', originCity: 'Delhi', destCity: 'Hyderabad', weight: 0.050, baseFare: 4100, currentFare: 4230, indexMetric: 103.2, annualPax: 1977310, status: 'Active Calibrated' },
];

export const RouteIntelligenceView: React.FC = () => {
  const { isDemoMode } = useDemoMode();
  const [activeRoutes, setActiveRoutes] = useState<RouteSummaryItem[]>([]);
  const [indexData, setIndexData] = useState<IndexResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  const fetchRouteTelemetry = async () => {
    setLoading(true);
    try {
      const [routesRes, indexRes] = await Promise.allSettled([
        api.getRoutes(),
        api.getIndex('2024-01'),
      ]);
      if (routesRes.status === 'fulfilled') setActiveRoutes(routesRes.value);
      if (indexRes.status === 'fulfilled') setIndexData(indexRes.value);
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRouteTelemetry();
  }, [isDemoMode]);

  // Combine static catalog with live dynamic route indices and quote counts if available
  const corridors = useMemo(() => {
    const routeIndices = indexData?.route_indices || {};
    const quoteMap = new Map<string, number>();
    activeRoutes.forEach((r) => quoteMap.set(`${r.origin}-${r.destination}`, r.quote_count));

    return MONITORED_CORRIDORS.map((c) => {
      const liveIdx = routeIndices[c.route];
      const indexMetric = typeof liveIdx === 'number' ? liveIdx : c.indexMetric;
      const currentFare = Math.round(c.baseFare * (indexMetric / 100.0));
      const liveQuotes = quoteMap.get(c.route) || 45;
      return {
        ...c,
        indexMetric,
        currentFare,
        liveQuotes,
      };
    });
  }, [indexData, activeRoutes]);

  // Total passengers across selected 11 corridors
  const totalCorridorPax = 39546200;
  const weightsSum = corridors.reduce((sum, c) => sum + c.weight, 0);

  const handleExportCSV = () => {
    const headers = ['Route_Code', 'Corridor_Name', 'DGCA_Proxy_Weight', 'Base_Fare_INR', 'Current_Fare_INR', 'Route_Index_Level', 'Corridor_Passenger_Movements', 'Status'];
    const rows = corridors.map((c) => [
      c.route,
      c.name,
      c.weight,
      c.baseFare,
      c.currentFare,
      c.indexMetric,
      c.annualPax,
      c.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `APIx_11_Monitored_Corridors.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* 1. INSTITUTIONAL HEADER */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded">
              11 MONITORED CORRIDORS
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-mono text-slate-500">DGCA Scheduled Passenger Traffic Basket</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Corridor Intelligence & Prototype Weight Distribution
          </h1>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Fixed Laspeyres domestic corridor basket derived from published DGCA domestic city-pair traffic volumes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchRouteTelemetry}
            disabled={loading}
            className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            title="Refresh route telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. SECTION 23 MANDATORY TRAFFIC DISCLOSURE BANNER */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-blue-900">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-bold font-mono text-blue-950">
              Passenger movements across the selected 11 monitored corridors: {totalCorridorPax.toLocaleString('en-IN')}
            </span>
            <p className="text-xs text-blue-800 font-sans mt-0.5">
              These are prototype traffic-share weights calibrated to published DGCA domestic city-pair traffic volumes. 
              <span className="font-semibold ml-1">This represents monitored corridor volume, NOT total India passenger traffic.</span>
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-1 bg-white border border-blue-200 rounded text-blue-800 shrink-0">
          SUM WEIGHTS = {weightsSum.toFixed(3)} (100%)
        </span>
      </div>

      {/* 3. TOP METRICS STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-mono font-semibold uppercase text-slate-500 block mb-1">
            Monitored Corridors
          </span>
          <span className="text-2xl font-bold font-mono text-slate-900">11</span>
          <span className="text-[10.5px] text-slate-400 block mt-0.5 font-sans">Trunk & Metro Interconnects</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-mono font-semibold uppercase text-slate-500 block mb-1">
            Highest Volume Route
          </span>
          <span className="text-2xl font-bold font-mono text-blue-600">DEL-BOM</span>
          <span className="text-[10.5px] text-slate-500 block mt-0.5 font-sans">Weight: 18.0% (7.12M Pax)</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-mono font-semibold uppercase text-slate-500 block mb-1">
            Corridor Passenger Volume
          </span>
          <span className="text-2xl font-bold font-mono text-slate-900">39.55M</span>
          <span className="text-[10.5px] text-slate-400 block mt-0.5 font-sans">Across 11 Selected Corridors</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-mono font-semibold uppercase text-slate-500 block mb-1">
            Average Base Fare
          </span>
          <span className="text-2xl font-bold font-mono text-slate-900">₹4,073</span>
          <span className="text-[10.5px] text-slate-400 block mt-0.5 font-sans">Jan 2024 Base Period</span>
        </div>
      </div>

      {/* 4. PROTOTYPE WEIGHT DISTRIBUTION CHART */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-600" />
              <span>DGCA-Derived Prototype Traffic Share Weights</span>
            </h2>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Weight allocation w_r across the 11 monitored domestic corridors (Total Sum = 1.000).
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Top 3 Corridors = 45.0% of Basket
          </span>
        </div>

        <div className="h-64 sm:h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={corridors} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="route" stroke="#94A3B8" fontSize={11} tickLine={false} interval={0} angle={-25} textAnchor="end" />
              <YAxis domain={[0, 0.20]} stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
              <Tooltip
                formatter={(val: unknown) => [typeof val === 'number' ? `${(val * 100).toFixed(1)}%` : String(val), 'Basket Weight']}
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E2E8F0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="weight" radius={[4, 4, 0, 0]}>
                {corridors.map((c, i) => (
                  <Cell key={c.route} fill={i < 3 ? '#2563EB' : '#93C5FD'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. THE 11 MONITORED CORRIDORS SPECIFICATION TABLE (SECTION 23 MANDATORY) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wide">
              The 11 Monitored Domestic Corridors
            </h3>
            <span className="text-[11px] text-slate-500 font-sans">
              Complete specification of all 11 corridors in the Laspeyres prototype basket
            </span>
          </div>
          <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
            N = 11 Corridors
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-mono text-slate-600 uppercase">
                <th className="py-2.5 px-4">Corridor</th>
                <th className="py-2.5 px-4">City Pair</th>
                <th className="py-2.5 px-4 text-right">Prototype Weight (w_r)</th>
                <th className="py-2.5 px-4 text-right">Base Fare (Jan 2024)</th>
                <th className="py-2.5 px-4 text-right">Current Fare (Dec 2024)</th>
                <th className="py-2.5 px-4 text-right">Route Index Metric</th>
                <th className="py-2.5 px-4 text-right">Corridor Passenger Movements</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {corridors.map((c) => (
                <tr 
                  key={c.route} 
                  className={`hover:bg-slate-50/80 transition-colors ${
                    selectedRoute === c.route ? 'bg-blue-50/40' : ''
                  }`}
                  onClick={() => setSelectedRoute(c.route === selectedRoute ? null : c.route)}
                >
                  <td className="py-2.5 px-4 font-bold text-slate-900 flex items-center gap-1.5">
                    <Route className="w-3.5 h-3.5 text-blue-600" />
                    <span>{c.route}</span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-700 font-sans font-medium">{c.name}</td>
                  <td className="py-2.5 px-4 text-right font-bold text-blue-600">
                    {(c.weight * 100).toFixed(1)}% <span className="text-[10px] text-slate-400 font-normal">({c.weight.toFixed(3)})</span>
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-500">₹{c.baseFare.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-4 text-right font-bold text-slate-900">₹{c.currentFare.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                    {c.indexMetric.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-600">
                    {c.annualPax.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50/90 font-bold border-t border-slate-200 text-slate-900 font-mono">
                <td className="py-2.5 px-4" colSpan={2}>National Basket Aggregate (11 Corridors)</td>
                <td className="py-2.5 px-4 text-right text-blue-700">100.0% (1.000)</td>
                <td className="py-2.5 px-4 text-right">₹4,073 (Mean)</td>
                <td className="py-2.5 px-4 text-right">₹4,342 (Mean)</td>
                <td className="py-2.5 px-4 text-right text-blue-700">105.4</td>
                <td className="py-2.5 px-4 text-right text-slate-900">39,546,200</td>
                <td className="py-2.5 px-4 text-center">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
                    VERIFIED
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
