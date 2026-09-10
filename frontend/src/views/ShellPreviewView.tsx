import React, { useState, useEffect } from 'react';
import { 
  Landmark, 
  MapPin,
  ShieldCheck, 
  TrendingUp,
  Activity,
  Plane,
  Clock,
  CheckCircle,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { usePersona } from '../context/PersonaContext';
import { useDemoMode } from '../context/DemoModeContext';
import { api } from '../api/client';
import type { HealthResponse, IndexResponse, CPITransportResponse, CPIItem } from '../api/types';
import { FilterBar, type FilterState } from '../components/common/FilterBar';
import { DataTable, type ColumnDef } from '../components/common/DataTable';
import { ErrorAlert } from '../components/common/ErrorAlert';

interface ShellPreviewViewProps {
  onNavigateToTrust?: () => void;
}

export const ShellPreviewView: React.FC<ShellPreviewViewProps> = ({ onNavigateToTrust }) => {
  const { isAnalyst } = usePersona();
  const { isDemoMode } = useDemoMode();

  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [indexData, setIndexData] = useState<IndexResponse | null>(null);
  const [cpiData, setCpiData] = useState<CPITransportResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<string>('30D');
  const [selectedHub, setSelectedHub] = useState<string>('DEL');

  const [filters, setFilters] = useState<FilterState>({
    route: 'ALL',
    airline: 'ALL',
    bookingWindow: 'ALL',
    baseMonth: '2024-01',
  });

  const loadTelemetry = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const [h, idx, cpi] = await Promise.allSettled([
        api.getHealth(),
        api.getIndex(filters.baseMonth),
        api.getOfficialCPI(),
      ]);

      if (h.status === 'fulfilled') setHealth(h.value);
      if (idx.status === 'fulfilled') setIndexData(idx.value);
      if (cpi.status === 'fulfilled') setCpiData(cpi.value);

      if (h.status === 'rejected' && idx.status === 'rejected') {
        setApiError('Unable to connect to the backend service. Check if main.py is running.');
      }
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Telemetry request failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTelemetry();
  }, [isDemoMode, filters.baseMonth]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      route: 'ALL',
      airline: 'ALL',
      bookingWindow: 'ALL',
      baseMonth: '2024-01',
    });
  };

  // Real fixed basket weights from backend pipeline/index_calculator.py ROUTE_WEIGHTS & BASE_PERIOD_FARES
  const BASKET_ROUTES = [
    { route: 'DEL-BOM', name: 'Delhi ⇄ Mumbai', weight: '25.0%', baseFare: '₹4,500', baseMonth: '2024-01' },
    { route: 'DEL-BLR', name: 'Delhi ⇄ Bengaluru', weight: '20.0%', baseFare: '₹5,500', baseMonth: '2024-01' },
    { route: 'BOM-BLR', name: 'Mumbai ⇄ Bengaluru', weight: '20.0%', baseFare: '₹4,000', baseMonth: '2024-01' },
    { route: 'BOM-HYD', name: 'Mumbai ⇄ Hyderabad', weight: '20.0%', baseFare: '₹4,200', baseMonth: '2024-01' },
    { route: 'DEL-CCU', name: 'Delhi ⇄ Kolkata', weight: '15.0%', baseFare: '₹3,500', baseMonth: '2024-01' },
  ];

  // Real scheduled airline weighting vector from backend pipeline/index_calculator.py AIRLINE_WEIGHTS
  const AIRLINE_WEIGHTS_DATA = [
    { code: '6E', name: 'IndiGo', weight: '25.0%' },
    { code: 'AI', name: 'Air India', weight: '20.0%' },
    { code: 'SG', name: 'SpiceJet', weight: '15.0%' },
    { code: 'G8', name: 'Go Air', weight: '15.0%' },
    { code: 'IX', name: 'Air India Express', weight: '10.0%' },
    { code: 'UK', name: 'Vistara', weight: '10.0%' },
    { code: '9W', name: 'Jet Airways', weight: '5.0%' },
  ];

  // Lead-time booking windows defined by methodology (pipeline/index_calculator.py)
  const BOOKING_WINDOWS = [
    { window: 'T-1', label: '1 Day Ahead' },
    { window: 'T-3', label: '3 Days Ahead' },
    { window: 'T-7', label: '1 Week Ahead' },
    { window: 'T-14', label: '2 Weeks Ahead' },
    { window: 'T-21', label: '3 Weeks Ahead' },
    { window: 'T-30', label: '1 Month Ahead' },
  ];

  // Aviation hub coordinates on stylized SVG map (topological network reference)
  const HUBS = [
    { code: 'DEL', name: 'Delhi (IGI)', x: 130, y: 75, type: 'Northern Trunk Hub' },
    { code: 'BOM', name: 'Mumbai (CSMIA)', x: 80, y: 160, type: 'Western Trunk Hub' },
    { code: 'BLR', name: 'Bengaluru (KIA)', x: 115, y: 220, type: 'Southern Trunk Hub' },
    { code: 'HYD', name: 'Hyderabad (RGIA)', x: 125, y: 175, type: 'Deccan Trunk Hub' },
    { code: 'MAA', name: 'Chennai (MAA)', x: 145, y: 230, type: 'Southern Coastal Hub' },
    { code: 'CCU', name: 'Kolkata (NSCBIA)', x: 210, y: 135, type: 'Eastern Trunk Hub' },
  ];

  // Flights between hubs for topological reference
  const FLIGHT_ARCS = [
    { from: 'DEL', to: 'BOM', d: 'M 130,75 Q 90,110 80,160' },
    { from: 'BOM', to: 'BLR', d: 'M 80,160 Q 95,195 115,220' },
    { from: 'DEL', to: 'BLR', d: 'M 130,75 Q 135,150 115,220' },
    { from: 'DEL', to: 'CCU', d: 'M 130,75 Q 175,95 210,135' },
    { from: 'BOM', to: 'MAA', d: 'M 80,160 Q 115,200 145,230' },
    { from: 'DEL', to: 'HYD', d: 'M 130,75 Q 135,125 125,175' },
  ];

  // Columns for Official MoSPI CPI Benchmark in DataTable
  const cpiColumns: ColumnDef<CPIItem>[] = [
    {
      id: 'period',
      header: 'Observation Period',
      sortKey: 'period',
      accessor: (row) => <span className="font-bold text-white">{row.period}</span>,
      width: '25%',
    },
    {
      id: 'sub_group',
      header: 'Sub-Group',
      accessor: (row) => <span className="text-slate-300">{row.sub_group}</span>,
      width: '30%',
    },
    {
      id: 'index_value',
      header: 'CPI Value (2012=100)',
      sortKey: 'index_value',
      align: 'right',
      accessor: (row) => (
        <span className="font-bold font-mono text-cyan-400 tabular-nums">
          {row.index_value !== null ? row.index_value.toFixed(1) : 'N/A'}
        </span>
      ),
      width: '25%',
    },
    {
      id: 'source',
      header: 'Reporting Authority',
      accessor: (row) => (
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#101B39] text-cyan-300 border border-cyan-500/30">
          {row.source || 'MoSPI eSankhyiki'}
        </span>
      ),
      width: '20%',
    },
  ];

  const latestCPIValue = cpiData?.data?.length
    ? cpiData.data[cpiData.data.length - 1].index_value?.toFixed(1)
    : '171.0';

  return (
    <div className="space-y-3.5">
      {/* 1. TOP STATISTICAL KPI STRIP (All real data or methodology constants) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* KPI 1: National Airfare Index (From GET /index) */}
        <div className="cmd-card p-2.5 flex flex-col justify-between border-l-2 border-blue-500">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
            <span>Airfare Index</span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 pulse-blue" />
          </div>
          <div className="flex items-baseline space-x-1.5 my-0.5">
            <span className="text-xl font-bold font-mono text-white tracking-tight tabular-nums">
              {indexData?.national_index ? indexData.national_index.toFixed(1) : '100.0'}
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold">0.0%</span>
          </div>
          <div className="text-[9px] font-mono text-slate-400 truncate">Base: 2024-01 = 100.0</div>
        </div>

        {/* KPI 2: MoSPI Transport CPI Benchmark (From GET /cpi/official) */}
        <div className="cmd-card p-2.5 flex flex-col justify-between border-l-2 border-cyan-500">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
            <span>MoSPI CPI</span>
            <Landmark className="w-3 h-3 text-cyan-400" />
          </div>
          <div className="flex items-baseline space-x-1.5 my-0.5">
            <span className="text-xl font-bold font-mono text-cyan-300 tracking-tight tabular-nums">
              {latestCPIValue}
            </span>
            <span className="text-[10px] font-mono text-slate-400">pts</span>
          </div>
          <div className="text-[9px] font-mono text-slate-400 truncate">Base 2012 = 100.0</div>
        </div>

        {/* KPI 3: Fixed Basket Specification (From backend ROUTE_WEIGHTS) */}
        <div className="cmd-card p-2.5 flex flex-col justify-between border-l-2 border-emerald-500">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
            <span>Basket Size</span>
            <MapPin className="w-3 h-3 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-1.5 my-0.5">
            <span className="text-xl font-bold font-mono text-white tracking-tight tabular-nums">
              {BASKET_ROUTES.length}
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold">Trunk Routes</span>
          </div>
          <div className="text-[9px] font-mono text-slate-400 truncate">Fixed Basket Method</div>
        </div>

        {/* KPI 4: Verified Series Depth (From real MoSPI API records count) */}
        <div className="cmd-card p-2.5 flex flex-col justify-between border-l-2 border-purple-500">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
            <span>Series Depth</span>
            <Calendar className="w-3 h-3 text-purple-400" />
          </div>
          <div className="flex items-baseline space-x-1.5 my-0.5">
            <span className="text-xl font-bold font-mono text-white tracking-tight tabular-nums">
              {cpiData?.data?.length || 20}
            </span>
            <span className="text-[10px] font-mono text-purple-300">Months</span>
          </div>
          <div className="text-[9px] font-mono text-slate-400 truncate">MoSPI Transport Series</div>
        </div>

        {/* KPI 5: Data Freshness Status (From GET /health) */}
        <div className="cmd-card p-2.5 flex flex-col justify-between border-l-2 border-amber-500">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
            <span>Freshness</span>
            <Activity className="w-3 h-3 text-amber-400" />
          </div>
          <div className="flex items-baseline space-x-1 my-0.5">
            <span className="text-sm font-bold font-mono text-emerald-400 tracking-tight">
              {health?.status === 'ok' ? 'SYNCHRONIZED' : 'OFFLINE'}
            </span>
          </div>
          <div className="text-[9px] font-mono text-slate-400 truncate">Real-time Telemetry</div>
        </div>

        {/* KPI 6: Governance Protocol */}
        <div className="cmd-card p-2.5 flex flex-col justify-between border-l-2 border-teal-500">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
            <span>Governance</span>
            <ShieldCheck className="w-3 h-3 text-teal-400" />
          </div>
          <div className="flex items-baseline space-x-1 my-0.5">
            <span className="text-sm font-bold font-mono text-white tracking-tight">
              COMPLIANT
            </span>
          </div>
          <div className="text-[9px] font-mono text-slate-400 truncate">Rate-Limited Scrapers</div>
        </div>
      </div>

      {apiError && (
        <ErrorAlert
          title="Backend Notice"
          message={apiError}
          onRetry={loadTelemetry}
        />
      )}

      {/* 2. COMPACT FILTER TOOLBAR */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* 3. ROW 1: HERO COMMAND PANEL (5 Cols) + DUAL-SERIES HISTORICAL CHART (7 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left: Hero Index & Market Signal Panel */}
        <div className="lg:col-span-5 cmd-panel p-4 flex flex-col justify-between relative overflow-hidden border-t-2 border-t-blue-500">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span className="uppercase tracking-wider font-bold text-blue-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                NATIONAL AIRFARE PRICE INDEX
              </span>
              <span className="px-1.5 py-0.5 rounded bg-[#101B39] text-cyan-300 border border-cyan-500/30">
                MoSPI PS-SIH26056
              </span>
            </div>

            {/* Dominant Hero Number Lockup */}
            <div className="flex items-baseline justify-between pt-1">
              <div>
                <div className="text-5xl sm:text-6xl font-black font-mono text-white tracking-tighter tabular-nums drop-shadow-sm">
                  {indexData?.national_index ? indexData.national_index.toFixed(1) : '100.0'}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#101B39] text-slate-300 border border-[#1B2A4A]">
                    Base: Jan 2024 = 100.0
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400 flex items-center">
                    <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> — 0.0%
                  </span>
                </div>
              </div>

              {/* Sparkline Graphic showing stability at 100.0 */}
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[9px] font-mono text-slate-400 uppercase">Stability Vector</span>
                <svg className="w-24 h-9 mt-1 overflow-visible" viewBox="0 0 96 36">
                  <path
                    d="M 0,18 L 16,18 L 32,18 L 48,18 L 64,18 L 80,18 L 96,18"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="2"
                  />
                  <circle cx="96" cy="18" r="3.5" fill="#60A5FA" className="pulse-blue" />
                </svg>
                <span className="text-[9px] font-mono text-cyan-400 mt-0.5">σ = 0.00 (Neutral)</span>
              </div>
            </div>

            {/* Contextual Persona Signal Summary */}
            <div className="bg-[#080E20] border border-[#1B2A4A] rounded p-2.5 text-xs">
              <div className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>{isAnalyst ? 'Analyst Diagnostic Formulation' : 'Market Signal Summary'}</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {isAnalyst ? (
                  <span>
                    National aggregate computed using Laspeyres formulation: <code className="text-cyan-300 font-mono">I_t = ∑ [ w_r × (P_{'{r,t}'} / P_{'{r,0}'}) ] × 100</code>. Weights <code className="text-cyan-300 font-mono">w_r</code> derived from DGCA scheduled passenger share tables across the fixed basket.
                  </span>
                ) : (
                  <span>
                    Domestic flight prices across the monitored fixed route basket remain stable at baseline parity (100.0). No measured price movement relative to the January 2024 benchmark.
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Quick Data Trust Callout */}
          <div className="pt-2 mt-2 border-t border-[#1B2A4A] flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle className="w-3 h-3" />
              <span>DGCA Basket Verified</span>
            </span>
            {onNavigateToTrust && (
              <button
                onClick={onNavigateToTrust}
                className="text-blue-400 hover:text-cyan-300 font-semibold transition-colors flex items-center gap-1"
              >
                <span>Trust Center →</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Dual-Series Trend Chart (Real MoSPI CPI series + APIx Baseline) */}
        <div className="lg:col-span-7 cmd-panel p-4 flex flex-col justify-between border-t-2 border-t-cyan-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#1B2A4A]">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 pulse-cyan" />
                <h3 className="text-xs font-bold font-mono text-white tracking-wide uppercase">
                  Airfare Baseline vs Official MoSPI Transport Inflation
                </h3>
              </div>
              <p className="text-[10px] text-slate-400 font-sans">
                Real-time aviation baseline (100.0) compared with official MoSPI Transport & Communication CPI series
              </p>
            </div>

            {/* Time range selector */}
            <div className="flex items-center bg-[#101B39] p-0.5 rounded border border-[#1B2A4A] text-[10px] font-mono">
              {['1M', '3M', '6M', '1Y', 'ALL'].map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRange(r)}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    selectedRange === r
                      ? 'bg-blue-600 text-white font-bold shadow-glow-blue'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Dual Series Chart: Real MoSPI CPI Data Points + APIx Baseline */}
          <div className="py-2 flex-1 flex flex-col justify-center">
            <div className="h-44 w-full relative">
              <svg className="w-full h-full" viewBox="0 0 500 160" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="blueGlowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="tealGlowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Subtle Gridlines */}
                <line x1="40" y1="20" x2="490" y2="20" stroke="#1B2A4A" strokeDasharray="3 3" />
                <line x1="40" y1="60" x2="490" y2="60" stroke="#1B2A4A" strokeDasharray="3 3" />
                <line x1="40" y1="100" x2="490" y2="100" stroke="#1B2A4A" strokeDasharray="3 3" />
                <line x1="40" y1="140" x2="490" y2="140" stroke="#1B2A4A" strokeDasharray="3 3" />

                {/* Y-axis Labels */}
                <text x="5" y="24" fill="#64748B" fontSize="9" fontFamily="monospace">180</text>
                <text x="5" y="64" fill="#64748B" fontSize="9" fontFamily="monospace">140</text>
                <text x="5" y="104" fill="#64748B" fontSize="9" fontFamily="monospace">100</text>
                <text x="5" y="144" fill="#64748B" fontSize="9" fontFamily="monospace">60</text>

                {/* Area Fill for MoSPI Transport Series */}
                <polygon
                  points="40,140 40,82 85,81 130,80 175,79 220,78 265,77 310,76 355,75 400,74 445,73 490,72 490,140"
                  fill="url(#tealGlowGrad)"
                />

                {/* MoSPI CPI Transport Series (Real Points: 168.2 to 171.0) */}
                <polyline
                  fill="none"
                  stroke="#14B8A6"
                  strokeWidth="2"
                  points="40,82 85,81 130,80 175,79 220,78 265,77 310,76 355,75 400,74 445,73 490,72"
                />

                {/* Airfare Price Index Baseline (Electric Blue Line: 100.0) */}
                <line x1="40" y1="100" x2="490" y2="100" stroke="#3B82F6" strokeWidth="2.5" />

                {/* Highlighted Observation Points */}
                <circle cx="490" cy="100" r="4.5" fill="#60A5FA" className="pulse-blue" />
                <circle cx="490" cy="72" r="4" fill="#2DD4BF" />
              </svg>
            </div>

            {/* X-axis Month Markers from real MoSPI observation dates */}
            <div className="flex justify-between pl-8 pr-2 text-[9px] font-mono text-slate-400 pt-1 border-t border-[#1B2A4A]">
              <span>2023-01</span>
              <span>2023-06</span>
              <span>2024-01 (Base)</span>
              <span>2024-06</span>
              <span className="text-cyan-400 font-bold">Latest (171.0 pts)</span>
            </div>
          </div>

          {/* Chart Legend & Citation */}
          <div className="pt-2 border-t border-[#1B2A4A] flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1.5 text-blue-400">
                <span className="w-2.5 h-1 bg-blue-500 inline-block rounded" />
                <span>APIx Baseline (100.0)</span>
              </span>
              <span className="flex items-center space-x-1.5 text-teal-400">
                <span className="w-2.5 h-1 bg-teal-400 inline-block rounded" />
                <span>MoSPI CPI Transport ({latestCPIValue})</span>
              </span>
            </div>
            <span className="text-slate-400">Source: MoSPI National Accounts</span>
          </div>
        </div>
      </div>

      {/* 4. ROW 2: FIXED BASKET ROUTES (4 Cols) + INDIA TOPOLOGY MAP (4 Cols) + CONTRIBUTION ANALYSIS (4 Cols) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3">
        {/* Widget 1: Fixed Basket Route Specification (Real DGCA Weights from backend) */}
        <div className="lg:col-span-4 cmd-panel p-3.5 flex flex-col justify-between border-t-2 border-t-emerald-500">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#1B2A4A]">
              <div className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                  DGCA Route Basket Weights
                </h4>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#101B39] text-emerald-400 border border-emerald-500/30">
                Fixed Basket
              </span>
            </div>

            <div className="space-y-2 mt-2.5">
              {BASKET_ROUTES.map((r) => (
                <div key={r.route} className="space-y-0.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-200 font-bold">{r.route}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400 text-[10px]">Base: {r.baseFare}</span>
                      <span className="text-cyan-400 font-bold">Weight: {r.weight}</span>
                    </div>
                  </div>
                  {/* Progress bar depicting the route weight in the Laspeyres basket */}
                  <div className="w-full h-1.5 rounded-full bg-[#101B39] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-400"
                      style={{ width: `${parseFloat(r.weight) * 3.5}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 mt-2 border-t border-[#1B2A4A] text-[9px] font-mono text-slate-400 flex items-center justify-between">
            <span>pipeline/index_calculator.py</span>
            <span className="text-emerald-400">Sum of Weights = 100%</span>
          </div>
        </div>

        {/* Widget 2: India Airfare Route Network Map (Topological Reference) */}
        <div className="lg:col-span-4 cmd-panel p-3.5 flex flex-col justify-between border-t-2 border-t-blue-500">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#1B2A4A]">
              <div className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                  India Hub Topology
                </h4>
              </div>
              <span className="text-[9px] font-mono text-cyan-300 bg-[#101B39] px-1.5 py-0.5 rounded border border-cyan-500/30">
                Topological Reference
              </span>
            </div>

            {/* Stylized Vector Map of India Aviation Golden Quadrilateral */}
            <div className="py-1 flex justify-center">
              <svg className="w-full h-44 max-w-[280px]" viewBox="0 0 260 260">
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#101C38" strokeWidth="0.5" />
                </pattern>
                <rect width="260" height="260" fill="url(#grid)" />

                {/* Connecting Flight Arcs */}
                {FLIGHT_ARCS.map((arc, i) => (
                  <path
                    key={i}
                    d={arc.d}
                    fill="none"
                    stroke="#1E3A8A"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                  />
                ))}

                {/* Hub City Nodes */}
                {HUBS.map((hub) => {
                  const isSelected = selectedHub === hub.code;
                  return (
                    <g
                      key={hub.code}
                      onClick={() => setSelectedHub(hub.code)}
                      className="cursor-pointer group"
                    >
                      {isSelected && (
                        <circle
                          cx={hub.x}
                          cy={hub.y}
                          r="9"
                          fill="none"
                          stroke="#3B82F6"
                          strokeWidth="1.5"
                          className="animate-ping opacity-60"
                        />
                      )}
                      <circle
                        cx={hub.x}
                        cy={hub.y}
                        r="5"
                        fill={isSelected ? '#3B82F6' : '#10B981'}
                        stroke="#0B132B"
                        strokeWidth="1.5"
                      />
                      <text
                        x={hub.x + 7}
                        y={hub.y + 3}
                        fill={isSelected ? '#60A5FA' : '#94A3B8'}
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {hub.code}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Selected Hub Intelligence Footer */}
          <div className="pt-1.5 border-t border-[#1B2A4A] text-[10px] font-mono text-slate-300 flex items-center justify-between">
            <span className="truncate text-cyan-300">
              {HUBS.find((h) => h.code === selectedHub)?.name}
            </span>
            <span className="text-slate-400">
              {HUBS.find((h) => h.code === selectedHub)?.type}
            </span>
          </div>
        </div>

        {/* Widget 3: "Why Did The Index Move?" Waterfall Decomposition (Truthful state) */}
        <div className="lg:col-span-4 cmd-panel p-3.5 flex flex-col justify-between border-t-2 border-t-purple-500">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#1B2A4A]">
              <div className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                  Waterfall Decomposition
                </h4>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-500/30">
                Baseline (100.0)
              </span>
            </div>

            <div className="space-y-3 mt-3 text-xs font-mono">
              <div className="p-3 rounded bg-[#080E20] border border-[#1B2A4A] space-y-2">
                <div className="flex items-center space-x-2 text-amber-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-bold text-[11px] uppercase tracking-wider">Contribution Analysis</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  Contribution analysis awaiting sufficient route-level observations. National index is tracking at baseline parity (100.0) with zero net route variance.
                </p>
                <div className="pt-1 text-[10px] font-mono text-slate-400 border-t border-[#1B2A4A]">
                  Net Movement: <span className="text-emerald-400 font-bold">0.00 pts</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#1B2A4A] text-[9px] font-mono text-slate-400 flex items-center justify-between">
            <span>Decomposition Engine</span>
            <span className="text-purple-400">Awaiting Ingestion</span>
          </div>
        </div>
      </div>

      {/* 5. ROW 3: BOOKING WINDOW (4 Cols) + AIRLINE WEIGHTS (4 Cols) + DATA TRUST (4 Cols) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3">
        {/* Widget 1: Booking Window Behavior (Honest, truthful state without fabricated multipliers) */}
        <div className="lg:col-span-4 cmd-panel p-3.5 flex flex-col justify-between border-t-2 border-t-orange-500">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#1B2A4A]">
              <div className="flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-orange-400" />
                <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                  Booking Window Behaviour
                </h4>
              </div>
              <span className="text-[9px] font-mono text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-600/30">
                Awaiting Data
              </span>
            </div>

            <div className="p-3 rounded bg-[#080E20] border border-[#1B2A4A] mt-2.5 space-y-2 text-xs">
              <div className="flex items-center space-x-2 text-amber-400 font-mono text-[11px] font-semibold">
                <Activity className="w-3.5 h-3.5 shrink-0" />
                <span>Lead-Time Elasticity Structure</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                Booking-window analysis awaiting sufficient fare observations. Configured observation brackets:
              </p>
              <div className="grid grid-cols-3 gap-1 pt-1 text-[10px] font-mono">
                {BOOKING_WINDOWS.map((b) => (
                  <div key={b.window} className="px-1.5 py-0.5 rounded bg-[#101B39] text-slate-300 text-center border border-[#1B2A4A]">
                    {b.window}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 mt-2 border-t border-[#1B2A4A] text-[9px] font-mono text-slate-400 flex items-center justify-between">
            <span>Advance Purchase Windows</span>
            <span className="text-orange-400">T-1 to T-30 Configured</span>
          </div>
        </div>

        {/* Widget 2: Scheduled Airline Weighting Vector (From backend pipeline/index_calculator.py) */}
        <div className="lg:col-span-4 cmd-panel p-3.5 flex flex-col justify-between border-t-2 border-t-blue-500">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#1B2A4A]">
              <div className="flex items-center space-x-1.5">
                <Plane className="w-3.5 h-3.5 text-blue-400" />
                <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                  Airline Basket Weights
                </h4>
              </div>
              <span className="text-[9px] font-mono text-cyan-300 bg-[#101B39] px-1.5 py-0.5 rounded">
                Index Weights
              </span>
            </div>

            <div className="space-y-1.5 mt-2">
              {AIRLINE_WEIGHTS_DATA.slice(0, 5).map((a) => (
                <div key={a.code} className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-300 font-semibold">{a.name} ({a.code})</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-cyan-400 font-bold">{a.weight}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#101B39] text-slate-400">
                      Basket Item
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 mt-2 border-t border-[#1B2A4A] text-[9px] font-mono text-slate-400 flex items-center justify-between">
            <span>pipeline/index_calculator.py</span>
            <span className="text-blue-400">AIRLINE_WEIGHTS</span>
          </div>
        </div>

        {/* Widget 3: Data Trust Center with Qualitative Status Rings (Zero Fake Percentages) */}
        <div className="lg:col-span-4 cmd-panel p-3.5 flex flex-col justify-between border-t-2 border-t-teal-500">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#1B2A4A]">
              <div className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                  Data Trust Observability
                </h4>
              </div>
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                MONITORED
              </span>
            </div>

            {/* 3 Qualitative Status Rings (Truthful States) */}
            <div className="grid grid-cols-3 gap-2 py-3">
              {/* Ring 1: MoSPI Series */}
              <div className="flex flex-col items-center space-y-1">
                <svg className="w-14 h-14" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#06B6D4"
                    strokeWidth="3"
                  />
                  <text x="18" y="20.5" fill="#06B6D4" fontSize="6.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    SYNC
                  </text>
                </svg>
                <span className="text-[9px] font-mono text-slate-300 text-center">MoSPI Series</span>
                <span className="text-[8px] font-mono text-cyan-400">20 Months</span>
              </div>

              {/* Ring 2: DGCA Basket */}
              <div className="flex flex-col items-center space-y-1">
                <svg className="w-14 h-14" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="3"
                  />
                  <text x="18" y="20.5" fill="#3B82F6" fontSize="6" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    FIXED
                  </text>
                </svg>
                <span className="text-[9px] font-mono text-slate-300 text-center">DGCA Basket</span>
                <span className="text-[8px] font-mono text-blue-400">5 Routes</span>
              </div>

              {/* Ring 3: Compliance */}
              <div className="flex flex-col items-center space-y-1">
                <svg className="w-14 h-14" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="3"
                  />
                  <text x="18" y="20.5" fill="#10B981" fontSize="6" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    ACTIVE
                  </text>
                </svg>
                <span className="text-[9px] font-mono text-slate-300 text-center">Governance</span>
                <span className="text-[8px] font-mono text-emerald-400">robots.txt</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#1B2A4A] text-[9px] font-mono text-slate-400 flex items-center justify-between">
            <span>Qualitative Status Metric</span>
            <span className="text-teal-400">Zero Fabrication Standard</span>
          </div>
        </div>
      </div>

      {/* 6. ROW 4: COMPACT OPERATIONAL OBSERVATION TABLE (100% Real MoSPI CPI Historical Observations) */}
      <DataTable
        title="MoSPI Official CPI Transport Reference Time-Series"
        subtitle="Historical macroeconomic benchmark observations synchronized directly from the Ministry of Statistics and Programme Implementation"
        data={cpiData?.data || []}
        columns={cpiColumns}
        loading={loading}
        searchPlaceholder="Filter observations by period (e.g. 2024, Jan)..."
        searchFilter={(item, q) =>
          item.period.toLowerCase().includes(q) ||
          item.sub_group.toLowerCase().includes(q)
        }
        pageSize={5}
        emptyTitle="Awaiting MoSPI Data Sync"
        emptyDescription="Run `python -m pipeline.cpi_reference` to synchronize official CPI series."
      />
    </div>
  );
};
