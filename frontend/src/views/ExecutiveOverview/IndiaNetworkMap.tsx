import React, { useState } from 'react';

export const IndiaNetworkMap: React.FC = () => {
  const [selectedHub, setSelectedHub] = useState<string>('DEL');

  // Aviation hub coordinates on stylized SVG map (topological network reference)
  const HUBS = [
    { code: 'DEL', name: 'Delhi (IGI)', x: 130, y: 75, type: 'Northern Trunk Hub' },
    { code: 'BOM', name: 'Mumbai (CSMIA)', x: 80, y: 160, type: 'Western Trunk Hub' },
    { code: 'BLR', name: 'Bengaluru (KIA)', x: 115, y: 220, type: 'Southern Trunk Hub' },
    { code: 'HYD', name: 'Hyderabad (RGIA)', x: 125, y: 175, type: 'Deccan Trunk Hub' },
    { code: 'MAA', name: 'Chennai (MAA)', x: 145, y: 230, type: 'Southern Coastal Hub' },
    { code: 'CCU', name: 'Kolkata (NSCBIA)', x: 210, y: 135, type: 'Eastern Trunk Hub' },
  ];

  // Flights between hubs for topological reference
  const FLIGHT_ARCS = [
    { from: 'DEL', to: 'BOM', d: 'M 130,75 Q 90,110 80,160' },
    { from: 'BOM', to: 'BLR', d: 'M 80,160 Q 95,195 115,220' },
    { from: 'DEL', to: 'BLR', d: 'M 130,75 Q 135,150 115,220' },
    { from: 'DEL', to: 'CCU', d: 'M 130,75 Q 175,95 210,135' },
    { from: 'BOM', to: 'MAA', d: 'M 80,160 Q 115,200 145,230' },
    { from: 'DEL', to: 'HYD', d: 'M 130,75 Q 135,125 125,175' },
  ];

  return (
    <div className="cmd-panel p-3.5 flex flex-col justify-between border-t-2 border-t-blue-500">
      <div>
        <div className="flex items-center justify-between pb-2 border-b border-[#1B2A4A]">
          <div className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
              India Hub Topology
            </h4>
          </div>
          <span className="text-[9px] font-mono text-cyan-300 bg-[#101B39] px-1.5 py-0.5 rounded border border-cyan-500/30">
            Topological Reference
          </span>
        </div>

        {/* Stylized Vector Map of India Aviation Golden Quadrilateral */}
        <div className="py-1 flex justify-center">
          <svg className="w-full h-44 max-w-[280px]" viewBox="0 0 260 260">
            <pattern id="gridNet" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#101C38" strokeWidth="0.5" />
            </pattern>
            <rect width="260" height="260" fill="url(#gridNet)" />

            {/* Connecting Flight Arcs */}
            {FLIGHT_ARCS.map((arc, i) => (
              <path
                key={i}
                d={arc.d}
                fill="none"
                stroke="#1E3A8A"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
            ))}

            {/* Hub City Nodes */}
            {HUBS.map((hub) => {
              const isSelected = selectedHub === hub.code;
              return (
                <g
                  key={hub.code}
                  onClick={() => setSelectedHub(hub.code)}
                  className="cursor-pointer group"
                >
                  {isSelected && (
                    <circle
                      cx={hub.x}
                      cy={hub.y}
                      r="9"
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="1.5"
                      className="animate-ping opacity-60"
                    />
                  )}
                  <circle
                    cx={hub.x}
                    cy={hub.y}
                    r="5"
                    fill={isSelected ? '#3B82F6' : '#10B981'}
                    stroke="#0B132B"
                    strokeWidth="1.5"
                  />
                  <text
                    x={hub.x + 7}
                    y={hub.y + 3}
                    fill={isSelected ? '#60A5FA' : '#94A3B8'}
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {hub.code}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Selected Hub Intelligence Footer */}
      <div className="pt-1.5 border-t border-[#1B2A4A] text-[10px] font-mono text-slate-300 flex items-center justify-between">
        <span className="truncate text-cyan-300">
          {HUBS.find((h) => h.code === selectedHub)?.name}
        </span>
        <span className="text-slate-400">
          {HUBS.find((h) => h.code === selectedHub)?.type}
        </span>
      </div>
    </div>
  );
};
