import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Layers, 
  MapPin, 
  Plane, 
  Activity, 
  Landmark, 
  RefreshCw,
  Download,
  Calendar
} from 'lucide-react';
import { api } from '../../api/client';
import type { 
  IndexResponse, 
  IndexHistoryItem, 
  CPITransportResponse, 
  HealthResponse 
} from '../../api/types';
import { useDemoMode } from '../../context/DemoModeContext';
import { ErrorAlert } from '../../components/common/ErrorAlert';

// Subcomponents
import { HistoricalTrajectoryCard } from './HistoricalTrajectoryCard';
import { LaspeyresDecompositionTable } from './LaspeyresDecompositionTable';
import { VolatilityMatrixWidget } from './VolatilityMatrixWidget';
import { SnapshotComparatorWidget } from './SnapshotComparatorWidget';

export const IndexAnalyticsView: React.FC = () => {
  const { isDemoMode } = useDemoMode();

  const [basePeriod, setBasePeriod] = useState<string>('2024-01');
  const [indexData, setIndexData] = useState<IndexResponse | null>(null);
  const [history, setHistory] = useState<IndexHistoryItem[]>([]);
  const [cpiData, setCpiData] = useState<CPITransportResponse | null>(null);
  const [, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [idxRes, histRes, cpiRes, healthRes] = await Promise.allSettled([
        api.getIndex(basePeriod),
        api.getIndexHistory(30),
        api.getOfficialCPI(),
        api.getHealth(),
      ]);

      if (idxRes.status === 'fulfilled') setIndexData(idxRes.value);
      if (histRes.status === 'fulfilled') setHistory(histRes.value);
      if (cpiRes.status === 'fulfilled') setCpiData(cpiRes.value);
      if (healthRes.status === 'fulfilled') setHealth(healthRes.value);

      if (idxRes.status === 'rejected' && histRes.status === 'rejected') {
        setError('Failed to connect to API backend. Ensure the backend server is active.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching analytics telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [basePeriod, isDemoMode]);

  // Export full analytics dataset
  const handleExportFullReport = () => {
    const report = {
      generated_at: new Date().toISOString(),
      base_period: basePeriod,
      current_period: indexData?.current_period || '2026-09',
      national_index: indexData?.national_index ?? 100.0,
      methodology: 'Laspeyres Fixed Basket (CPI Standard)',
      route_weights: {
        'DEL-BOM': 0.25,
        'DEL-BLR': 0.20,
        'BOM-BLR': 0.20,
        'BOM-HYD': 0.20,
        'DEL-CCU': 0.15,
      },
      route_indices: indexData?.route_indices || {},
      history_snapshot_count: history.length,
      mospi_cpi_points_count: cpiData?.data?.length || 0,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `apix_analytics_report_${basePeriod}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-3.5">
      {/* 1. TOP ANALYTICS KPI STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* KPI 1: National Index */}
        <div className="cmd-card p-2.5 flex flex-col justify-between border-l-2 border-blue-500">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
            <span>Airfare Index</span>
            <TrendingUp className="w-3 h-3 text-blue-400" />
          </div>
          <div className="flex items-baseline space-x-1.5 my-0.5">
            <span className="text-xl font-bold font-mono text-white tracking-tight tabular-nums">
              {indexData?.national_index ? indexData.national_index.toFixed(1) : '100.0'}
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold">0.0%</span>
          </div>
          <div className="text-[9px] font-mono text-slate-400 truncate">Base: {basePeriod} = 100.0</div>
        </div>

        {/* KPI 2: Basket Scope */}
        <div className="cmd-card p-2.5 flex flex-col justify-between border-l-2 border-emerald-500">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
            <span>Basket Scope</span>
            <MapPin className="w-3 h-3 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-1.5 my-0.5">
            <span className="text-xl font-bold font-mono text-white tracking-tight tabular-nums">
              5
            </span>
            <span className="text-[10px] font-mono text-emerald-400">Trunk Pairs</span>
          </div>
          <div className="text-[9px] font-mono text-slate-400 truncate">DGCA Calibrated</div>
        </div>

        {/* KPI 3: Carrier Representation */}
        <div className="cmd-card p-2.5 flex flex-col justify-between border-l-2 border-cyan-500">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
            <span>Carriers</span>
            <Plane className="w-3 h-3 text-cyan-400" />
          </div>
          <div className="flex items-baseline space-x-1.5 my-0.5">
            <span className="text-xl font-bold font-mono text-white tracking-tight tabular-nums">
              7
            </span>
            <span className="text-[10px] font-mono text-cyan-300">Airlines</span>
          </div>
          <div className="text-[9px] font-mono text-slate-400 truncate">6E, AI, SG, G8, etc.</div>
        </div>

        {/* KPI 4: Historical Series Depth */}
        <div className="cmd-card p-2.5 flex flex-col justify-between border-l-2 border-purple-500">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
            <span>DB Snapshots</span>
            <Layers className="w-3 h-3 text-purple-400" />
          </div>
          <div className="flex items-baseline space-x-1.5 my-0.5">
            <span className="text-xl font-bold font-mono text-white tracking-tight tabular-nums">
              {history.length}
            </span>
            <span className="text-[10px] font-mono text-purple-300">Recorded</span>
          </div>
          <div className="text-[9px] font-mono text-slate-400 truncate">PostgreSQL History</div>
        </div>

        {/* KPI 5: Statistical Volatility */}
        <div className="cmd-card p-2.5 flex flex-col justify-between border-l-2 border-amber-500">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
            <span>Volatility (σ)</span>
            <Activity className="w-3 h-3 text-amber-400" />
          </div>
          <div className="flex items-baseline space-x-1.5 my-0.5">
            <span className="text-xl font-bold font-mono text-white tracking-tight tabular-nums">
              0.00
            </span>
            <span className="text-[10px] font-mono text-emerald-400">Baseline</span>
          </div>
          <div className="text-[9px] font-mono text-slate-400 truncate">Standard Deviation</div>
        </div>

        {/* KPI 6: MoSPI Transport Benchmark */}
        <div className="cmd-card p-2.5 flex flex-col justify-between border-l-2 border-teal-500">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
            <span>MoSPI Benchmark</span>
            <Landmark className="w-3 h-3 text-teal-400" />
          </div>
          <div className="flex items-baseline space-x-1.5 my-0.5">
            <span className="text-xl font-bold font-mono text-teal-300 tracking-tight tabular-nums">
              {cpiData?.data && cpiData.data.length > 0 && cpiData.data[cpiData.data.length - 1]?.index_value != null
                ? Number(cpiData.data[cpiData.data.length - 1].index_value).toFixed(1)
                : '171.0'}
            </span>
            <span className="text-[10px] font-mono text-slate-400">pts</span>
          </div>
          <div className="text-[9px] font-mono text-slate-400 truncate">eSankhyiki CPI Sync</div>
        </div>
      </div>

      {/* Error Alert if any */}
      {error && <ErrorAlert message={error} onRetry={fetchAnalyticsData} />}

      {/* 2. ANALYTICS TOOLBAR */}
      <div className="cmd-card p-2.5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-xs font-mono text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>Base Period Reference:</span>
          </div>
          <select
            value={basePeriod}
            onChange={(e) => setBasePeriod(e.target.value)}
            className="bg-[#070D1E] border border-slate-700 text-slate-200 text-xs font-mono rounded px-2.5 py-1 focus:outline-none focus:border-blue-500"
          >
            <option value="2024-01">2024-01 (MoSPI Transport Baseline)</option>
            <option value="2023-01">2023-01 (Pre-Festive Reference)</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchAnalyticsData}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1 rounded bg-[#070D1E] hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono transition-colors disabled:opacity-50"
            title="Refresh analytics telemetry from backend"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>

          <button
            onClick={handleExportFullReport}
            className="flex items-center space-x-1.5 px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono transition-colors shadow-sm"
            title="Export complete index analytics dataset"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Analytics JSON</span>
          </button>
        </div>
      </div>

      {/* 3. ROW 1: TRAJECTORY CARD (8 cols) + VOLATILITY MATRIX (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        <div className="lg:col-span-8">
          <HistoricalTrajectoryCard
            history={history}
            cpiData={cpiData}
            currentIndex={indexData?.national_index ?? 100.0}
            loading={loading}
          />
        </div>
        <div className="lg:col-span-4">
          <VolatilityMatrixWidget indexData={indexData} />
        </div>
      </div>

      {/* 4. ROW 2: LASPEYRES DECOMPOSITION TABLE (8 cols) + SNAPSHOT COMPARATOR (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        <div className="lg:col-span-8">
          <LaspeyresDecompositionTable indexData={indexData} loading={loading} />
        </div>
        <div className="lg:col-span-4">
          <SnapshotComparatorWidget
            currentIndex={indexData}
            history={history}
            onSnapshotCreated={fetchAnalyticsData}
          />
        </div>
      </div>
    </div>
  );
};
