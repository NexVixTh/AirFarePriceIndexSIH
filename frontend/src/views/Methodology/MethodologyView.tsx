import React from 'react';
import { 
  Download 
} from 'lucide-react';

interface PipelineStage {
  step: number;
  title: string;
  subtitle: string;
  description: string;
  formula?: string;
  inputs: string;
  outputs: string;
  codeLocation: string;
}

const PIPELINE_STAGES: PipelineStage[] = [
  {
    step: 1,
    title: 'Observation',
    subtitle: 'Public Fare Data Acquisition',
    description: 'Automated Playwright browser fleet observes live fare schedules and tax quotes across carriers (IndiGo, Air India, SpiceJet) and OTAs (MakeMyTrip) across 5 discrete advance booking horizons (T+1 to T+45). Strictly zero PII is acquired.',
    inputs: 'Carrier public booking portals and published flight schedules',
    outputs: 'Raw flight fare quotes with carrier, flight number, cabin, and timestamps',
    codeLocation: 'scrapers/playwright_scrapers.py & scrapers/orchestrator.py',
  },
  {
    step: 2,
    title: 'Normalization',
    subtitle: 'Base Fare & Tax Decomposition',
    description: 'Decomposes quoted airline prices into pure base fare, fuel surcharges (YQ), Passenger Service Fees (PSF), User Development Fees (UDF), and GST. Standardizes origin-destination pairs to canonical IATA 3-letter airport codes.',
    formula: 'Total Quoted Fare = Base Fare + Statutory Taxes & Airport Surcharges (YQ + UDF + PSF + GST)',
    inputs: 'Unstructured airline price DOM payloads and fare cards',
    outputs: 'Normalized FareQuote records with canonical base fare and discrete booking window',
    codeLocation: 'backend/pipeline/normalizer.py',
  },
  {
    step: 3,
    title: 'Quality Control',
    subtitle: 'Tukey IQR Fence Filtering',
    description: 'Applies statistical guardrails to eliminate artificial distortions. Price quotes below statutory airport tax minimums (₹1,500) are flagged as website glitches. Prices outside Tukey IQR fences are scrubbed to Anomaly review.',
    formula: 'Tukey Outlier Fences: Lower = Q1 - 1.5·IQR | Upper = Q3 + 1.5·IQR (where IQR = Q3 - Q1)',
    inputs: 'Normalized fare observations for corridor r and window h',
    outputs: 'Cleansed observation stream; outliers isolated in anomaly_records table',
    codeLocation: 'backend/pipeline/cleaner.py & backend/statistical/outlier_detector.py',
  },
  {
    step: 4,
    title: 'Price Relative',
    subtitle: 'Carrier Price Ratio Computation',
    description: 'Calculates the price relative of each carrier and flight offering compared against the January 2024 base period benchmark price for that specific city-pair and booking horizon.',
    formula: 'R_{r,h,c,t} = P_{r,h,c,t} / P_{r,h,c,0} (where t is current period, 0 is Jan 2024)',
    inputs: 'Cleansed current price P_t and immutable base period price P_0',
    outputs: 'Dimensionless price relatives for individual flights',
    codeLocation: 'backend/statistical/index_calculator.py',
  },
  {
    step: 5,
    title: 'Jevons Micro-Index',
    subtitle: 'Elementary Geometric Mean Aggregation',
    description: 'Aggregates flight price relatives within each corridor-horizon cell using the unweighted Jevons geometric mean, as recommended by the international Consumer Price Index (ILO/IMF/OECD) manual to eliminate carrier size bias.',
    formula: 'J_{r,h,t} = ( ∏_{i=1}^N R_{r,h,i,t} )^(1 / N) = exp( (1 / N) * ∑ ln(R_{r,h,i,t}) )',
    inputs: 'N price relatives within city-pair r and advance window h',
    outputs: 'Elementary Jevons index level for each corridor-horizon combination',
    codeLocation: 'backend/statistical/index_calculator.py (calculate_jevons_index)',
  },
  {
    step: 6,
    title: 'Route Aggregation',
    subtitle: 'Horizon Weighting into Corridor Relatives',
    description: 'Combines the 5 discrete lead-time horizon Jevons indices (T+1, T+7, T+15, T+30, T+45) into a single composite corridor price relative using empirical passenger booking distribution weights.',
    formula: 'R_{r,t} = ∑_{h} [ w_h * J_{r,h,t} ] (where ∑ w_h = 1.0 across all 5 horizons)',
    inputs: '5 horizon Jevons indices per corridor',
    outputs: 'Single consolidated price relative R_{r,t} for corridor r',
    codeLocation: 'backend/statistical/index_calculator.py',
  },
  {
    step: 7,
    title: 'DGCA Prototype Weighting',
    subtitle: 'Domestic Passenger Volume Calibration',
    description: 'Assigns fixed prototype weights w_r to each corridor based on published Directorate General of Civil Aviation (DGCA) domestic scheduled passenger traffic data across the 11 monitored corridors (39,546,200 total passenger movements).',
    formula: 'w_r = Pax_{r} / ∑_{k=1}^{11} Pax_{k} (Prototype traffic weights strictly sum to 1.000)',
    inputs: 'DGCA annual domestic scheduled city-pair passenger volume statistics',
    outputs: 'Fixed weight vector w_r for 11 domestic trunk corridors (DEL-BOM=0.180, etc.)',
    codeLocation: 'backend/statistical/dgca_weights.py & backend/database/models.py',
  },
  {
    step: 8,
    title: 'National APIx Index',
    subtitle: 'Two-Tier Laspeyres National Aggregate',
    description: 'Aggregates all 11 corridor relatives using the classical fixed-basket Laspeyres formula, indexed to January 2024 = 100.0. An index of 105.4 indicates that national domestic airfares have risen 5.4% above base period levels.',
    formula: 'APIx_t = ∑_{r=1}^{11} [ w_r * R_{r,t} ] * 100.0 | Inflation π_t = ((APIx_t - 100) / 100) * 100%',
    inputs: 'Corridor relatives R_r and DGCA prototype weights w_r',
    outputs: 'Headline National Airfare Price Index (APIx) and corridor contribution points',
    codeLocation: 'backend/statistical/index_calculator.py (calculate_national_index)',
  },
  {
    step: 9,
    title: 'MoSPI CPI Comparison',
    subtitle: 'Descriptive Concordance Backtesting',
    description: 'Evaluates the resulting historical index series alongside 20 months of official MoSPI Consumer Price Index data (Transport Subgroup 6.1.03, March 2023–Dec 2024). Validates high directional concordance (r ≈ 0.98) as a descriptive backtest.',
    formula: 'Pearson r = Cov(APIx, CPI_rebased) / ( σ_APIx * σ_CPI_rebased ) ≈ 0.98',
    inputs: '20-month APIx historical time series and rebased official MoSPI CPI values',
    outputs: 'Descriptive tracking metrics (Pearson r, MAE, RMSE, ±3.1% threshold test)',
    codeLocation: 'backend/statistical/cpi_validator.py & backend/api/routes.py',
  },
];

