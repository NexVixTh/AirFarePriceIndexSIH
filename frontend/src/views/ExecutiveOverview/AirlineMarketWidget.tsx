import React from 'react';
import { Plane } from 'lucide-react';

export const AirlineMarketWidget: React.FC = () => {
  // Real scheduled airline weighting vector from backend pipeline/index_calculator.py AIRLINE_WEIGHTS
  const AIRLINE_WEIGHTS_DATA = [
    { code: '6E', name: 'IndiGo', weight: '25.0%' },
    { code: 'AI', name: 'Air India', weight: '20.0%' },
    { code: 'SG', name: 'SpiceJet', weight: '15.0%' },
    { code: 'G8', name: 'Go Air', weight: '15.0%' },
    { code: 'IX', name: 'Air India Express', weight: '10.0%' },
    { code: 'UK', name: 'Vistara', weight: '10.0%' },
    { code: '9W', name: 'Jet Airways', weight: '5.0%' },
  ];

  return (
    <div className="cmd-panel p-3.5 flex flex-col justify-between border-t-2 border-t-blue-500">
      <div>
        <div className="flex items-center justify-between pb-2 border-b border-[#1B2A4A]">
          <div className="flex items-center space-x-1.5">
            <Plane className="w-3.5 h-3.5 text-blue-400" />
            <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
              Airline Basket Weights
            </h4>
          </div>
          <span className="text-[9px] font-mono text-cyan-300 bg-[#101B39] px-1.5 py-0.5 rounded">
            Index Weights
          </span>
        </div>

        <div className="space-y-1.5 mt-2">
          {AIRLINE_WEIGHTS_DATA.slice(0, 5).map((a) => (
            <div key={a.code} className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-300 font-semibold">{a.name} ({a.code})</span>
              <div className="flex items-center space-x-2">
                <span className="text-cyan-400 font-bold">{a.weight}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#101B39] text-slate-400">
                  Basket Item
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2 mt-2 border-t border-[#1B2A4A] text-[9px] font-mono text-slate-400 flex items-center justify-between">
        <span>pipeline/index_calculator.py</span>
        <span className="text-blue-400">AIRLINE_WEIGHTS</span>
      </div>
    </div>
  );
};
