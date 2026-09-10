import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Download 
} from 'lucide-react';
import { api } from '../../api/client';
import type { HealthResponse } from '../../api/types';
import { useDemoMode } from '../../context/DemoModeContext';

interface ProvenanceItem {
  metric: string;
  value: string;
  category: 'REAL' | 'CALCULATED' | 'EMPIRICAL' | 'DEMO / CALIBRATED' | 'FALLBACK' | 'TEST FIXTURE';
  source: string;
  status: string;
  method: string;
  period: string;
}

const PROVENANCE_CATALOG: ProvenanceItem[] = [
  {
    metric: 'MoSPI CPI Transport Reference (6.1.03)',
    value: '164.2 to 171.0 (20 monthly observations)',
    category: 'REAL',
    source: 'Ministry of Statistics & Programme Implementation (MoSPI) eSankhyiki Portal',
    status: 'Authoritative Official Data',
    method: 'Direct API ingestion & local immutable cache validation',
    period: 'March 2023 – December 2024',
  },
  {
    metric: 'DGCA Domestic City-Pair Passenger Weights',
    value: '39,546,200 Pax (11 corridors, w_r sum = 1.000)',
    category: 'CALCULATED',
    source: 'Directorate General of Civil Aviation (DGCA) Domestic Traffic Statistics',
    status: 'Calculated Prototype Weights',
    method: 'Proportional passenger share: w_r = Pax_r / Sum(Pax_11)',
    period: 'Calendar Year 2023 / Jan 2024 Reference',
  },
  {
    metric: 'Live Airfare Quotes (Base + Tax decomposition)',
    value: '₹2,800 – ₹19,500 (Economy Class Quotes)',
    category: 'EMPIRICAL',
    source: 'Public Airline Schedules & Aggregator Portals (IndiGo, Air India, MakeMyTrip)',
    status: 'Observed Scraped Telemetry',
    method: 'Automated Playwright browser automation (Zero PII extracted)',
    period: 'Daily automated scrape cycles',
  },
  {
    metric: 'APIx Headline Airfare Index Level',
    value: '105.4 (Inflation +5.4%)',
    category: 'CALCULATED',
    source: 'APIx Two-Tier Statistical Aggregation Engine',
    status: 'Calculated Prototype Index',
    method: 'Jevons micro geometric mean + Laspeyres fixed national aggregation',
    period: 'December 2024 (Base: Jan 2024 = 100.0)',
  },
  {
    metric: 'Lead-Time Surge Benchmark (+83.7%)',
    value: '+83.7% fare uplift (₹8,450 vs ₹4,600 baseline)',
    category: 'DEMO / CALIBRATED',
    source: 'Representative DEL-BOM non-stop sample (N=24 flights)',
    status: 'Calibrated Demonstration Value',
    method: 'T+1 next-day emergency vs T+30 baseline price ratio: (P_T1 / P_T30) - 1',
    period: 'Representative calibrated DEL-BOM sample (Not a national statistic)',
  },
  {
    metric: 'Offline Seed Demonstration Dataset',
    value: '11 routes × 5 horizons × 20 historical periods',
    category: 'FALLBACK',
    source: 'Internal verified offline seed fixtures (cpi_reference_cache.json)',
    status: 'Graceful Fallback Mode',
    method: 'Activated automatically when PostgreSQL/external network is unreachable',
    period: 'Continuous offline reliability guardrail',
  },
  {
    metric: 'Deterministic Benchmark Suite (46 Tests)',
    value: '100% Pass (Known hand-calculated mathematical cases)',
    category: 'TEST FIXTURE',
    source: 'Pytest test suite (tests/test_statistical_engine.py)',
    status: 'Deterministic Unit Verification',
    method: 'Verifies Jevons geometric mean, Laspeyres sum, and Tukey IQR bounds',
    period: 'Local CI/CD validation run',
  },
];

