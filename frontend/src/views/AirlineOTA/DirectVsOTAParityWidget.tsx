import React from 'react';
import { 
  ArrowRightLeft, 
  Coins, 
  Info 
} from 'lucide-react';
import { usePersona } from '../../context/PersonaContext';

export const DirectVsOTAParityWidget: React.FC = () => {
  const { isAnalyst } = usePersona();

  const PARITY_COMPARISON = [
    {
      metric: 'Base Tariff Parity',
      direct: '100.0% GDS Parity',
      ota: '100.0% GDS Parity',
      spread: '₹0.00 (Zero Drift)',
      status: 'Aligned',
    },
    {
      metric: 'Published Convenience Fee',
      direct: '₹350 – ₹400 / Pax',
      ota: '₹399 – ₹499 / Pax',
      spread: '+₹50 – +₹100 on OTA',
      status: 'OTA Higher',
    },
    {
      metric: 'Instant Bank Cashback',
      direct: 'Selected Cards Only',
      ota: 'Aggressive (₹300 – ₹600)',
      spread: '-₹200 net on OTA (Promotional)',
      status: 'Coupon Driven',
    },
    {
      metric: 'Cancellation Processing Markup',
      direct: 'Official Airline Slab',
      ota: 'Airline Slab + ₹250 OTA Admin Fee',
      spread: '+₹250 on OTA Cancellation',
      status: 'OTA Penalty',
    },
  ];

  return (
    <div className="cmd-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <ArrowRightLeft className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
            Direct Airline vs OTA Price Parity Engine
          </span>
        </div>
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-blue-950/80 text-blue-300 border border-blue-800/60">
          Source Transparency
        </span>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        {/* Direct Airline Booking Engine */}
        <div className="bg-[#070D1E] p-3 rounded border border-blue-900/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">
              Direct Airline Portals
            </span>
            <span className="px-1.5 py-0.2 rounded text-[8px] bg-blue-950 text-blue-300 border border-blue-800/60">
              INDIGO / AIR INDIA
            </span>
          </div>

          <div className="space-y-1 text-[11px] text-slate-300 pt-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Inventory Feed:</span>
              <span className="font-bold text-white">Direct Navitaire / Amadeus</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Platform Surcharge:</span>
              <span className="text-emerald-400 font-bold">Standard Convenience</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Seat / Meal Markup:</span>
              <span className="text-white font-bold">Base Airline Tariff</span>
            </div>
          </div>
        </div>

        {/* OTA Aggregators */}
        <div className="bg-[#070D1E] p-3 rounded border border-orange-900/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">
              Online Travel Agencies (OTA)
            </span>
            <span className="px-1.5 py-0.2 rounded text-[8px] bg-orange-950 text-orange-300 border border-orange-800/60">
              GOIBIBO / MMT / EMT
            </span>
          </div>

          <div className="space-y-1 text-[11px] text-slate-300 pt-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Inventory Feed:</span>
              <span className="font-bold text-white">API Aggregator / GDS</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Platform Surcharge:</span>
              <span className="text-amber-400 font-bold">Convenience + Admin Fee</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Promotions:</span>
              <span className="text-cyan-300 font-bold">Discounts on Checkout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparative Slabs Table */}
      <div className="overflow-x-auto border border-slate-800/80 rounded bg-[#070D1E]">
        <table className="w-full text-left border-collapse text-[11px] font-mono">
          <thead>
            <tr className="bg-[#0B132B] border-b border-slate-800 text-slate-400 uppercase text-[10px]">
              <th className="py-2 px-3">Parity Dimension</th>
              <th className="py-2 px-3 text-blue-400">Direct Carrier</th>
              <th className="py-2 px-3 text-orange-400">OTA Aggregator</th>
              <th className="py-2 px-3 text-right">Net Variance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {PARITY_COMPARISON.map((row) => (
              <tr key={row.metric} className="hover:bg-slate-800/30">
                <td className="py-2 px-3 font-semibold text-slate-200">{row.metric}</td>
                <td className="py-2 px-3 text-slate-300">{row.direct}</td>
                <td className="py-2 px-3 text-slate-300">{row.ota}</td>
                <td className="py-2 px-3 text-right font-bold text-cyan-300">{row.spread}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Persona Dependent Callout */}
      {isAnalyst ? (
        <div className="p-2.5 bg-[#070D1E] rounded border border-slate-800/80 space-y-1 text-[10px] font-mono text-slate-400">
          <div className="flex items-center space-x-1 text-slate-200 font-semibold">
            <Coins className="w-3.5 h-3.5 text-blue-400" />
            <span>Economic Parity Assessment (MoSPI Airfare Index Methodology)</span>
          </div>
          <div>
            The Airfare Price Index normalizes total checkout price to ensure parity across channels. When calculating Laspeyres relatives, headline fares are evaluated excluding optional baggage or insurance add-ons, but including mandatory convenience fees and airport taxes.
          </div>
        </div>
      ) : (
        <div className="p-2.5 bg-[#070D1E] rounded border border-slate-800/80 flex items-start space-x-2 text-xs text-slate-300">
          <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white">Consumer Price Insight: </span>
            Airlines and travel websites advertise the same base ticket price. However, OTAs often apply coupon codes at payment, while charging slightly higher convenience fees. Final prices differ by less than 2% across platforms.
          </div>
        </div>
      )}
    </div>
  );
};
