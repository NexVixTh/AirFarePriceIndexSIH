import React, { useState, useEffect } from 'react';
import { 
  Plane, 
  ArrowRightLeft, 
  Percent, 
  Landmark, 
  PieChart, 
  ShieldCheck, 
  RefreshCw, 
  Download 
} from 'lucide-react';
import { api } from '../../api/client';
import type { IndexResponse } from '../../api/types';
import { useDemoMode } from '../../context/DemoModeContext';
import { ErrorAlert } from '../../components/common/ErrorAlert';

// Subcomponents
import { CarrierMarketShareCard, AIRLINE_CATALOG } from './CarrierMarketShareCard';
import { DirectVsOTAParityWidget } from './DirectVsOTAParityWidget';
import { AncillaryFeeBenchmarkWidget } from './AncillaryFeeBenchmarkWidget';

export const AirlineOTAView: React.FC = () => {
  const { isDemoMode } = useDemoMode();

  const [indexData, setIndexData] = useState<IndexResponse | null>(null);
  const [selectedCarrier, setSelectedCarrier] = useState<string | null>('6E');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAirlineTelemetry = async () => {
    setLoading(true);
    setError(null);
    try {
      const idx = await api.getIndex();
      setIndexData(idx);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed loading airline telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAirlineTelemetry();
  }, [isDemoMode]);

  const handleExportJSON = () => {
    const report = {
      generated_at: new Date().toISOString(),
      airline_catalog: AIRLINE_CATALOG,
      airline_indices: indexData?.airline_indices || {},
      direct_vs_ota: 'Direct Airline GDS Parity (Zero Drift)',
      ancillary_breakdown: {
        base_fare_percent: 68,
        fuel_surcharge_percent: 12,
        udf_adf_percent: 9,
        gst_percent: 5,
        psf_percent: 3,
        convenience_fee_percent: 3,
      },
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `airline_ota_parity_report_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-3.5">
      {/* 1. TOP AIRLINE & OTA KPI STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* KPI 1: Scheduled Carriers */}
        <div className="cmd-card p-2.5 flex flex-col justify-between border-l-2 border-blue-500">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
            <span>Carriers</span>
            <Plane className="w-3 h-3 text-blue-400" />
          </div>
          <div className="flex items-baseline space-x-1.5 my-0.5">
            <span className="text-xl font-bold font-mono text-white tracking-tight tabular-nums">
              7
            </span>
            <span className="text-[10px] font-mono text-blue-300">Airlines</span>
          </div>
          <div className="text-[9px] font-mono text-slate-400 truncate">DGCA Scheduled Fleet</div>
        </div>

        {/* KPI 2: Channel Parity Spread */}
        <div className="cmd-card p-2.5 flex flex-col justify-between border-l-2 border-emerald-500">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
            <span>Channel Spread</span>
            <ArrowRightLeft className="w-3 h-3 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-1.5 my-0.5">
            <span className="text-xl font-bold font-mono text-white tracking-tight tabular-nums">
              ±0.0%
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold">Parity</span>
          </div>
          <div className="text-[9px] font-mono text-slate-400 truncate">Direct vs OTA Baseline</div>
        </div>

        {/* KPI 3: Market Leader */}
        <div className="cmd-card p-2.5 flex flex-col justify-between border-l-2 border-cyan-500">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
            <span>Market Leader</span>
            <Percent className="w-3 h-3 text-cyan-400" />
          </div>
          <div className="flex items-baseline space-x-1.5 my-0.5">
            <span className="text-base font-bold font-mono text-cyan-300 tracking-tight">
              IndiGo (6E)
            </span>
            <span className="text-[10px] font-mono text-cyan-400 font-semibold">27.0%</span>
          </div>
          <div className="text-[9px] font-mono text-slate-400 truncate">Passenger Traffic Share</div>
        </div>

        {/* KPI 4: Full Service Share */}
        <div className="cmd-card p-2.5 flex flex-col justify-between border-l-2 border-purple-500">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
            <span>FSC Share</span>
            <Landmark className="w-3 h-3 text-purple-400" />
          </div>
          <div className="flex items-baseline space-x-1.5 my-0.5">
            <span className="text-xl font-bold font-mono text-white tracking-tight tabular-nums">
              28.0%
            </span>
          </div>
          <div className="text-[9px] font-mono text-slate-400 truncate">Air India + Vistara</div>
        </div>

        {/* KPI 5: Base Airfare Share */}
        <div className="cmd-card p-2.5 flex flex-col justify-between border-l-2 border-amber-500">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
            <span>Base Fare Ratio</span>
            <PieChart className="w-3 h-3 text-amber-400" />
          </div>
          <div className="flex items-baseline space-x-1.5 my-0.5">
            <span className="text-xl font-bold font-mono text-white tracking-tight tabular-nums">
              68.0%
            </span>
          </div>
          <div className="text-[9px] font-mono text-slate-400 truncate">Headline Ticket Share</div>
        </div>

        {/* KPI 6: Statutory Compliance */}
        <div className="cmd-card p-2.5 flex flex-col justify-between border-l-2 border-teal-500">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
            <span>Compliance</span>
            <ShieldCheck className="w-3 h-3 text-teal-400" />
          </div>
          <div className="flex items-baseline space-x-1 my-0.5">
            <span className="text-sm font-bold font-mono text-white tracking-tight">
              AERA / DGCA
            </span>
          </div>
          <div className="text-[9px] font-mono text-slate-400 truncate">Audited Transparency</div>
        </div>
      </div>

      {/* Error Alert */}
      {error && <ErrorAlert message={error} onRetry={fetchAirlineTelemetry} />}

      {/* 2. TOOLBAR */}
      <div className="cmd-card p-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-mono text-slate-300">
          Monitoring price integrity between scheduled airline reservation systems and OTA aggregators.
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchAirlineTelemetry}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1 rounded bg-[#070D1E] hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono transition-colors disabled:opacity-50"
            title="Refresh carrier telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="flex items-center space-x-1.5 px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono transition-colors shadow-sm"
            title="Export airline and parity report as JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* 3. ROW 1: CARRIER MARKET WEIGHTS (7 cols) + DIRECT VS OTA PARITY (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        <div className="lg:col-span-7">
          <CarrierMarketShareCard
            indexData={indexData}
            selectedCarrier={selectedCarrier}
            onSelectCarrier={(c) => setSelectedCarrier(c)}
          />
        </div>
        <div className="lg:col-span-5">
          <DirectVsOTAParityWidget />
        </div>
      </div>

      {/* 4. ROW 2: ANCILLARY FEE BENCHMARK */}
      <AncillaryFeeBenchmarkWidget />
    </div>
  );
};