export const DataTrustView: React.FC = () => {
  const { isDemoMode } = useDemoMode();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await api.getHealth();
      setHealth(res);
    } catch {
      // Offline fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, [isDemoMode]);

  const isConnected = health?.status === 'ok';

  const filtered = PROVENANCE_CATALOG.filter(
    (item) => filterCategory === 'ALL' || item.category === filterCategory
  );

  const handleExportJSON = () => {
    const report = {
      generated_at: new Date().toISOString(),
      platform: 'APIx — Airfare Price Intelligence for India (SIH26056)',
      provenance_framework: 'Six-Tier Data Provenance System',
      audit_records: PROVENANCE_CATALOG,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `APIx_Data_Trust_Provenance_Matrix.json`;
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
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
              TRANSPARENCY & DATA PROVENANCE
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-mono text-slate-500">6-Tier Provenance Classification System</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Data Trust Center & Forensic Provenance Matrix
          </h1>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Every number, statistic, and chart in APIx is classified with complete source traceability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            title="Refresh system health"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <button
            onClick={handleExportJSON}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Provenance Audit</span>
          </button>
        </div>
      </div>

      {/* 2. THE 6 PROVENANCE CATEGORIES VISUAL CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block mb-1.5">
            REAL
          </span>
          <h4 className="text-xs font-bold text-slate-900">Official Statutory</h4>
          <p className="text-[11px] text-slate-500 mt-1 leading-snug">
            Direct from MoSPI/DGCA official releases without alterations.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 inline-block mb-1.5">
            CALCULATED
          </span>
          <h4 className="text-xs font-bold text-slate-900">Formula Derived</h4>
          <p className="text-[11px] text-slate-500 mt-1 leading-snug">
            Derived via mathematical formula (Jevons, Laspeyres, weights).
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200 inline-block mb-1.5">
            EMPIRICAL
          </span>
          <h4 className="text-xs font-bold text-slate-900">Scraped Fares</h4>
          <p className="text-[11px] text-slate-500 mt-1 leading-snug">
            Directly collected observations from airline public fare schedules.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 inline-block mb-1.5">
            DEMO / CALIBRATED
          </span>
          <h4 className="text-xs font-bold text-slate-900">Representative Case</h4>
          <p className="text-[11px] text-slate-500 mt-1 leading-snug">
            Benchmarked illustrative data points (e.g. DEL-BOM N=24 sample).
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 inline-block mb-1.5">
            FALLBACK
          </span>
          <h4 className="text-xs font-bold text-slate-900">Offline Fixtures</h4>
          <p className="text-[11px] text-slate-500 mt-1 leading-snug">
            Immutable offline fixtures active when network/PostgreSQL is down.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 inline-block mb-1.5">
            TEST FIXTURE
          </span>
          <h4 className="text-xs font-bold text-slate-900">Pytest Deterministic</h4>
          <p className="text-[11px] text-slate-500 mt-1 leading-snug">
            Deterministic synthetic cases for algorithmic math verification.
          </p>
        </div>
      </div>

      {/* 3. FORENSIC PROVENANCE TABLE (SECTION 25 MANDATORY) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wide">
              Complete Data Provenance Matrix
            </h3>
            <span className="text-[11px] text-slate-500 font-sans">
              "Where did this number come from?" — Verification ledger for all major platform statistics
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            {['ALL', 'REAL', 'CALCULATED', 'EMPIRICAL', 'DEMO / CALIBRATED', 'FALLBACK', 'TEST FIXTURE'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                  filterCategory === cat
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-mono text-slate-600 uppercase">
                <th className="py-2.5 px-4">Metric & Value</th>
                <th className="py-2.5 px-4">Provenance Category</th>
                <th className="py-2.5 px-4">Authoritative Source</th>
                <th className="py-2.5 px-4">Calculation / Acquisition Method</th>
                <th className="py-2.5 px-4">Evaluation Period</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.metric} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">{item.metric}</span>
                    <span className="font-mono text-blue-700 text-[11px] mt-0.5 block">{item.value}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      item.category === 'REAL' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      item.category === 'CALCULATED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      item.category === 'EMPIRICAL' ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' :
                      item.category === 'DEMO / CALIBRATED' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      item.category === 'FALLBACK' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                      'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}>
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">{item.source}</td>
                  <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{item.method}</td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{item.period}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. OPERATIONAL SYSTEM HEALTH STATUS */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          <span className="font-bold text-slate-900">
            Backend Telemetry Status: {isConnected ? 'Online & Ready (Port 5000)' : 'Offline Demonstration Cache Active'}
          </span>
        </div>
        <div className="flex items-center gap-4 text-slate-500 font-mono text-[11px]">
          <span>Database: PostgreSQL (or in-memory cache)</span>
          <span>FastAPI: v0.115</span>
          <span>Scraper Engine: Playwright Chromium</span>
        </div>
      </div>
    </div>
  );
};
