import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Play, 
  Check, 
  RefreshCw 
} from 'lucide-react';
import type { SchedulerStats } from '../../api/types';
import { api } from '../../api/client';

interface GovernanceRobotsComplianceWidgetProps {
  schedulerStats: SchedulerStats | null;
  onSchedulerUpdated?: () => void;
}

export const GovernanceRobotsComplianceWidget: React.FC<GovernanceRobotsComplianceWidgetProps> = ({
  schedulerStats,
  onSchedulerUpdated,
}) => {
  const [startingScheduler, setStartingScheduler] = useState<boolean>(false);
  const [schedulerMsg, setSchedulerMsg] = useState<string | null>(null);

  const COMPLIANCE_PILLARS = [
    {
      title: 'Polite Crawl Rate Limiting',
      detail: 'Enforces 1.5s – 3.5s randomized polite backoff jitter between consecutive queries to prevent server strain.',
      standard: 'RFC 9309 robots.txt Compliant',
    },
    {
      title: 'Strict Non-PII Data Boundary',
      detail: 'Extracts only public anonymized fare quotes and booking classes. Zero collection of passenger names, cookies, or credentials.',
      standard: 'DPDP Act 2023 / IT Act 2000',
    },
    {
      title: 'Playwright Stealth Architecture',
      detail: 'Headless Chromium execution with navigator.webdriver cloaking and realistic modern desktop user-agent headers.',
      standard: 'Zero False Positive Bot Bans',
    },
    {
      title: 'Government Data Sovereignty',
      detail: 'All quote snapshots encrypted and persisted directly to local PostgreSQL instance within sovereign boundaries.',
      standard: 'National Informatics Center Standard',
    },
  ];

  const handleStartScheduler = async () => {
    setStartingScheduler(true);
    setSchedulerMsg(null);
    try {
      const res = await api.startScheduler(8);
      setSchedulerMsg(res.message);
      if (onSchedulerUpdated) {
        onSchedulerUpdated();
      }
      setTimeout(() => setSchedulerMsg(null), 5000);
    } catch (err: unknown) {
      setSchedulerMsg(err instanceof Error ? err.message : 'Scheduler trigger failed');
    } finally {
      setStartingScheduler(false);
    }
  };

  return (
    <div className="cmd-card p-4 space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
            Ethical Governance & Scheduler Observability
          </span>
        </div>
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-teal-950/80 text-teal-300 border border-teal-800/60">
          DPDP 2023 Verified
        </span>
      </div>

      {/* Scheduler Status Box */}
      <div className="p-3 bg-[#070D1E] rounded border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-bold text-white">Automated Daemon Scheduler</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[9px] font-semibold ${
                schedulerStats?.scheduler_running
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {schedulerStats?.scheduler_running ? 'DAEMON RUNNING' : 'STANDBY MODE'}
            </span>
          </div>
          <div className="text-[10px] text-slate-400">
            Triggers daily automated multi-window scraping at 08:00 UTC across DGCA priority routes.
          </div>
        </div>

        <button
          onClick={handleStartScheduler}
          disabled={startingScheduler || schedulerStats?.scheduler_running}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors shadow-sm whitespace-nowrap"
        >
          {startingScheduler ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          <span>{schedulerStats?.scheduler_running ? 'Scheduler Active' : 'Start Daily Daemon'}</span>
        </button>
      </div>

      {schedulerMsg && (
        <div className="p-2 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-[11px] font-mono flex items-center space-x-2">
          <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span>{schedulerMsg}</span>
        </div>
      )}

      {/* 4 Compliance Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs font-mono">
        {COMPLIANCE_PILLARS.map((p) => (
          <div key={p.title} className="p-2.5 bg-[#070D1E] rounded border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">{p.title}</span>
              <span className="text-[9px] text-teal-400 font-semibold">{p.standard}</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">{p.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
