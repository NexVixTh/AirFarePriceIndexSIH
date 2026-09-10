import React, { useState } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Maximize2, 
  Minimize2, 
  Clock, 
  HelpCircle, 
  CheckCircle2, 
  Play, 
  RotateCcw
} from 'lucide-react';

interface JudgeStep {
  step: number;
  id: string;
  title: string;
  subtitle: string;
  summary: string;
  keyPoints: string[];
  whatToSay: string;
  expectedQuestion: string;
  expectedAnswer: string;
  provenanceTag: string;
}

const JUDGE_STORY_STEPS: JudgeStep[] = [
  {
    step: 1,
    id: 'problem',
    title: 'The Measurement Crisis in Transport Inflation',
    subtitle: 'Why manual airfare collection fails in an online dynamic economy',
    summary: 'The Consumer Price Index (CPI) Transport subgroup (8.59% weight) currently measures airfares through manual surveys at physical ticketing counters once a month. With over 90% of domestic air tickets now booked online, manual collection fails to capture algorithmic dynamic pricing swings of 200–400% across booking horizons.',
    keyPoints: [
      'Manual price collection at physical counters misses algorithmic yield pricing',
      'Over 90% of domestic tickets are now purchased via online websites and OTAs',
      'Monthly survey publication lag (15–45 days) is too slow for active monetary policy',
      'A digital observation pipeline is essential to eliminate this inflation blind spot',
    ],
    whatToSay: '"Respected judges, Indian consumers buy over 90% of flight tickets online where algorithms adjust fares every hour. Yet our official CPI still relies on manual monthly counter visits. APIx solves this by automating digital price observation."',
    expectedQuestion: 'Does APIx propose replacing the entire Consumer Price Index?',
    expectedAnswer: 'No. APIx is a high-frequency statistical intelligence tool designed specifically for the Transport Subgroup (item 6.1.03) to provide leading indicators to MoSPI and the RBI.',
    provenanceTag: 'PROBLEM DEFINITION',
  },
  {
    step: 2,
    id: 'data',
    title: 'Automated Multi-Source Web Scraping Fleet',
    subtitle: 'Extracting public fare schedules with zero personal identifiable information',
    summary: 'APIx deploys a Playwright Chromium headless browser fleet that monitors major domestic carriers (IndiGo, Air India, SpiceJet) and aggregators (MakeMyTrip). The system collects public fare schedules and tax breakdowns with polite 1.5s–3.5s jitter delays. Strictly zero PII is acquired.',
    keyPoints: [
      'Playwright Chromium headless browser handles dynamic single-page applications',
      'Extracts only public flight schedules and published fares across 5 discrete horizons',
      'Strict zero-PII boundary: no customer, payment, or passenger data is ever collected',
      'Polite rate-limiting jitter (1.5s to 3.5s) respects host platform server stability',
    ],
    whatToSay: '"We built a headless Playwright scraper fleet. It visits airline portals just like a regular consumer browser, extracts published fares, and collects zero personal data, respecting web scraping best practices."',
    expectedQuestion: 'How do you handle airline anti-bot systems and CAPTCHAs?',
    expectedAnswer: 'In our prototype, polite delays and realistic headers are used for public fare inspection. For production deployment, institutional APIs or authorized data partnerships with DGCA/airlines would be the verified long-term pathway.',
    provenanceTag: 'EMPIRICAL ACQUISITION',
  },
  {
    step: 3,
    id: 'cleaning',
    title: 'Fare Normalization & Tukey IQR Outlier Scrubbing',
    subtitle: 'Standardizing raw DOM elements and scrubbing glitches',
    summary: 'Airlines format price breakdowns inconsistently. The APIx normalization pipeline decomposes quoted fares into base fare, fuel surcharges (YQ), and statutory taxes (UDF, PSF, GST). Prices below ₹1,500 (airport tax floor) are flagged as glitches, and extreme outliers outside Tukey IQR fences are scrubbed to anomaly review.',
    keyPoints: [
      'Separates pure Base Fare from statutory taxes (UDF, PSF, GST) and fuel surcharges',
      'Canonical normalization to 3-letter IATA airport codes (DEL, BOM, BLR)',
      'Statutory fee floor guardrail: quotes below ₹1,500 are suppressed as web errors',
      'Tukey IQR fence model: [Q1 - 1.5·IQR, Q3 + 1.5·IQR] isolates spikes from index calculation',
    ],
    whatToSay: '"Raw web prices are noisy. We strip statutory taxes to measure pure airline base fare movement, and apply Tukey IQR fences so sold-out spikes or website glitches do not contaminate national inflation numbers."',
    expectedQuestion: 'What happens to the scrubbed outlier fares?',
    expectedAnswer: 'They are not deleted. They are logged in our anomaly_records table labeled as "Statistical anomalies requiring review" for economist inspection.',
    provenanceTag: 'DATA QUALITY CONTROL',
  },
  {
    step: 4,
    id: 'calculation',
    title: 'Two-Tier Index Formulation (Jevons + Laspeyres)',
    subtitle: 'Elementary geometric mean aggregated with DGCA-derived proxy weights',
    summary: 'Following international CPI manuals (ILO/IMF/OECD), APIx calculates elementary flight relatives using the unweighted Jevons geometric mean to avoid carrier size bias. These are then aggregated into a national index using fixed Laspeyres weights derived from 39,546,200 passenger movements across 11 monitored DGCA corridors.',
    keyPoints: [
      'Stage 1: Elementary Jevons geometric mean J_r,h = (∏ R_i)^(1/N) prevents carrier size bias',
      'Stage 2: Laspeyres national formula APIx = ∑ [ w_r × R_r ] × 100.0 (Base: Jan 2024 = 100.0)',
      'Weights w_r derived from DGCA annual domestic scheduled city-pair traffic (sum = 1.000)',
      'Top 3 corridors (DEL-BOM 18.0%, DEL-BLR 14.5%, BOM-BLR 12.5%) represent 45.0% of basket',
    ],
    whatToSay: '"We follow standard official price index mathematics. At the micro-level, we use the Jevons geometric mean. At the national level, we aggregate using fixed Laspeyres weights derived from DGCA passenger volume across 11 major corridors."',
    expectedQuestion: 'Why use passenger traffic weights instead of consumer expenditure weights?',
    expectedAnswer: 'Air travel passenger expenditure data is proprietary to airlines. Passenger volume from DGCA is publicly verifiable and serves as the most accurate available proxy for economic travel density.',
    provenanceTag: 'STATISTICAL ENGINE',
  },
  {
    step: 5,
    id: 'result',
    title: 'Headline APIx Index & Lead-Time Dynamics',
    subtitle: 'Current price level, corridor contributions, and advance booking uplift',
    summary: 'The resulting prototype index indicates a December 2024 level of 105.4 (+5.4% inflation since January 2024). Sectoral decomposition shows DEL-BOM is the largest single driver (+1.52% pts / 152 bps). In lead-time dynamics, our representative DEL-BOM sample demonstrates a +83.7% fare uplift for next-day emergency booking (T+1).',
    keyPoints: [
      'Current Index Level: 105.4 (Inflation +5.4% above January 2024 base level)',
      'Sectoral attribution: DEL-BOM contributed 152 basis points (+1.52% pts) to headline inflation',
      '5 Discrete Booking Horizons tracked: T+1, T+7, T+15, T+30, T+45 days',
      'Lead-time uplift: Emergency next-day (T+1) fare surge of +83.7% in calibrated DEL-BOM sample (N=24)',
    ],
    whatToSay: '"Here are the results. APIx stands at 105.4, meaning domestic airfares rose 5.4% over 2024. Furthermore, our lead-time view quantifies how emergency bookings incur an 83.7% tariff uplift compared to the 30-day baseline."',
    expectedQuestion: 'Does an index of 105.4 mean 105.4% inflation?',
    expectedAnswer: 'No. Base period Jan 2024 equals 100.0. An index of 105.4 means airfares are 5.4% above base period price levels.',
    provenanceTag: 'CALCULATED PROTOTYPE OUTPUT',
  },
  {
    step: 6,
    id: 'trust',
    title: 'Data Trust & Descriptive MoSPI CPI Backtest',
    subtitle: 'Complete provenance transparency and correlation r ≈ 0.98',
    summary: 'Every statistic in APIx is classified into one of six provenance tiers (REAL, CALCULATED, EMPIRICAL, DEMO/CALIBRATED, FALLBACK, TEST FIXTURE). A 20-month backtest against official MoSPI CPI Transport subgroup 6.1.03 (March 2023–Dec 2024) confirms directional alignment with Pearson correlation r ≈ 0.98.',
    keyPoints: [
      'Six-tier provenance classification ensures zero mystery regarding data origins',
      '20 verified monthly observations from MoSPI official eSankhyiki portal',
      'High statistical concordance: Pearson r ≈ 0.98 between rebased APIx and official CPI series',
      'Descriptive backtest confirms directional validity while capturing high-frequency micro-swings',
    ],
    whatToSay: '"Judges, transparency is our highest priority. We classified every metric in a 6-tier provenance matrix. Backtesting against 20 months of official MoSPI CPI data confirmed strong directional concordance at r ≈ 0.98."',
    expectedQuestion: 'Does the 0.98 correlation mean MoSPI has officially certified your platform?',
    expectedAnswer: 'No. We are technically honest: this is a descriptive econometric backtest against published historical data, not an official statutory certification.',
    provenanceTag: 'DATA TRUST & VERIFICATION',
  },
  {
    step: 7,
    id: 'limitations',
    title: 'Technical Honesty & Known Limitations',
    subtitle: 'What this prototype is and what it is not',
    summary: 'We maintain complete technical honesty. APIx is a research prototype built for SIH26056. It uses passenger traffic shares as proxies for expenditure weights. Web scrapers require periodic selector updates if airline websites redesign, and public internet extraction cannot guarantee 100% production uptime without official API agreements.',
    keyPoints: [
      'Prototype Status: Built for SIH26056; not an official statutory Government of India index',
      'Weights: Derived from DGCA passenger volume proxy shares, not official CPI consumer expenditure surveys',
      'Scraper Boundary: Public web scrapers are subject to platform changes; long-term vision is institutional API feeds',
      'Coverage: Currently tracks 11 major trunk corridors (39.55M pax); expandable to regional UDAN routes',
    ],
    whatToSay: '"We conclude with technical honesty. This is a prototype. Our weights use passenger volume as an expenditure proxy. For long-term production, we recommend formal data-sharing agreements between airlines, DGCA, and MoSPI."',
    expectedQuestion: 'What are the immediate next steps to make this production-ready?',
    expectedAnswer: 'Containerizing scraper workers across distributed proxy pools, formalizing data feeds with DGCA/airlines, and conducting quarterly base-period chain-linking.',
    provenanceTag: 'HONEST EVALUATION',
  },
];

