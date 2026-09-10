export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  database: string;
  timestamp: string;
}

export interface IndexResponse {
  national_index: number | null;
  base_period: string;
  current_period: string;
  route_indices: Record<string, number>;
  airline_indices: Record<string, number>;
  timestamp: string;
  coverage_percent?: number;
  routes_covered?: number;
  total_routes_in_basket?: number;
}

export interface IndexHistoryItem {
  id: number;
  calculated_at: string;
  base_period: string;
  current_period: string;
  national_index: number;
  coverage_percent: number;
  routes_covered: number;
  total_routes_in_basket: number;
  route_indices: Record<string, number>;
  airline_indices: Record<string, number>;
  methodology: string;
}

export interface FareQuote {
  id: number;
  origin: string;
  destination: string;
  carrier: string;
  source_site: string;
  departure_date: string;
  advance_purchase_days: number;
  fare_class?: string | null;
  base_fare?: number | null;
  taxes_fees?: number | null;
  total_fare: number;
  is_available: boolean;
  scrape_timestamp?: string;
}

export interface RouteSummaryItem {
  origin: string;
  destination: string;
  quote_count: number;
}

export interface RouteStatistics {
  route: string;
  min_fare: number;
  max_fare: number;
  mean_fare: number;
  median_fare: number;
  std_dev: number;
  sample_size: number;
  update_count: number;
}

export interface AirlineStatistics {
  carrier: string;
  mean_fare: number;
  median_fare: number;
  min_fare: number;
  max_fare: number;
  std_dev: number;
  sample_count: number;
  route_count: number;
  routes: string[];
  period_days: number;
}

export interface DataQualityReport {
  total_quotes: number;
  valid_quotes: number;
  invalid_quotes: number;
  validity_percent: number;
  average_quality_score: number;
  source_coverage: Record<string, number>;
  report_timestamp: string;
}

export interface CPIItem {
  period: string;
  sub_group: string;
  index_value: number | null;
  inflation_rate: number | null;
  fetched_at: string;
  source: string;
}

export interface CPITransportResponse {
  status: string;
  source: string;
  sub_group: string;
  data: CPIItem[];
  fetched_at: string;
}

export interface AnomalyRecord {
  id: number;
  detected_at: string;
  route: string;
  carrier?: string | null;
  fare: number;
  baseline_fare: number;
  spike_percent: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  anomaly_type: string;
  status: 'ACTIVE' | 'RESOLVED';
  notes?: string | null;
}

export interface ScraperJobLog {
  id: number;
  scraper_name: string;
  route: string;
  advance_days: number;
  started_at: string;
  completed_at?: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed';
  quotes_collected: number;
  error_message?: string | null;
}

export interface DGCAValidationReport {
  our_index: number;
  dgca_reference_index: number;
  difference: number;
  percent_difference: number;
  validation_status: string;
  month: string;
  report_generated: string;
}

export interface PriorityRoutesResponse {
  priority_routes: string[];
  source: string;
  basis: string;
}

export interface WindowData {
  advance_days: number;
  departure_date: string;
  min_fare?: number;
  max_fare?: number;
  avg_fare?: number;
  quote_count?: number;
  airlines?: string[];
  data_available?: boolean;
}

export interface MultiWindowResponse {
  route: string;
  base_date: string;
  windows: Record<string, WindowData>;
  elasticity: Record<string, number>;
  analysis_timestamp: string;
}

export interface LeadTimeElasticityPoint {
  advance_days: number;
  window: string;
  avg_price: number;
  quote_count: number;
}

export interface LeadTimeElasticityResponse {
  route: string;
  elasticity_curve: LeadTimeElasticityPoint[];
  timestamp: string;
}

export interface SchedulerStats {
  total_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  total_quotes_collected: number;
  scheduler_running: boolean;
  active_jobs: number;
}

export interface DGCAMethodologyReport {
  title: string;
  methodology: string;
  reference_framework: string;
  weighting_source: string;
  routes_tracked: number;
  airlines_tracked: number;
  calculation_frequency: string;
  base_period: string;
  key_features: string[];
  data_sources: string[];
  quality_assurance: string[];
  validation_approach: string;
  generated_at: string;
}

