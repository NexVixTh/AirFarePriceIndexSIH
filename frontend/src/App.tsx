import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersonaProvider } from './context/PersonaContext';
import { DemoModeProvider } from './context/DemoModeContext';
import { Header } from './components/layout/Header';
import { Sidebar, type NavItemKey } from './components/layout/Sidebar';
import { DemoBanner } from './components/layout/DemoBanner';
import { Footer } from './components/layout/Footer';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ExecutiveOverviewView } from './views/ExecutiveOverview/ExecutiveOverviewView';
import { AirfareIndexView } from './views/AirfareIndex/AirfareIndexView';
import { BookingWindowsView } from './views/BookingWindows/BookingWindowsView';
import { RouteIntelligenceView } from './views/RouteIntelligence/RouteIntelligenceView';
import { AnomaliesView } from './views/Anomalies/AnomaliesView';
import { DataTrustView } from './views/DataTrust/DataTrustView';
import { MethodologyView } from './views/Methodology/MethodologyView';
import { DocumentationView } from './views/Documentation/DocumentationView';
import { JudgeDemoView } from './views/JudgeDemo/JudgeDemoView';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

const AppContent: React.FC = () => {
  const [activeKey, setActiveKey] = useState<NavItemKey>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-blue-600 selection:text-white font-sans">
      {/* Refined Institutional Header */}
      <Header
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        onNavigateToDocs={() => setActiveKey('documentation')}
      />

      {/* Demo dataset warning banner (when active) */}
      <DemoBanner />

      {/* Main Console Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeKey={activeKey}
          onSelectKey={(key) => {
            setActiveKey(key);
            if (window.innerWidth < 1024) {
              setIsSidebarOpen(false);
            }
          }}
          isOpen={isSidebarOpen}
          onCloseMobile={() => setIsSidebarOpen(false)}
        />

        {/* Content Viewport with clean statistical presentation */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-5 lg:p-6 bg-slate-50">
          <div className="max-w-[1600px] mx-auto">
            <ErrorBoundary fallbackTitle={`Error in ${activeKey} view`}>
              {activeKey === 'overview' ? (
                <ExecutiveOverviewView onNavigateToTab={(tab) => setActiveKey(tab as NavItemKey)} />
              ) : activeKey === 'index' ? (
                <AirfareIndexView />
              ) : activeKey === 'lead-time' ? (
                <BookingWindowsView />
              ) : activeKey === 'routes' ? (
                <RouteIntelligenceView />
              ) : activeKey === 'anomalies' ? (
                <AnomaliesView />
              ) : activeKey === 'trust' ? (
                <DataTrustView />
              ) : activeKey === 'methodology' ? (
                <MethodologyView />
              ) : activeKey === 'documentation' ? (
                <DocumentationView />
              ) : (
                <JudgeDemoView />
              )}
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <PersonaProvider>
        <DemoModeProvider>
          <AppContent />
        </DemoModeProvider>
      </PersonaProvider>
    </QueryClientProvider>
  );
};

export default App;
