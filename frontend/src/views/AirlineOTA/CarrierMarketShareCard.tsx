import React from 'react';
import { Plane, ShieldCheck, HelpCircle } from 'lucide-react';
import type { IndexResponse } from '../../api/types';

export interface AirlineCatalogItem {
  code: string;
  name: string;
  callsign: string;
  dgcaShare: number; // e.g. 0.27
  basketWeight: number; // e.g. 0.25
  model: 'LCC' | 'FSC';
  hub: string;
  activeStatus: 'Active Fleet' | 'Alliance / Group' | 'Suspended / Restructuring';
}

export const AIRLINE_CATALOG: AirlineCatalogItem[] = [
  { code: '6E', name: 'IndiGo', callsign: 'IFLY', dgcaShare: 0.27, basketWeight: 0.25, model: 'LCC', hub: 'DEL / BOM', activeStatus: 'Active Fleet' },
  { code: 'AI', name: 'Air India', callsign: 'AIRINDIA', dgcaShare: 0.18, basketWeight: 0.20, model: 'FSC', hub: 'DEL / BOM', activeStatus: 'Active Fleet' },
  { code: 'SG', name: 'SpiceJet', callsign: 'SPICEJET', dgcaShare: 0.15, basketWeight: 0.15, model: 'LCC', hub: 'DEL / HYD', activeStatus: 'Active Fleet' },
  { code: 'G8', name: 'Go First', callsign: 'GOAIR', dgcaShare: 0.12, basketWeight: 0.15, model: 'LCC', hub: 'BOM / DEL', activeStatus: 'Suspended / Restructuring' },
  { code: 'IX', name: 'Air India Express', callsign: 'EXPRESS INDIA', dgcaShare: 0.10, basketWeight: 0.10, model: 'LCC', hub: 'COK / TRV / DEL', activeStatus: 'Alliance / Group' },
  { code: 'UK', name: 'Vistara', callsign: 'VISTARA', dgcaShare: 0.10, basketWeight: 0.10, model: 'FSC', hub: 'DEL / BOM', activeStatus: 'Alliance / Group' },
  { code: '9W', name: 'Jet Airways', callsign: 'JET AIRWAYS', dgcaShare: 0.05, basketWeight: 0.05, model: 'FSC', hub: 'BOM / DEL', activeStatus: 'Suspended / Restructuring' },
];

interface CarrierMarketShareCardProps {
  indexData: IndexResponse | null;
  selectedCarrier: string | null;
  onSelectCarrier: (carrier: string) => void;
}

export const CarrierMarketShareCard: React.FC<CarrierMarketShareCardProps> = ({
  indexData,
  selectedCarrier,
  onSelectCarrier,
}) => {
  const airlineIndices = indexData?.airline_indices || {};

  return (
    <div className="cmd-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <Plane className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
            Scheduled Domestic Airline Market Weights
          </span>
        </div>
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
          DGCA Passenger Traffic Share
        </span>
      </div>

      {/* Grid of Carriers */}
      <div className="space-y-2 pt-1">
        {AIRLINE_CATALOG.map((a) => {
          const isSelected = selectedCarrier === a.code;
          const carrierIdx = airlineIndices[a.code] ?? 100.0;
          const barWidth = (a.dgcaShare / 0.30) * 100;

          return (
            <div
              key={a.code}
              onClick={() => onSelectCarrier(a.code)}
              className={`p-2.5 rounded cursor-pointer transition-all border ${
                isSelected
                  ? 'bg-blue-950/40 border-blue-500 shadow-md'
                  : 'bg-[#070D1E] border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/30'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white tracking-wide text-xs">{a.code}</span>
                  <span className="text-slate-300">{a.name}</span>
                  <span
                    className={`px-1 py-0.2 rounded text-[8px] font-semibold ${
                      a.model === 'LCC'
                        ? 'bg-blue-950 text-blue-300 border border-blue-800/60'
                        : 'bg-purple-950 text-purple-300 border border-purple-800/60'
                    }`}
                  >
                    {a.model}
                  </span>
                  <span className="text-[9px] text-slate-500">Hub: {a.hub}</span>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-[10px] text-slate-400">
                    Index Rel:{' '}
                    <strong className="text-cyan-300 font-mono">{carrierIdx.toFixed(1)}</strong>
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-emerald-300 font-semibold tabular-nums">
                    {(a.dgcaShare * 100).toFixed(1)}% Share
                  </span>
                </div>
              </div>

              {/* Share Visual Bar */}
              <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    a.model === 'LCC'
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
                      : 'bg-gradient-to-r from-purple-500 to-pink-400'
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>

              <div className="flex items-center justify-between mt-1 text-[9px] text-slate-400">
                <span>Basket Weight: {(a.basketWeight * 100).toFixed(1)}%</span>
                <span className={a.activeStatus === 'Active Fleet' ? 'text-emerald-400' : 'text-slate-400'}>
                  ● {a.activeStatus}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-2 bg-[#070D1E] rounded border border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <div className="flex items-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>Weights match DGCA annual carrier capacity schedules. Parity baseline anchored at 100.0.</span>
        </div>
        <div className="flex items-center space-x-1 text-slate-500">
          <HelpCircle className="w-3 h-3" />
          <span>DGCA Fleet Census</span>
        </div>
      </div>
    </div>
  );
};