export const MethodologyView: React.FC = () => {
  const handleExportWhitepaperJSON = () => {
    const report = {
      title: 'APIx Airfare Price Intelligence Methodology Specification (SIH26056)',
      pipeline_stages_count: PIPELINE_STAGES.length,
      base_period: 'Jan 2024 = 100.0',
      elementary_formula: 'Jevons Geometric Mean',
      national_formula: 'Laspeyres Fixed-Basket Aggregation',
      stages: PIPELINE_STAGES,
      generated_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `APIx_Methodology_Specification.json`;
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
              STATISTICAL FORMULATION
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-mono text-slate-500">ILO/IMF/OECD CPI Standards Compliance</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            End-to-End Statistical Methodology
          </h1>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Complete nine-stage computational workflow from raw web observation to national index publication.
          </p>
        </div>

        <button
          onClick={handleExportWhitepaperJSON}
          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-xs"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export Methodology JSON</span>
        </button>
      </div>

      {/* 2. THE COMPLETE 9-STAGE PIPELINE (SECTION 26 REQUIREMENT) */}
      <div className="space-y-4">
        {PIPELINE_STAGES.map((s) => (
          <div 
            key={s.step} 
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-blue-200 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  {s.step}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">{s.title}</h3>
                  <span className="text-xs font-mono text-blue-600">{s.subtitle}</span>
                </div>
              </div>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-2.5 py-1 rounded border border-slate-100">
                {s.codeLocation}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mt-3">
              {s.description}
            </p>

            {s.formula && (
              <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-blue-900">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                  Mathematical Formulation
                </span>
                <div className="font-semibold">{s.formula}</div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100 text-[11px] font-sans">
              <div>
                <span className="font-semibold text-slate-700 uppercase tracking-wider text-[10px] block font-mono">
                  Input Stream:
                </span>
                <span className="text-slate-600">{s.inputs}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-700 uppercase tracking-wider text-[10px] block font-mono">
                  Output Artifact:
                </span>
                <span className="text-slate-600">{s.outputs}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
