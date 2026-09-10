import type {
  HealthResponse,
  IndexResponse,
  IndexHistoryItem,
  RouteSummaryItem,
  RouteStatistics,
  AirlineStatistics,
  MultiWindowResponse,
  LeadTimeElasticityResponse,
  SchedulerStats,
  DataQualityReport,
  CPITransportResponse,
  AnomalyRecord,
  ScraperJobLog,
  PriorityRoutesResponse,
  DGCAValidationReport,
  DGCAMethodologyReport,
  FareQuote,
} from './types';

class ApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        throw new Error(
          `API Error ${response.status} (${response.statusText}): ${errorBody.slice(0, 150)}`
        );
      }

      return await response.json();
    } catch (err) {
      console.warn(`[API Client Warning] Failed fetching ${url}:`, err);
      throw err;
    }
  }

  // Health
  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  // Index
  async getIndex(basePeriod: string = '2024-01'): Promise<IndexResponse> {
    return this.request<IndexResponse>(`/index?base_period=${encodeURIComponent(basePeriod)}`);
  }

  async getIndexHistory(limit: number = 30): Promise<IndexHistoryItem[]> {
    return this.request<IndexHistoryItem[]>(`/index/history?limit=${limit}`);
  }

  async triggerIndexSnapshot(basePeriod: string = '2024-01'): Promise<{ status: string; snapshot_id: number; national_index: number }> {
    return this.request('/index/snapshot', {
      method: 'POST',
      body: JSON.stringify({ base_period: basePeriod }),
    });
  }

  // Routes
  async getRoutes(): Promise<RouteSummaryItem[]> {
    return this.request<RouteSummaryItem[]>('/routes');
  }

  async getRouteStats(origin: string, destination: string): Promise<RouteStatistics> {
    return this.request<RouteStatistics>(`/route-stats/${origin}/${destination}`);
  }

  async getAirlineStats(carrier: string): Promise<AirlineStatistics> {
    return this.request<AirlineStatistics>(`/airline-stats/${carrier}`);
  }

  // Booking Windows & Elasticity
  async getMultiWindowAnalysis(origin: string, destination: string): Promise<MultiWindowResponse> {
    return this.request<MultiWindowResponse>(`/multi-window-analysis/${origin}/${destination}`);
  }

  async getLeadTimeElasticity(origin: string, destination: string): Promise<LeadTimeElasticityResponse> {
    return this.request<LeadTimeElasticityResponse>(`/lead-time-elasticity/${origin}/${destination}`);
  }

  // Fares
  async getFares(params?: { origin?: string; destination?: string; limit?: number }): Promise<FareQuote[]> {
    const query = new URLSearchParams();
    if (params?.origin) query.append('origin', params.origin);
    if (params?.destination) query.append('destination', params.destination);
    if (params?.limit) query.append('limit', params.limit.toString());
    const qs = query.toString();
    return this.request<FareQuote[]>(`/fares${qs ? `?${qs}` : ''}`);
  }

  // Data Quality & Observability
  async getDataQuality(): Promise<DataQualityReport> {
    return this.request<DataQualityReport>('/data-quality-report');
  }

  async getScraperLogs(limit: number = 50): Promise<ScraperJobLog[]> {
    return this.request<ScraperJobLog[]>(`/scraper-logs?limit=${limit}`);
  }

  // Anomalies
  async getAnomalies(route?: string): Promise<AnomalyRecord[]> {
    const url = route ? `/anomalies?route=${encodeURIComponent(route)}` : '/anomalies';
    return this.request<AnomalyRecord[]>(url);
  }

  async getRouteOutliers(origin: string, destination: string): Promise<{
    route: string;
    total_quotes: number;
    normal_quotes_count: number;
    outlier_quotes_count: number;
    outlier_percentage: number;
    outlier_fares: number[];
  }> {
    return this.request(`/outlier-detection/${origin}/${destination}`);
  }

  // MoSPI CPI
  async getOfficialCPI(): Promise<CPITransportResponse> {
    return this.request<CPITransportResponse>('/cpi/official');
  }

  // DGCA
  async getPriorityRoutes(): Promise<PriorityRoutesResponse> {
    return this.request<PriorityRoutesResponse>('/priority-routes');
  }

  async getDGCAValidation(period: string = '2024-09'): Promise<DGCAValidationReport> {
    return this.request<DGCAValidationReport>(`/dgca-validation?period=${encodeURIComponent(period)}`);
  }

  async getDGCAMethodology(): Promise<DGCAMethodologyReport> {
    return this.request<DGCAMethodologyReport>('/dgca-methodology');
  }

  // Scraper Execution Trigger
  async triggerScrape(
    scraperType: 'indigo' | 'goibibo',
    origin: string,
    destination: string,
    daysAhead: number = 7
  ): Promise<{ status: string; scraper: string; route: string; quotes_extracted: number; timestamp: string }> {
    return this.request(
      `/scrape/${scraperType}?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&days_ahead=${daysAhead}`,
      { method: 'POST' }
    );
  }

  // Scheduler Telemetry
  async getSchedulerStats(): Promise<SchedulerStats> {
    return this.request<SchedulerStats>('/scheduler-stats');
  }

  async startScheduler(hour: number = 8): Promise<{ status: string; message: string }> {
    return this.request(`/scheduler/start?hour=${hour}`, { method: 'POST' });
  }
}

export const api = new ApiClient();
