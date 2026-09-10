import React, { useState } from 'react';
import { 
  Terminal, 
  RefreshCw, 
  Play, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import type { ScraperJobLog } from '../../api/types';
import { api } from '../../api/client';

interface ScraperObservabilityTableProps {
  logs: ScraperJobLog[];
  loading: boolean;
  onRefresh: () => void;
}

export const ScraperObservabilityTable: React.FC<ScraperObservabilityTableProps> = ({
  logs,
  loading,
  onRefresh,
}) => {
  const [triggering, setTriggering] = useState<string | null>(null);
  const [triggerMessage, setTriggerMessage] = useState<string | null>(null);

  const handleRunScraper = async (scraperType: 'indigo' | 'goibibo', route: string = 'DEL-BOM') => {
    setTriggering(scraperType);
    setTriggerMessage(null);
    try {
      const [origin, destination] = route.split('-');
      const res = await api.triggerScrape(scraperType, origin, destination, 7);
      setTriggerMessage(`Collected ${res.quotes_extracted} quotes from ${scraperType.toUpperCase()} for ${route}!`);
      onRefresh();
      setTimeout(() => setTriggerMessage(null), 5000);
    } catch (err: unknown) {
      setTriggerMessage(err instanceof Error ? err.message : 'Scraper run failed');
    } finally {
      setTriggering(null);
    }
  };

  return (
    <div className="cmd-card p-4 space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
              Scraper Fleet Execution Telemetry
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Audit logs for distributed Playwright headless browser collection jobs
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Quick trigger buttons */}
          <button
            onClick={() => handleRunScraper('indigo', 'DEL-BOM')}
            disabled={triggering !== null}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[10px] font-mono transition-colors shadow-sm"
            title="Execute IndiGo direct scraper for DEL-BOM"
          >
            {triggering === 'indigo' ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <Play className="w-3 h-3" />
            )}
            <span>Run IndiGo</span>
          </button>

          <button
            onClick={() => handleRunScraper('goibibo', 'DEL-BOM')}
            disabled={triggering !== null}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-[10px] font-mono transition-colors shadow-sm"
            title="Execute Goibibo OTA scraper for DEL-BOM"
          >
            {triggering === 'goibibo' ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <Play className="w-3 h-3" />
            )}
            <span>Run Goibibo</span>
          </button>
        </div>
      </div>

      {triggerMessage && (
        <div className="p-2 rounded bg-blue-950/80 border border-blue-800 text-blue-300 text-[11px] font-mono">
          {triggerMessage}
        </div>
      )}

      {/* Logs Table */}
      <div className="overflow-x-auto border border-slate-800/80 rounded bg-[#070D1E]">
        <table className="w-full text-left border-collapse text-[11px] font-mono">
          <thead>
            <tr className="bg-[#0B132B] border-b border-slate-800 text-slate-400 uppercase text-[10px]">
              <th className="py-2 px-3">Job ID</th>
              <th className="py-2 px-3">Engine</th>
              <th className="py-2 px-3">Corridor</th>
              <th className="py-2 px-3 text-right">Window</th>
              <th className="py-2 px-3 text-right">Quotes</th>
              <th className="py-2 px-3 text-center">Status</th>
              <th className="py-2 px-3 text-right">Executed At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  <span className="inline-block animate-spin mr-2">⟳</span>
                  Querying scraper execution database...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  <div className="space-y-1">
                    <div>No recent scraper jobs recorded in `scraper_job_logs` table.</div>
                    <div className="text-[10px] text-slate-400">
                      Click &quot;Run IndiGo&quot; or &quot;Run Goibibo&quot; above to trigger an on-demand collection job.
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2 px-3 text-slate-400 font-bold">#{log.id}</td>
                  <td className="py-2 px-3 font-semibold text-white">
                    {log.scraper_name}
                  </td>
                  <td className="py-2 px-3 text-cyan-300 font-bold">{log.route}</td>
                  <td className="py-2 px-3 text-right text-slate-400">T+{log.advance_days}d</td>
                  <td className="py-2 px-3 text-right font-bold text-emerald-400">
                    {log.quotes_collected}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className={`inline-flex items-center space-x-1 px-1.5 py-0.2 rounded text-[9px] font-semibold ${
                        log.status === 'completed'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                          : log.status === 'running'
                          ? 'bg-blue-950 text-blue-300 border border-blue-800/60'
                          : 'bg-rose-950 text-rose-300 border border-rose-800/60'
                      }`}
                    >
                      {log.status === 'completed' ? (
                        <CheckCircle2 className="w-2.5 h-2.5" />
                      ) : (
                        <AlertTriangle className="w-2.5 h-2.5" />
                      )}
                      <span>{log.status.toUpperCase()}</span>
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right text-slate-400 text-[10px]">
                    {new Date(log.started_at).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
