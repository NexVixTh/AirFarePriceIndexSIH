import React from 'react';
import { Sigma, Scale, Lightbulb } from 'lucide-react';
import { usePersona } from '../../context/PersonaContext';

export const LaspeyresFormulaSpecificationCard: React.FC = () => {
  const { isAnalyst } = usePersona();

  return (
    <div className="cmd-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <Sigma className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
            Mathematical Formulation: Laspeyres Index Engine
          </span>
        </div>
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-blue-950/80 text-blue-300 border border-blue-800/60">
          MoSPI Statistical Standard
        </span>
      </div>

      {/* Primary Mathematical Display */}
      <div className="p-3.5 bg-[#070D1E] rounded border border-blue-900/40 space-y-2">
        <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
          National Airfare Price Index (APIx) Aggregation
        </div>

        {/* Latex-style formatted formula block */}
        <div className="p-3 bg-[#0B132B] rounded border border-slate-800 text-center font-mono space-y-1">
          <div className="text-sm sm:text-base font-bold text-white tracking-wide">
            I_t = ∑ [ w_r × ( P_{'{r,t}'} / P_{'{r,0}'} ) ] × 100
          </div>
          <div className="text-[10px] text-blue-300">
            r ∈ {'{'} Domestic Trunk Corridors {'}'}, where ∑ w_r = 1.000
          </div>
        </div>

        {/* Elementary Price Index (Jevons Formula) */}
        <div className="p-2.5 bg-[#0B132B] rounded border border-slate-800 text-center font-mono space-y-0.5">
          <div className="text-xs font-semibold text-slate-200">
            Elementary Price Relative (Unweighted Geometric Mean): P_{'{r,t}'} = ( ∏ p_{'{r,i,t}'} )^(1/n)
          </div>
          <div className="text-[9px] text-slate-400">
            Jevons formula ensures transitivity and minimizes upward elementary substitution bias.
          </div>
        </div>
      </div>

      {/* Variable Definitions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
        <div className="p-2 bg-[#070D1E] rounded border border-slate-800">
          <span className="font-bold text-cyan-300">w_r (Route Weight)</span>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Normalized annual passenger traffic volume on corridor r, published by DGCA.
          </p>
        </div>

        <div className="p-2 bg-[#070D1E] rounded border border-slate-800">
          <span className="font-bold text-emerald-400">P_{'{r,0}'} (Base Price)</span>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Reference average economy fare recorded during baseline period (January 2024 = 100.0).
          </p>
        </div>

        <div className="p-2 bg-[#070D1E] rounded border border-slate-800">
          <span className="font-bold text-purple-400">P_{'{r,t}'} (Observed Price)</span>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Current daily geometric mean fare collected across discrete advance booking windows.
          </p>
        </div>
      </div>

      {/* Dual Persona Narrative */}
      {isAnalyst ? (
        <div className="p-2.5 bg-[#070D1E] rounded border border-slate-800 space-y-1 text-[10px] font-mono text-slate-400">
          <div className="flex items-center space-x-1.5 text-slate-200 font-semibold">
            <Scale className="w-3 h-3 text-blue-400" />
            <span>Axiomatic Properties & CPI Transport Harmonization</span>
          </div>
          <p>
            The Laspeyres formulation satisfies the Identity Axiom (I_{'{0}'} = 100.0) and Homogeneity of Degree Zero in current prices. Weights remain fixed over the 5-year base period cycle, exactly matching the methodological design of MoSPI Consumer Price Index (Rural/Urban/Combined) Group 5.4.
          </p>
        </div>
      ) : (
        <div className="p-2.5 bg-[#070D1E] rounded border border-slate-800 flex items-start space-x-2 text-xs text-slate-300">
          <Lightbulb className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white">Methodology in Plain English: </span>
            Just like CPI tracks a fixed shopping basket of milk, grain, and vegetables, APIx tracks a fixed basket of popular flight routes (e.g. Delhi to Mumbai, Bengaluru, Kolkata). High-traffic routes have a bigger impact on the national index than small routes.
          </div>
        </div>
      )}
    </div>
  );
};
