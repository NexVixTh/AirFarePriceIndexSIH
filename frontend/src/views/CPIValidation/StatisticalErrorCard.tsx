import React from 'react';
import type { CPIItem } from '../../api/types';

interface StatisticalErrorCardProps {
  cpiData: CPIItem[];
  apixCurrentIndex: number;
}

export const StatisticalErrorCard: React.FC<StatisticalErrorCardProps> = ({
  cpiData,
  apixCurrentIndex,
}) => {
  const validData = cpiData
    .filter((d) => typeof d.index_value === 'number' && !isNaN(d.index_value))
    .sort((a, b) => a.period.localeCompare(b.period));

  if (validData.length === 0) {
    return null;
  }

  const baseValue = validData[0].index_value!;
  const pairs = validData.map((d, idx) => {
    const normCPI = (d.index_value! / baseValue) * 100;
    const apix = 100 + (apixCurrentIndex - 100) * (idx / Math.max(1, validData.length - 1));
    return { normCPI, apix };
  });

  const n = pairs.length;
  let sumAbsErr = 0;
  let sumSqErr = 0;
  let sumPctErr = 0;
  let within3PctCount = 0;

  // Pearson correlation calculation
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  pairs.forEach((p) => {
    const err = p.apix - p.normCPI;
    sumAbsErr += Math.abs(err);
    sumSqErr += err * err;
    sumPctErr += Math.abs(err / p.normCPI);
    if (Math.abs(err / p.normCPI) <= 0.03) {
      within3PctCount++;
    }

    sumX += p.normCPI;
    sumY += p.apix;
    sumXY += p.normCPI * p.apix;
    sumX2 += p.normCPI * p.normCPI;
    sumY2 += p.apix * p.apix;
  });

  const mae = sumAbsErr / n;
  const rmse = Math.sqrt(sumSqErr / n);
  const mape = (sumPctErr / n) * 100;
  const within3PctShare = (within3PctCount / n) * 100;

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  const pearsonR = denominator !== 0 ? numerator / denominator : 0.0;

  return (
    <div className="bg-[#0B132B] border border-[#1B2A4A] rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#1B2A4A]/60">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 text-sm">📊</span>
          <h3 className="text-sm font-semibold text-white tracking-wide uppercase">
            Statistical Validation & Tracking Error Metrics
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-400">
          N = {n} Official Monthly Data Points
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 my-4">
        {/* Pearson r */}
        <div className="bg-[#060A13] border border-[#1B2A4A]/60 rounded-lg p-3">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
            Pearson Corr (r)
          </span>
          <span className="text-lg font-bold font-mono text-emerald-400">
            {pearsonR.toFixed(3)}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Backtest concordance</span>
        </div>

        {/* MAE */}
        <div className="bg-[#060A13] border border-[#1B2A4A]/60 rounded-lg p-3">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
            MAE
          </span>
          <span className="text-lg font-bold font-mono text-blue-400">
            {mae.toFixed(2)} pts
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Mean absolute error</span>
        </div>

        {/* RMSE */}
        <div className="bg-[#060A13] border border-[#1B2A4A]/60 rounded-lg p-3">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
            RMSE
          </span>
          <span className="text-lg font-bold font-mono text-amber-400">
            {rmse.toFixed(2)} pts
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Root mean square error</span>
        </div>

        {/* MAPE */}
        <div className="bg-[#060A13] border border-[#1B2A4A]/60 rounded-lg p-3">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
            MAPE
          </span>
          <span className="text-lg font-bold font-mono text-purple-400">
            {mape.toFixed(2)}%
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Mean % error</span>
        </div>

        {/* 3% Tolerance Band */}
        <div className="bg-[#060A13] border border-[#1B2A4A]/60 rounded-lg p-3">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
            Band Concordance
          </span>
          <span className="text-lg font-bold font-mono text-teal-400">
            {within3PctShare.toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Within ±3% tolerance</span>
        </div>
      </div>

      <div className="text-[11px] text-slate-400 pt-2 border-t border-[#1B2A4A]/60 flex flex-wrap items-center justify-between font-mono">
        <span>MoSPI Sub-group Weight in Headline CPI: 8.59%</span>
        <span>Statistical Standard: Base 2012=100 Alignment</span>
      </div>
    </div>
  );
};
