import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Clock,
  Route,
  AlertTriangle,
  ShieldCheck,
  Scale,
  BookOpen,
  PlayCircle
} from 'lucide-react';

export type NavItemKey =
  | 'overview'
  | 'index'
  | 'lead-time'
  | 'routes'
  | 'anomalies'
  | 'trust'
  | 'methodology'
  | 'documentation'
  | 'judge-demo';

interface NavItem {
  key: NavItemKey;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavGroup {
  groupLabel: string;
  items: NavItem[];
}

interface SidebarProps {
  activeKey: NavItemKey;
  onSelectKey: (key: NavItemKey) => void;
  isOpen: boolean;
  onCloseMobile?: () => void;
}

const NAVIGATION_GROUPS: NavGroup[] = [
  {
    groupLabel: 'MAIN',
    items: [
      { key: 'overview', label: 'Overview', icon: LayoutDashboard },
      { key: 'index', label: 'Airfare Index', icon: TrendingUp },
      { key: 'lead-time', label: 'Lead-Time Dynamics', icon: Clock },
      { key: 'routes', label: '11 DGCA Corridors', icon: Route },
      { key: 'anomalies', label: 'Anomalies Review', icon: AlertTriangle },
      { key: 'trust', label: 'Data Trust Center', icon: ShieldCheck },
      { key: 'methodology', label: 'Methodology', icon: Scale },
    ],
  },
  {
    groupLabel: 'DOCUMENTATION',
    items: [
      { key: 'documentation', label: 'Project Manual', icon: BookOpen, badge: 'Docs' },
    ],
  },
  {
    groupLabel: 'SPECIAL',
    items: [
      { key: 'judge-demo', label: 'Judge Demo', icon: PlayCircle, badge: 'SIH' },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeKey,
  onSelectKey,
  isOpen,
  onCloseMobile,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Clean White Public-Sector Sidebar Shell */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-60 bg-white border-r border-slate-200 transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-0 flex flex-col select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Navigation Header Tag */}
        <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
            NAVIGATION
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
            PROTOTYPE v2.2
          </span>
        </div>

        {/* Grouped Links */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3.5 space-y-5 custom-scrollbar">
          {NAVIGATION_GROUPS.map((group) => (
            <div key={group.groupLabel} className="space-y-1">
              <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 tracking-wider font-mono uppercase">
                {group.groupLabel}
              </div>

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeKey === item.key;

                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        onSelectKey(item.key);
                        if (onCloseMobile) onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-all ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-semibold border-l-3 border-blue-600 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-blue-600' : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                            isActive
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer: DGCA Basket Info */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70 text-[11px] text-slate-500 font-mono">
          <div className="flex items-center justify-between text-slate-700 font-semibold">
            <span>DGCA Basket</span>
            <span className="text-blue-600 font-bold">Base 2024-01</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            11 Domestic Metro Corridors
          </p>
        </div>
      </aside>
    </>
  );
};
