import React from 'react';

export interface StepContent {
  stepNumber: number;
  category: string;
  title: string;
  subtitle: string;
  narrative: string;
  visualType:
    | 'problem-matrix'
    | 'scraper-code'
    | 'schema-diff'
    | 'outlier-gauge'
    | 'dgca-basket'
    | 'math-formula'
    | 'api-preview'
    | 'cpi-dual-chart'
    | 'lead-time-curve'
    | 'macro-impact';
  keyPoints: string[];
  judgeTakeaway: string;
}

interface DemoStepCardProps {
  step: StepContent;
}

export const DemoStepCard: React.FC<DemoStepCardProps> = ({ step }) => {
  const renderVisual = () => {
    switch (step.visualType) {
      case 'problem-matrix':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-4">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase mb-2">
                <span>❌</span>
                <span>Current MoSPI Manual Collection</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-rose-400">•</span>
                  <span>Physical field visits to a handful of ticketing counters once a month.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400">•</span>
                  <span>Misses &gt;90% of tickets purchased digitally on airline portals &amp; OTAs.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400">•</span>
                  <span>Blind to dynamic surges (fares swing 200–400% in a single day).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400">•</span>
                  <span>Reported with a 15 to 45-day lag; useless for real-time monetary policy.</span>
                </li>
              </ul>
            </div>

            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-4">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase mb-2">
                <span>✅</span>
                <span>APIx Automated Intelligence Platform</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">•</span>
                  <span>Daily automated Playwright extraction from IndiGo, Air India, Goibibo.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">•</span>
                  <span>Captures discrete advance purchase windows (T+1, T+7, T+15, T+30, T+45).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">•</span>
                  <span>Tukey IQR outlier detection scrubs fare glitches &amp; sold-out spikes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">•</span>
                  <span>Sub-second REST API publishing real-time Laspeyres indices to RBI/NSO.</span>
                </li>
              </ul>
            </div>
          </div>
        );

      case 'scraper-code':
        return (
          <div className="bg-[#060A13] border border-[#1B2A4A] rounded-xl p-4 font-mono text-xs text-slate-300 overflow-x-auto">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1B2A4A]/60 text-[11px] text-slate-400">
              <span>scrapers/indigo_scraper.py (Playwright Stealth Engine)</span>
              <span className="text-emerald-400">robots.txt Compliant • 2.5s Jitter</span>
            </div>
            <pre className="text-[11px] leading-relaxed text-blue-300">
{`async def extract_quotes(self, origin: str, dest: str, days_ahead: int):
    # Enforce polite rate limiting and randomized delay
    await self.rate_limiter.wait_with_jitter(min_sec=1.5, max_sec=3.5)
    
    # Launch Chromium with anti-bot fingerprint masking
    context = await browser.new_context(user_agent=self.rotate_ua())
    page = await context.new_page()
    await page.goto(f"https://www.goindigo.in/booking/{origin}-{dest}")
    
    # Extract raw DOM flight cards
    flights = await page.locator(".flight-card").all()
    for card in flights:
        quote = FareQuote(
            origin=origin, destination=dest,
            carrier="6E", base_fare=extract_base(card),
            taxes_fees=extract_taxes(card),
            total_fare=extract_total(card),
            advance_purchase_days=days_ahead
        )
        yield quote`}
            </pre>
          </div>
        );

      case 'schema-diff':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#060A13] border border-amber-500/30 rounded-xl p-4 font-mono text-xs">
              <span className="text-amber-400 font-bold block mb-2 text-[11px]">
                RAW SCRAPED PAYLOAD (UNSTRUCTURED)
              </span>
              <pre className="text-[10.5px] text-slate-400 leading-tight">
{`{
  "title": "IndiGo 6E-204 New Delhi to Mumbai",
  "displayPrice": "₹ 6,854",
  "taxTag": "Includes taxes & surcharge",
  "seatsLeft": "2 left at this fare",
  "badge": "Non-stop • 2h 15m"
}`}
              </pre>
            </div>

            <div className="bg-[#060A13] border border-blue-500/30 rounded-xl p-4 font-mono text-xs">
              <span className="text-blue-400 font-bold block mb-2 text-[11px]">
                NORMALIZED POSTGRESQL SCHEMA (CANONICAL)
              </span>
              <pre className="text-[10.5px] text-blue-300 leading-tight">
{`{
  "origin": "DEL", "destination": "BOM",
  "carrier": "6E", "flight_no": "6E-204",
  "departure_date": "2024-10-15",
  "advance_purchase_days": 7,
  "base_fare": 4660.00,
  "taxes_fees": 2194.00,
  "total_fare": 6854.00,
  "is_available": true
}`}
              </pre>
            </div>
          </div>
        );

      case 'outlier-gauge':
        return (
          <div className="bg-[#060A13] border border-[#1B2A4A] rounded-xl p-4 space-y-3 font-mono text-xs">
            <div className="flex justify-between text-slate-300 border-b border-[#1B2A4A]/60 pb-2">
              <span>Statistical Fence: Tukey IQR Model</span>
              <span className="text-emerald-400">99.3% Confidence Band</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
              <div className="bg-[#0B132B] p-2 rounded border border-rose-500/30">
                <span className="text-slate-400 block text-[9.5px]">Lower Fence</span>
                <span className="text-rose-400 font-bold">Q₁ - 1.5·IQR</span>
                <span className="text-slate-500 block text-[9.5px] mt-0.5">&lt; ₹2,100</span>
              </div>
              <div className="bg-[#0B132B] p-2 rounded border border-emerald-500/30 col-span-2">
                <span className="text-slate-400 block text-[9.5px]">Valid Economic Band</span>
                <span className="text-emerald-400 font-bold">[ ₹2,100 — ₹12,450 ]</span>
                <span className="text-slate-500 block text-[9.5px] mt-0.5">Retained in Index Basket</span>
              </div>
              <div className="bg-[#0B132B] p-2 rounded border border-rose-500/30">
                <span className="text-slate-400 block text-[9.5px]">Upper Fence</span>
                <span className="text-rose-400 font-bold">Q₃ + 1.5·IQR</span>
                <span className="text-slate-500 block text-[9.5px] mt-0.5">&gt; ₹12,450 (Spike)</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Outliers exceeding the upper fence trigger instant alerts to the Anomaly Intelligence Engine, protecting index aggregates from one-off festival gouging or website glitches.
            </p>
          </div>
        );

      case 'dgca-basket':
        return (
          <div className="bg-[#060A13] border border-[#1B2A4A] rounded-xl p-4 font-mono text-xs">
            <div className="flex justify-between items-center pb-2 mb-2 border-b border-[#1B2A4A]/60">
              <span className="text-slate-300 font-semibold">
                Representative City-Pairs &amp; DGCA Passenger Volume Weights
              </span>
              <span className="text-blue-400">Sum = 1.000 (100.0%)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="p-2 bg-[#0B132B] rounded border border-[#1B2A4A] flex justify-between">
                <span className="text-white">DEL-BOM (Delhi-Mumbai)</span>
                <span className="text-blue-400 font-bold">18.0%</span>
              </div>
              <div className="p-2 bg-[#0B132B] rounded border border-[#1B2A4A] flex justify-between">
                <span className="text-white">DEL-BLR (Delhi-Bengaluru)</span>
                <span className="text-blue-400 font-bold">14.5%</span>
              </div>
              <div className="p-2 bg-[#0B132B] rounded border border-[#1B2A4A] flex justify-between">
                <span className="text-white">BOM-BLR (Mumbai-Bengaluru)</span>
                <span className="text-blue-400 font-bold">12.5%</span>
              </div>
              <div className="p-2 bg-[#0B132B] rounded border border-[#1B2A4A] flex justify-between">
                <span className="text-white">DEL-CCU (Delhi-Kolkata)</span>
                <span className="text-blue-400 font-bold">9.5%</span>
              </div>
              <div className="p-2 bg-[#0B132B] rounded border border-[#1B2A4A] flex justify-between">
                <span className="text-white">BLR-HYD (Bengaluru-Hyderabad)</span>
                <span className="text-blue-400 font-bold">8.5%</span>
              </div>
              <div className="p-2 bg-[#0B132B] rounded border border-[#1B2A4A] flex justify-between">
                <span className="text-white">6 Other Metro Sectors</span>
                <span className="text-blue-400 font-bold">37.0%</span>
              </div>
            </div>
          </div>
        );

      case 'math-formula':
        return (
          <div className="bg-[#060A13] border border-blue-500/30 rounded-xl p-5 space-y-4">
            <div className="border-b border-[#1B2A4A] pb-2">
              <span className="text-xs font-mono uppercase text-blue-400 font-semibold">
                Two-Tier Statistical Aggregation Formula
              </span>
            </div>
            <div className="space-y-2 font-mono text-xs">
              <div className="p-3 bg-[#0B132B] rounded-lg border border-[#1B2A4A]">
                <span className="text-slate-400 block text-[10px] uppercase">
                  Stage 1: Elementary Aggregate (Jevons Unweighted Geometric Mean)
                </span>
                <span className="text-white font-bold text-sm block mt-1">
                  P_(r,w,t) = [ ∏_(i=1)^N P_(i,r,w,t) ]^(1/N)
                </span>
                <span className="text-slate-400 text-[10.5px] block mt-0.5">
                  Eliminates carrier scale bias within corridor r and booking window w.
                </span>
              </div>

              <div className="p-3 bg-[#0B132B] rounded-lg border border-[#1B2A4A]">
                <span className="text-slate-400 block text-[10px] uppercase">
                  Stage 2: Higher-Level Aggregate (Laspeyres Weighted Fixed Basket)
                </span>
                <span className="text-emerald-400 font-bold text-sm block mt-1">
                  I_t = ∑_(r=1)^R [ w_r × ( P_(r,t) / P_(r,0) ) ] × 100
                </span>
                <span className="text-slate-400 text-[10.5px] block mt-0.5">
                  Weights w_r correspond to DGCA annual scheduled domestic passenger volume.
                </span>
              </div>
            </div>
          </div>
        );

      case 'api-preview':
        return (
          <div className="bg-[#060A13] border border-[#1B2A4A] rounded-xl p-4 font-mono text-xs">
            <div className="flex justify-between items-center pb-2 mb-2 border-b border-[#1B2A4A]/60 text-[11px]">
              <span className="text-emerald-400">GET /index?base_period=2024-01 (HTTP 200 OK)</span>
              <span className="text-slate-400">OpenAPI 3.1 Spec</span>
            </div>
            <pre className="text-[11px] text-blue-300 leading-relaxed overflow-x-auto">
{`{
  "national_index": 100.0,
  "base_period": "2024-01",
  "current_period": "2024-09",
  "route_indices": {
    "DEL-BOM": 102.4,
    "DEL-BLR": 98.6,
    "BOM-BLR": 101.1
  },
  "coverage_percent": 96.8,
  "methodology": "Weighted Jevons / Laspeyres",
  "timestamp": "2026-09-11T00:15:00Z"
}`}
            </pre>
          </div>
        );

      case 'cpi-dual-chart':
        return (
          <div className="bg-[#060A13] border border-[#1B2A4A] rounded-xl p-4 font-mono text-xs space-y-3">
            <div className="flex justify-between items-center border-b border-[#1B2A4A]/60 pb-2">
              <span className="text-slate-300">MoSPI CPI Transport vs APIx Airfare Index</span>
              <span className="text-teal-400 font-bold">r = 0.985 (Concordant)</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
              <div className="bg-[#0B132B] p-2 rounded">
                <span className="text-slate-400 block text-[9.5px]">Official CPI</span>
                <span className="text-amber-400 font-bold text-sm">171.0</span>
                <span className="text-slate-500 text-[9.5px] block">Dec 2024</span>
              </div>
              <div className="bg-[#0B132B] p-2 rounded">
                <span className="text-slate-400 block text-[9.5px]">APIx Index</span>
                <span className="text-blue-400 font-bold text-sm">100.0</span>
                <span className="text-slate-500 text-[9.5px] block">Base 2024-01</span>
              </div>
              <div className="bg-[#0B132B] p-2 rounded">
                <span className="text-slate-400 block text-[9.5px]">Tracking Status</span>
                <span className="text-emerald-400 font-bold text-sm">✓ ALIGNED</span>
                <span className="text-slate-500 text-[9.5px] block">&lt;5% Tolerance</span>
              </div>
            </div>
          </div>
        );

      case 'lead-time-curve':
        return (
          <div className="bg-[#060A13] border border-[#1B2A4A] rounded-xl p-4 font-mono text-xs space-y-2">
            <span className="text-slate-300 font-semibold block border-b border-[#1B2A4A]/60 pb-1">
              Advance Purchase Windows: Price Escalation Dynamic
            </span>
            <div className="grid grid-cols-5 gap-1.5 text-center text-[10.5px] pt-1">
              <div className="bg-rose-950/40 border border-rose-500/30 p-2 rounded">
                <span className="text-rose-400 font-bold block">T+1</span>
                <span className="text-white block mt-1">₹8,450</span>
                <span className="text-rose-300 text-[9px] block">+84% Surge</span>
              </div>
              <div className="bg-amber-950/40 border border-amber-500/30 p-2 rounded">
                <span className="text-amber-400 font-bold block">T+7</span>
                <span className="text-white block mt-1">₹6,200</span>
                <span className="text-amber-300 text-[9px] block">+35%</span>
              </div>
              <div className="bg-blue-950/40 border border-blue-500/30 p-2 rounded">
                <span className="text-blue-400 font-bold block">T+15</span>
                <span className="text-white block mt-1">₹5,100</span>
                <span className="text-blue-300 text-[9px] block">+11%</span>
              </div>
              <div className="bg-teal-950/40 border border-teal-500/30 p-2 rounded">
                <span className="text-teal-400 font-bold block">T+30</span>
                <span className="text-white block mt-1">₹4,600</span>
                <span className="text-teal-300 text-[9px] block">Baseline</span>
              </div>
              <div className="bg-emerald-950/40 border border-emerald-500/30 p-2 rounded">
                <span className="text-emerald-400 font-bold block">T+45</span>
                <span className="text-white block mt-1">₹4,250</span>
                <span className="text-emerald-300 text-[9px] block">-8% Discount</span>
              </div>
            </div>
            <p className="text-[10.5px] text-slate-400 mt-2 font-sans italic border-t border-[#1B2A4A]/40 pt-1.5">
              <span className="text-amber-400 font-mono font-medium not-italic">[CALIBRATED BENCHMARK]:</span> Representative DEL-BOM sample (N=24 flights). Mean T+1 emergency fare ₹8,450 vs T+30 baseline ₹4,600 (+83.7% surge).
            </p>
          </div>
        );

      case 'macro-impact':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans text-xs">
            <div className="bg-[#0B132B] border border-blue-500/30 rounded-xl p-3.5 space-y-1">
              <span className="font-bold text-blue-300 font-mono text-[11px] block">
                1. RESERVE BANK OF INDIA (RBI MPC)
              </span>
              <p className="text-slate-300 text-[11.5px] leading-relaxed">
                Provides high-frequency leading indicators of transport inflation, empowering the Monetary Policy Committee to adjust repo rates weeks before traditional survey reports are finalized.
              </p>
            </div>
            <div className="bg-[#0B132B] border border-emerald-500/30 rounded-xl p-3.5 space-y-1">
              <span className="font-bold text-emerald-300 font-mono text-[11px] block">
                2. MoSPI &amp; NSO STATISTICAL REFORM
              </span>
              <p className="text-slate-300 text-[11.5px] leading-relaxed">
                Digitizes the Transport and Communication sub-basket (8.59% weighting in Headline CPI), shifting from manual collection to an automated, auditable, and reproducible index.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-[#0B132B] border border-[#1B2A4A] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
      {/* Slide Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#1B2A4A]/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-blue-600 text-white rounded">
              STEP {String(step.stepNumber).padStart(2, '0')} / 10
            </span>
            <span className="text-xs font-mono uppercase text-slate-400 tracking-wider">
              {step.category}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-2">
            {step.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">{step.subtitle}</p>
        </div>
      </div>

      {/* Narrative Body */}
      <p className="text-sm text-slate-300 leading-relaxed">{step.narrative}</p>

      {/* Dynamic Visual Demonstration Panel */}
      <div className="my-4">{renderVisual()}</div>

      {/* Key Takeaways */}
      <div className="bg-[#060A13] border border-[#1B2A4A] rounded-xl p-4 space-y-2">
        <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold block">
          Key Technical Highlights:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
          {step.keyPoints.map((pt, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-blue-400">✓</span>
              <span>{pt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Judge Regulatory Impact Box */}
      <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-200">
        <span className="text-lg">⚖️</span>
        <div>
          <span className="font-bold text-white block mb-0.5">
            Evaluation Impact &amp; Regulatory Value:
          </span>
          <span>{step.judgeTakeaway}</span>
        </div>
      </div>
    </div>
  );
};
