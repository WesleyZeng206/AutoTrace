CREATE TABLE IF NOT EXISTS requests_raw (
  id BIGSERIAL PRIMARY KEY,
  request_id UUID NOT NULL UNIQUE,
  service_name VARCHAR(255) NOT NULL,
  route VARCHAR(500) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INT NOT NULL,
  duration_ms INT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  error_type VARCHAR(255),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_timestamp ON requests_raw(service_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_route_timestamp ON requests_raw(route, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_status ON requests_raw(status_code);
CREATE INDEX IF NOT EXISTS idx_timestamp ON requests_raw(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_request_id ON requests_raw(request_id);
CREATE INDEX IF NOT EXISTS idx_created_at ON requests_raw(created_at);

CREATE TABLE IF NOT EXISTS aggregated_metrics_hourly (
  id BIGSERIAL PRIMARY KEY,
  service_name VARCHAR(255) NOT NULL,
  route VARCHAR(500) NOT NULL,
  time_bucket TIMESTAMPTZ NOT NULL,
  request_count INT NOT NULL,
  error_count INT NOT NULL,
  avg_latency FLOAT NOT NULL,
  p50_latency FLOAT NOT NULL,
  p95_latency FLOAT NOT NULL,
  p99_latency FLOAT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(service_name, route, time_bucket)
);

CREATE INDEX IF NOT EXISTS idx_hourly_service_time ON aggregated_metrics_hourly(service_name, time_bucket DESC);
CREATE INDEX IF NOT EXISTS idx_hourly_route_time ON aggregated_metrics_hourly(route, time_bucket DESC);

CREATE OR REPLACE FUNCTION cleanup_old_events(retention_days INT DEFAULT 30)
RETURNS INT AS $$
DECLARE
  deleted_count INT;
BEGIN
  DELETE FROM requests_raw
  WHERE timestamp < NOW() - (retention_days || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE VIEW recent_errors AS
SELECT
  request_id,
  service_name,
  route,
  method,
  status_code,
  duration_ms,
  timestamp,
  error_type,
  error_message
FROM requests_raw
WHERE status_code >= 400
  AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC
LIMIT 100;

CREATE OR REPLACE VIEW service_health_summary AS
SELECT
  service_name,
  COUNT(*) as total_requests,
  SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as error_count,
  ROUND((SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END)::FLOAT / COUNT(*) * 100), 2) as error_rate,
  ROUND(AVG(duration_ms)::NUMERIC, 2) as avg_latency_ms,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms)::NUMERIC, 2) as p95_latency_ms
FROM requests_raw
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY service_name
ORDER BY total_requests DESC;
