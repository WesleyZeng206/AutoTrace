export interface AnomalyConfig {
  defaultWindowHours: number;
  maxWindowHours: number;
  minRequests: number;
  criticalThreshold: number;
  warningThreshold: number;
  minDataPoints: number;
}

export const anomalyConfig: AnomalyConfig = {
  defaultWindowHours: parseInt(process.env.REALTIME_ANOMALY_DEFAULT_WINDOW_HOURS || '48', 10),
  maxWindowHours: parseInt(process.env.REALTIME_ANOMALY_MAX_WINDOW_HOURS || '168', 10),
  minRequests: parseInt(process.env.REALTIME_ANOMALY_MIN_REQUESTS || '10', 10),
  criticalThreshold: parseFloat(process.env.REALTIME_ANOMALY_CRITICAL_THRESHOLD || '3.0'),
  warningThreshold: parseFloat(process.env.REALTIME_ANOMALY_WARNING_THRESHOLD || '2.0'),
  minDataPoints: parseInt(process.env.REALTIME_ANOMALY_MIN_DATA_POINTS || '5', 10),
};
