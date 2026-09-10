import React from 'react';

export const RouteBasketWidget: React.FC = () => {
  // Real fixed basket weights from backend pipeline/index_calculator.py ROUTE_WEIGHTS & BASE_PERIOD_FARES
  const BASKET_ROUTES = [
    { route: 'DEL-BOM', name: 'Delhi ⇄ Mumbai', weight: '25.0%', baseFare: '₹4,500', baseMonth: '2024-01' },
    { route: 'DEL-BLR', name: 'Delhi ⇄ Bengaluru', weight: '20.0%', baseFare: '₹5,500', baseMonth: '2024-01' },
    { route: 'BOM-BLR', name: 'Mumbai ⇄ Bengaluru', weight: '20.0%', baseFare: '₹4,000', baseMonth: '2024-01' },
    { route: 'BOM-HYD', name: 'Mumbai ⇄ Hyderabad', weight: '20.0%', baseFare: '₹4,200', baseMonth: '2024-01' },
    { route: 'DEL-CCU', name: 'Delhi ⇄ Kolkata', weight: '15.0%', baseFare: '₹3,500', baseMonth: '2024-01' },
  ];

  return (
    <div className="cmd-panel p-3.5 flex flex-col justify-between border-t-2 border-t-emerald-500">
      <div>
        <div className="flex items-center justify-between pb-2 border-b border-[#1B2A4A]">
          <div className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
              DGCA Route Basket Weights
            </h4>
          </div>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#101B39] text-emerald-400 border border-emerald-500/30">
            Fixed Basket
          </span>
        </div>

        <div className="space-y-2 mt-2.5">
          {BASKET_ROUTES.map((r) => (
            <div key={r.route} className="space-y-0.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-200 font-bold">{r.route}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-slate-400 text-[10px]">Base: {r.baseFare}</span>
                  <span className="text-cyan-400 font-bold">Weight: {r.weight}</span>
                </div>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#101B39] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-400"
                  style={{ width: `${parseFloat(r.weight) * 3.5}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2 mt-2 border-t border-[#1B2A4A] text-[9px] font-mono text-slate-400 flex items-center justify-between">
        <span>pipeline/index_calculator.py</span>
        <span className="text-emerald-400">Sum of Weights = 100%</span>
      </div>
    </div>
  );
};
