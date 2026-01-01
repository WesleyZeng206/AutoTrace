# Aggregator

The aggregator pre-computes hourly metrics so the dashboard doesn't have to scan millions of rows every time.

## How it works

It runs at specific intervals of time that you can set. It takes the last time interval's data from `requests_raw`, computes counts/latency/percentiles, and dumps them into `aggregated_metrics_hourly`.

## Config

```env
AGGREGATOR_ENABLED=true

# 1h = hourly, 1m = 1min
AGGREGATOR_INTERVAL=1h         

AGGREGATOR_RUN_ON_STARTUP=false
```

Interval syntax: `30m` (30 minutes), `1h` (1 hour), `1d` (1 day)

## Authentication

Aggregator endpoints share the same protection as `/telemetry`:

- Set `API_KEY=<strong-secret>` in `ingestion/.env` (or `.env.production`) to require an `x-api-key` header.
- Leave `API_KEY` blank during local development to skip the header entirely.
- In production, generate per-team ingestion keys via the dashboard (`Settings → API Keys`) or rotate the shared key by updating the env var and redeploying.

## API

Needs same `x-api-key` as in `/telemetry`.

```bash
# check status
curl -H "x-api-key: $KEY" localhost:4000/aggregator/status

# run pending windows
curl -X POST -H "x-api-key: $KEY" localhost:4000/aggregator/run

# backfill a range
curl -X POST localhost:4000/aggregator/run \
  -H "x-api-key: $KEY" \
  -H "content-type: application/json" \
  -d '{"start":"2025-01-01T00:00:00Z","end":"2025-01-02T00:00:00Z"}'
```

## Notes

If it's too slow, add indexes or run more it frequently. It uses `PERCENTILE_CONT()` for percentiles. For more details, see `storage.ts`.
