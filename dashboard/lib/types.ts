export interface TelemetryEvent {
  id?: number;
  request_id: string;
  service_name: string;
  route: string;
  method: string;
  status_code: number;
  duration_ms: number;
  timestamp: string;
  error_type?: string;
  error_message?: string;
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface AggregatedMetric {
  id?: number;
  service_name: string;
  route: string;
  time_bucket: string;
  request_count: number;
  error_count: number;
  avg_latency: number;
  p50_latency: number;
  p95_latency: number;
  p99_latency: number;
}

export interface QueryFilters {
  service?: string;
  route?: string;
  startTime?: string;
  endTime?: string;
  limit?: number;
  offset?: number;
}

export interface MetricsResponse {
  metrics: AggregatedMetric[];
}

export interface EventsResponse {
  events: TelemetryEvent[];
  total: number;
}

export interface ServicesResponse {
  services: string[];
}