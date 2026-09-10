import React from 'react';
import { ChevronRight, Database, CheckCircle2, Shield, Layers, Scale, LineChart, TrendingUp } from 'lucide-react';
import { usePersona } from '../../context/PersonaContext';

const PIPELINE_STEPS = [
  { id: 'sources', label: '7 Sources', sub: '5 Air + 2 OTA', icon: Database },
  { id: 'collection', label: 'Playwright Fleet', sub: 'Rate-limited', icon: CheckCircle2 },
  { id: 'cleaning', label: 'IQR & Tax Filter', sub: 'Outlier rejection', icon: Shield },
  { id: 'basket', label: 'Fixed Basket', sub: 'Representative routes', icon: Layers },
  { id: 'weights', label: 'DGCA Weights', sub: 'Passenger volume', icon: Scale },
  { id: 'index', label: 'APIx Index', sub: 'Base 2024-01=100', icon: LineChart },
  { id: 'policy', label: 'MoSPI Transport Signal', sub: 'CPI Augmentation', icon: TrendingUp },
];

export const PipelineBreadcrumb: React.FC = () => {
  const { isAnalyst } = usePersona();

  return (
    <div className="bg-gov-dark/95 border-b border-gov-border px-4 py-2 text-xs overflow-x-auto custom-scrollbar select-none">
      <div className="flex items-center min-w-[760px] justify-between">
        <div className="flex items-center space-x-1 text-[11px] font-mono text-gov-muted mr-3">
          <span className="text-blue-400 font-bold uppercase tracking-wider text-[10px]">Data Lineage:</span>
        </div>

        <div className="flex items-center space-x-1.5 flex-1 justify-between">
          {PIPELINE_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isLast = idx === PIPELINE_STEPS.length - 1;
            return (
              <React.Fragment key={step.id}>
                <div className="flex items-center space-x-1.5 px-2 py-1 rounded bg-gov-surface/70 border border-gov-border text-slate-300 hover:border-blue-500/40 transition-colors">
                  <Icon className="w-3.5 h-3.5 text-blue-400" />
                  <div>
                    <div className="font-semibold text-[11px] leading-none text-slate-200">{step.label}</div>
                    {isAnalyst && (
                      <div className="text-[9px] text-gov-muted font-mono leading-tight mt-0.5">{step.sub}</div>
                    )}
                  </div>
                </div>
                {!isLast && <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
