import React from 'react';
import { Clock, Activity } from 'lucide-react';

export const BookingWindowWidget: React.FC = () => {
  // Lead-time booking windows defined by methodology (pipeline/index_calculator.py)
  const BOOKING_WINDOWS = [
    { window: 'T-1', label: '1 Day Ahead' },
    { window: 'T-3', label: '3 Days Ahead' },
    { window: 'T-7', label: '1 Week Ahead' },
    { window: 'T-14', label: '2 Weeks Ahead' },
    { window: 'T-21', label: '3 Weeks Ahead' },
    { window: 'T-30', label: '1 Month Ahead' },
  ];

  return (
    <div className="cmd-panel p-3.5 flex flex-col justify-between border-t-2 border-t-orange-500">
      <div>
        <div className="flex items-center justify-between pb-2 border-b border-[#1B2A4A]">
          <div className="flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-orange-400" />
            <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
              Booking Window Behaviour
            </h4>
          </div>
          <span className="text-[9px] font-mono text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-600/30">
            Awaiting Data
          </span>
        </div>

        <div className="p-3 rounded bg-[#080E20] border border-[#1B2A4A] mt-2.5 space-y-2 text-xs">
          <div className="flex items-center space-x-2 text-amber-400 font-mono text-[11px] font-semibold">
            <Activity className="w-3.5 h-3.5 shrink-0" />
            <span>Lead-Time Elasticity Structure</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
            Booking-window analysis awaiting sufficient fare observations. Configured observation brackets:
          </p>
          <div className="grid grid-cols-3 gap-1 pt-1 text-[10px] font-mono">
            {BOOKING_WINDOWS.map((b) => (
              <div key={b.window} className="px-1.5 py-0.5 rounded bg-[#101B39] text-slate-300 text-center border border-[#1B2A4A]">
                {b.window}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-2 mt-2 border-t border-[#1B2A4A] text-[9px] font-mono text-slate-400 flex items-center justify-between">
        <span>Advance Purchase Windows</span>
        <span className="text-orange-400">T-1 to T-30 Configured</span>
      </div>
    </div>
  );
};
