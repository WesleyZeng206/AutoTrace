import { fetchJson } from './http';

export interface DashboardStats {
  totalRequests: number;
  errorRate: number;
  avgLatency: number;
  p50Latency: number;
  p90Latency: number;
  p95Latency?: number;
  p99Latency?: number;
}

export interface MetricDataPoint {
  time_bucket: string;
  avg_latency: number;
  p50_latency: number;
  p90_latency: number;
  request_count: number;
  error_count: number;
}

type RangeParams = {
  teamId: string;
  startTime: string;
  endTime: string;
};

export async function fetchStats(params: RangeParams): Promise<DashboardStats> {
  const url = buildUrl('/api/stats', params);
  const { stats } = await fetchJson<{ stats: DashboardStats | null }>(url);
  return stats ?? { totalRequests: 0, errorRate: 0, avgLatency: 0, p50Latency: 0, p90Latency: 0 };
}

export async function fetchServices(teamId: string): Promise<string[]> {
  const url = buildUrl('/api/services', { teamId });
  const { services } = await fetchJson<{ services: string[] }>(url);
  return services;
}

export async function fetchMetrics(
  params: RangeParams & { interval: string }
): Promise<MetricDataPoint[]> {
  const url = buildUrl('/api/metrics', params);
  const { metrics } = await fetchJson<{ metrics: MetricDataPoint[] }>(url);
  return metrics ?? [];
}

export interface RouteData {
  id: string;
  route: string;
  method: string;
  requests: number;
  errorRate: number;
  avgLatency: number;
  status: 'healthy' | 'warning' | 'critical';
}

export async function fetchRoutes(params: RangeParams): Promise<RouteData[]> {
  const url = buildUrl('/api/routes', { ...params, limit: '10' });
  const { routes } = await fetchJson<{ routes: RouteData[] }>(url);
  return routes ?? [];
}

export interface DistributionData {
  range: string;
  count: number;
}

export async function fetchDistribution(params: RangeParams): Promise<DistributionData[]> {
  const url = buildUrl('/api/distribution', params);
  const { distribution } = await fetchJson<{ distribution: DistributionData[] }>(url);
  return distribution ?? [];
}

function buildUrl(path: string, params: Record<string, string>) {
  const url = new URL(path, window.location.origin);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
}
