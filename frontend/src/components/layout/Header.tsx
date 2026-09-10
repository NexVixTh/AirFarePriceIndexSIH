import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  BookOpen, 
  Menu, 
  X, 
  Activity, 
  Compass,
  FileText
} from 'lucide-react';
import { usePersona } from '../../context/PersonaContext';
import { useDemoMode } from '../../context/DemoModeContext';
import { api } from '../../api/client';
import type { HealthResponse, IndexResponse, CPITransportResponse } from '../../api/types';

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  onNavigateToDocs?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onToggleSidebar, 
  isSidebarOpen,
  onNavigateToDocs 
}) => {
  const { togglePersona, isAnalyst } = usePersona();
  const { isDemoMode, toggleDemoMode } = useDemoMode();

  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [indexData, setIndexData] = useState<IndexResponse | null>(null);
  const [cpiData, setCpiData] = useState<CPITransportResponse | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const [h, idx, cpi] = await Promise.allSettled([
          api.getHealth(),
          api.getIndex('2024-01'),
          api.getOfficialCPI(),
        ]);
        if (h.status === 'fulfilled') setHealth(h.value);
        if (idx.status === 'fulfilled') setIndexData(idx.value);
        if (cpi.status === 'fulfilled') setCpiData(cpi.value);
      } catch {
        // Handled silently
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [isDemoMode]);

  const isConnected = health?.status === 'ok';
  const observationCount = cpiData?.data?.length || 20;

  return (
    <header className="sticky top-0 z-50 select-none bg-white border-b border-slate-200 shadow-xs">
      {/* Subtle Institutional Top Accent Line: Royal Blue -> Teal -> Saffron */}
      <div className="h-1 bg-gradient-to-r from-blue-600 via-teal-500 to-amber-500" />

      {/* Main Header Bar */}
      <div className="px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Brand / Title */}
        <div className="flex items-center space-x-3 shrink-0">
          <button 
            onClick={onToggleSidebar}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Toggle Navigation"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center space-x-2.5">
            {/* APIx Emblem */}
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Compass className="w-4 h-4 text-white" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-bold text-blue-700 tracking-wider">APIx</span>
                <span className="text-slate-300">•</span>
                <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-none">
                  Airfare Price Intelligence for India
                </h1>
                <span className="hidden sm:inline text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold ml-1">
                  SIH26056 Prototype
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-sans tracking-normal mt-0.5">
                Statistical Research System · Corridors Calibrated to DGCA Data · Reference Series MoSPI CPI 6.1.03
              </p>
            </div>
          </div>
        </div>

        {/* Center / Right: Operational KPI Badges & Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Quick Metric 1: National Index */}
          <div className="hidden md:flex flex-col items-end px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[9px] font-mono uppercase text-slate-500 font-semibold tracking-wider">
              Headline Index
            </span>
            <div className="flex items-baseline space-x-1">
              <span className="text-xs sm:text-sm font-bold font-mono text-slate-900 tabular-nums">
                {indexData?.national_index ? indexData.national_index.toFixed(1) : '105.4'}
              </span>
              <span className="text-[10px] font-mono text-blue-600 font-semibold">(Base 100.0)</span>
            </div>
          </div>

          {/* Quick Metric 2: Live Backend Connection Status */}
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className={isConnected ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-medium'}>
              {isConnected ? 'BACKEND READY' : 'OFFLINE MODE'}
            </span>
          </div>

          {/* Quick Metric 3: Observation Count */}
          <div className="hidden lg:flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-600">
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            <span>{observationCount} MoSPI Points</span>
          </div>

          {/* Simple vs Analyst Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => isAnalyst && togglePersona()}
              className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                !isAnalyst
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3 h-3" />
              <span>Standard</span>
            </button>

            <button
              onClick={() => !isAnalyst && togglePersona()}
              className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                isAnalyst
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-3 h-3" />
              <span>Econometric</span>
            </button>
          </div>

          {/* Documentation Link */}
          {onNavigateToDocs && (
            <button
              onClick={onNavigateToDocs}
              className="hidden md:flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition-colors"
              title="Open Complete Project Documentation & Manual"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Docs</span>
            </button>
          )}

          {/* Demo Mode Switch */}
          <div className="flex items-center space-x-1 pl-1 border-l border-slate-200">
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={isDemoMode} 
                onChange={toggleDemoMode}
                className="sr-only peer" 
              />
              <div className="w-7 h-3.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500"></div>
              <span className="ml-1 text-[10px] font-mono text-slate-500 hidden xl:inline">
                Demo
              </span>
            </label>
          </div>
        </div>
      </div>
    </header>
  );
};
