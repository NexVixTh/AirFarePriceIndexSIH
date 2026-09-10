import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Play, 
  ShieldAlert, 
  Scale, 
  Activity, 
  RefreshCw,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import type { RouteCorridorItem } from './CorridorPriceDispersionChart';
import type { RouteStatistics } from '../../api/types';
import { api } from '../../api/client';

interface RouteDeepDiveDrawerProps {
  corridor: RouteCorridorItem | null;
  onClose: () => void;
  onScrapeCompleted?: () => void;
}

export const RouteDeepDiveDrawer: React.FC<RouteDeepDiveDrawerProps> = ({
  corridor,
  onClose,
  onScrapeCompleted,
}) => {
  const [stats, setStats] = useState<RouteStatistics | null>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(false);
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [scrapeResult, setScrapeResult] = useState<{
    status: string;
    quotes: number;
    message?: string;
  } | null>(null);
  const [scraperType, setScraperType] = useState<'indigo' | 'goibibo'>('indigo');

  useEffect(() => {
    if (!corridor) {
      setStats(null);
      setScrapeResult(null);
      return;
    }

    const [orig, dest] = corridor.route.split('-');
    if (orig && dest) {
      setLoadingStats(true);
      api
        .getRouteStats(orig, dest)
        .then((res) => {
          setStats(res);
        })
        .catch(() => {
          // If no quotes exist yet in DB for this route, stats will 404
          setStats(null);
        })
        .finally(() => {
          setLoadingStats(false);
        });
    }
  }, [corridor]);

  if (!corridor) return null;

  const [origin, destination] = corridor.route.split('-');

  // Calculate synthetic or real IQR bounds based on baseFare if DB has no quotes
  const baseFare = corridor.baseFare;
  const q1 = stats ? stats.min_fare + (stats.median_fare - stats.min_fare) * 0.5 : baseFare * 0.92;
  const q3 = stats ? stats.median_fare + (stats.max_fare - stats.median_fare) * 0.5 : baseFare * 1.15;
  const iqr = q3 - q1;
  const lowerFence = Math.max(1500, q1 - 1.5 * iqr);
  const upperFence = q3 + 1.5 * iqr;
  const surgeThreshold = baseFare * 1.30;

  const handleTriggerScraper = async () => {
    setIsScraping(true);
    setScrapeResult(null);
    try {
      const res = await api.triggerScrape(scraperType, origin, destination, 7);
      setScrapeResult({
        status: 'success',
        quotes: res.quotes_extracted,
        message: `Successfully collected ${res.quotes_extracted} quotes from ${scraperType.toUpperCase()}`,
      });
      if (onScrapeCompleted) {
        onScrapeCompleted();
      }
    } catch (err: unknown) {
      setScrapeResult({
        status: 'error',
        quotes: 0,
        message: err instanceof Error ? err.message : 'Scraping job failed or blocked',
      });
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-[#0B132B] border-l border-slate-700 shadow-2xl z-50 flex flex-col custom-scrollbar overflow-y-auto">
      {/* Drawer Header */}
      <div className="p-4 bg-[#070D1E] border-b border-slate-800 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-blue-400" />
          <div>
            <span className="text-sm font-bold font-mono text-white tracking-wide">
              {corridor.route} Intelligence Inspector
            </span>
            <div className="text-[10px] text-slate-400 font-mono">
              {corridor.name}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4 text-xs font-mono">
        {/* Corridor Identity Banner */}
        <div className="p-3 bg-[#070D1E] rounded border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase">Corridor Category</span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-blue-950 text-blue-300 border border-blue-800/60 font-semibold">
              {corridor.category}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/60">
            <div>
              <div className="text-[10px] text-slate-400">DGCA Traffic Weight</div>
              <div className="text-base font-bold text-cyan-300 mt-0.5">
                {(corridor.dgcaWeight * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Basket Status</div>
              <div className="text-base font-bold text-emerald-400 mt-0.5">
                {corridor.isBasketRoute ? 'Core Basket (5 Trunks)' : 'Priority Monitored'}
              </div>
            </div>
          </div>
        </div>

        {/* Statistical Percentiles & Outlier Fences */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-300 font-semibold">
            <span className="flex items-center space-x-1.5">
              <Scale className="w-3.5 h-3.5 text-purple-400" />
              <span>Statistical Distribution & IQR Fences</span>
            </span>
            <span className="text-[9px] text-slate-400 font-normal">
              {loadingStats ? 'Loading DB Stats...' : stats ? 'Live Database' : 'Baseline Calibration'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#070D1E] p-2 rounded border border-slate-800 text-center">
              <div className="text-[9px] text-slate-400">Base Fare (P₀)</div>
              <div className="text-xs font-bold text-white mt-1">₹{baseFare.toLocaleString('en-IN')}</div>
            </div>
            <div className="bg-[#070D1E] p-2 rounded border border-slate-800 text-center">
              <div className="text-[9px] text-slate-400">Median Fare (Q₂)</div>
              <div className="text-xs font-bold text-cyan-300 mt-1">
                ₹{stats ? stats.median_fare.toLocaleString('en-IN') : baseFare.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-[#070D1E] p-2 rounded border border-slate-800 text-center">
              <div className="text-[9px] text-slate-400">Quote Density</div>
              <div className="text-xs font-bold text-emerald-400 mt-1">
                {stats ? `${stats.sample_size} Quotes` : 'Awaiting Batch'}
              </div>
            </div>
          </div>

          {/* IQR Outlier Thresholds Box */}
          <div className="p-2.5 bg-[#070D1E] rounded border border-slate-800 space-y-1.5 text-[10px]">
            <div className="text-slate-400 font-bold uppercase tracking-wider text-[9px] flex items-center justify-between">
              <span>Tukey IQR Anomaly Boundaries</span>
              <ShieldAlert className="w-3 h-3 text-amber-400" />
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
              <span className="text-slate-400">Interquartile Range (IQR):</span>
              <span className="text-white font-bold">₹{Math.round(iqr).toLocaleString('en-IN')}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Lower Outlier Fence (Q₁ - 1.5×IQR):</span>
              <span className="text-emerald-400 font-bold">₹{Math.round(lowerFence).toLocaleString('en-IN')}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Upper Outlier Fence (Q₃ + 1.5×IQR):</span>
              <span className="text-amber-400 font-bold">₹{Math.round(upperFence).toLocaleString('en-IN')}</span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800/60 pt-1">
              <span className="text-rose-400 font-semibold">+30% MoSPI Surge Alert Threshold:</span>
              <span className="text-rose-300 font-bold">₹{Math.round(surgeThreshold).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Real-Time On-Demand Scraper Trigger */}
        <div className="p-3 bg-[#070D1E] rounded border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-200">
            <span className="flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              <span>Live On-Demand Scraper</span>
            </span>
            <span className="text-[9px] text-slate-400 font-normal">Playwright / Chromium</span>
          </div>

          <p className="text-[10px] text-slate-400">
            Trigger an automated headless browser task to collect live fares for {origin} → {destination} (T+7 departure).
          </p>

          <div className="flex items-center space-x-2 text-[10px]">
            <button
              onClick={() => setScraperType('indigo')}
              className={`flex-1 py-1 px-2 rounded border text-center font-semibold transition-colors ${
                scraperType === 'indigo'
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-[#0B132B] border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              IndiGo (Direct)
            </button>
            <button
              onClick={() => setScraperType('goibibo')}
              className={`flex-1 py-1 px-2 rounded border text-center font-semibold transition-colors ${
                scraperType === 'goibibo'
                  ? 'bg-orange-600 border-orange-500 text-white'
                  : 'bg-[#0B132B] border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Goibibo (OTA)
            </button>
          </div>

          <button
            onClick={handleTriggerScraper}
            disabled={isScraping}
            className="w-full flex items-center justify-center space-x-1.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors shadow-sm"
          >
            {isScraping ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            <span>{isScraping ? 'Executing Headless Job...' : `Scrape ${origin}-${destination}`}</span>
          </button>

          {scrapeResult && (
            <div
              className={`p-2 rounded border text-[10px] flex items-start space-x-1.5 ${
                scrapeResult.status === 'success'
                  ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-800/60 text-rose-300'
              }`}
            >
              {scrapeResult.status === 'success' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
              )}
              <span>{scrapeResult.message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