export const JudgeDemoView: React.FC = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);

  const step = JUDGE_STORY_STEPS[currentStepIndex];
  const totalSteps = JUDGE_STORY_STEPS.length;

  const goToNext = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const resetDemo = () => {
    setCurrentStepIndex(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`max-w-5xl mx-auto pb-12 ${isPresentationMode ? 'pt-2' : 'space-y-6'}`}>
      {/* 1. TOP DEMO CONTROLS BAR */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-200">
            <Play className="w-5 h-5 fill-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-blue-700 uppercase">
                SIH Judge Presentation
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-mono text-slate-500">3–5 Minute Walkthrough</span>
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Step {step.step} of {totalSteps}: {step.title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPresentationMode(!isPresentationMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-all ${
              isPresentationMode 
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {isPresentationMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isPresentationMode ? 'Exit Presenter Mode' : 'Presenter Mode'}</span>
          </button>

          <button
            onClick={resetDemo}
            className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            title="Reset demo to Step 1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. STEP PROGRESS TRACKER */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs overflow-x-auto">
        <div className="flex items-center justify-between min-w-[600px] gap-2">
          {JUDGE_STORY_STEPS.map((s, idx) => {
            const isActive = idx === currentStepIndex;
            const isDone = idx < currentStepIndex;
            return (
              <button
                key={s.id}
                onClick={() => setCurrentStepIndex(idx)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-center font-mono text-xs transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : isDone
                    ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <div className="text-[10px] opacity-80">STEP {s.step}</div>
                <div className="truncate text-[11px] mt-0.5">{s.id.toUpperCase()}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. MAIN STORY CARD */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Step Badge & Category */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-mono font-bold text-xs border border-blue-200">
              STEP {step.step} / {totalSteps}
            </span>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              {step.provenanceTag}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Target: ~35-45 sec</span>
          </div>
        </div>

        {/* Title & Subtitle */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {step.title}
          </h1>
          <p className="text-sm font-medium text-blue-600 mt-1">
            {step.subtitle}
          </p>
        </div>

        {/* Narrative Summary */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
          {step.summary}
        </div>

        {/* Key Points */}
        <div>
          <h3 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider mb-2">
            Key Technical Facts for Judges
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {step.keyPoints.map((pt, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{pt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Presenter Talking Point */}
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-xs space-y-1 text-blue-950">
          <span className="font-bold uppercase tracking-wider font-mono text-[10px] text-blue-700 block">
            What You Should Say (Script):
          </span>
          <p className="italic text-xs sm:text-sm font-sans leading-relaxed text-blue-900">
            {step.whatToSay}
          </p>
        </div>

        {/* Expected Judge Question & Bulletproof Answer */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
          <div className="flex items-center gap-1.5 text-slate-800 font-bold font-mono">
            <HelpCircle className="w-4 h-4 text-amber-600" />
            <span>Expected Judge Question:</span>
          </div>
          <p className="text-xs text-slate-700 font-semibold italic pl-5">
            "{step.expectedQuestion}"
          </p>
          <div className="pt-1 pl-5 border-l-2 border-emerald-500 text-xs text-slate-700 space-y-0.5">
            <span className="font-bold text-emerald-800 block text-[11px]">Recommended Defensible Answer:</span>
            <p className="leading-relaxed">{step.expectedAnswer}</p>
          </div>
        </div>

        {/* 4. NAVIGATION CONTROLS */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            onClick={goToPrev}
            disabled={currentStepIndex === 0}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Step</span>
          </button>

          <span className="text-xs font-mono text-slate-500">
            Step {step.step} of {totalSteps}
          </span>

          {currentStepIndex < totalSteps - 1 ? (
            <button
              onClick={goToNext}
              className="px-5 py-2 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 flex items-center gap-1.5 transition-colors shadow-xs font-bold"
            >
              <span>Next: Step {step.step + 1}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={resetDemo}
              className="px-5 py-2 rounded-lg text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1.5 transition-colors font-bold"
            >
              <span>Finish Demo (Restart)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
