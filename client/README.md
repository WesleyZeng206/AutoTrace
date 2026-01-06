# AutoTrace

Lightweight telemetry middleware for Express.js. Automatically captures HTTP request metrics and sends them to your AutoTrace ingestion service.

## Installation

```bash
npm install @wesleyzeng206/autotrace
```

## Quick Start

```typescript
import express from 'express';
import { createAutoTraceMiddleware } from '@wesleyzeng206/autotrace';

const app = express();

app.use(createAutoTraceMiddleware({
  serviceName: 'my-api',
  ingestionUrl: 'http://localhost:4000',
  apiKey: 'your-api-key'
}));

app.get('/users', (req, res) => {
  res.json({ users: [] });
});

app.listen(5000);
```

From now on, every HTTP request will now send telemetry data including route, method, status code, duration, and errors.

## Configuration

```typescript
createAutoTraceMiddleware({
  serviceName: 'my-service',        // Required: identifies your service
  ingestionUrl: 'http://...',       // Required: where to send telemetry
  apiKey: 'your-key',               // Optional: API key for authentication

  // Optional: sampling configuration
  sampling: {
    rate: 1.0,                      // Sample 100% of requests (potential values between: 0.0 - 1.0)
    alwaysSampleErrors: true,       // Always capture errors
    slowRequestThreshold: 1000,     // Capture all requests > 1000ms
    routes: {
      '/health': 0.1,               // Sample only 10% of health checks
      '/api/*': 1.0                 // Sample all API routes
    },
    customSampler: (req, res) => {
      return res.statusCode >= 500; // Custom sampling logic
    }
  },

  // Optional: batching configuration
  batching: {
    maxBatchSize: 10,               // Flush after 10 events
    flushInterval: 5000,            // Or after 5 seconds
    retryOptions: {
      maxRetries: 3,
      baseDelay: 2000,
      maxDelay: 30000
    }
  },

  // Optional: offline persistence
  persistence: {
    enabled: true,
    queuePath: './autotrace-queue', // Where to store offline events
    maxQueueSize: 10000,            // Max events to buffer
    flushInterval: 10000            // How often to retry
  },

  // Optional: debugging
  debug: false                      // Enable console logging
})
```

## Error Handling

Capture errors with the error handler:

```typescript
import { createAutoTraceMiddleware, createAutoTraceErrorHandler } from '@wesleyzeng206/autotrace';

const config = {
  serviceName: 'my-api',
  ingestionUrl: 'http://localhost:4000',
  apiKey: 'your-key'
};

app.use(createAutoTraceMiddleware(config));

// Your routes
app.get('/users', (req, res) => {
  throw new Error('Something went wrong');
});

// Error handler (must be last)
app.use(createAutoTraceErrorHandler(config));
```

## Sampling Examples

**Sample 10% of all requests:**
```typescript
sampling: { rate: 0.1 }
```

**Always capture errors and slow requests:**
```typescript
sampling: {
  rate: 0.1,
  alwaysSampleErrors: true,
  slowRequestThreshold: 1000
}
```

**Different rates per route:**
```typescript
sampling: {
  routes: {
    '/health': 0.01,      // 1% of health checks
    '/api/users': 0.5,    // 50% of user endpoints
    '/api/orders': 1.0    // 100% of orders
  }
}
```

**Custom sampling logic:**
```typescript
sampling: {
  customSampler: (req, res) => {
    // Sample all POST requests
    if (req.method === 'POST') return true;

    // Sample 10% of everything else
    return Math.random() < 0.1;
  }
}
```

## How It Works

1. Middleware intercepts each request
2. Captures metadata when response completes
3. Batches events in memory (default: 10 events or 5 seconds)
4. Sends batch to ingestion service
5. If ingestion fails, saves to disk and retries with exponential backoff
6. Circuit breaker prevents overwhelming your service if ingestion is down

## Offline Mode

When the ingestion service is unavailable, events are automatically saved to disk and retried:

- Queue persists up to 10,000 events by default
- Exponential backoff prevents hammering the ingestion service
- Circuit breaker opens after 5 consecutive failures
- Events are never lost unless disk queue fills up

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  AutoTraceConfig,
  TelemetryEvent,
  PersistentQueueOptions
} from '@wesleyzeng206/autotrace';
```

## Advanced: Manual Queue Management

If you need direct access to the persistent queue:

```typescript
import { PersistentQueue } from '@wesleyzeng206/autotrace';

const queue = new PersistentQueue({
  queuePath: './my-queue',
  maxQueueSize: 5000,
  flushInterval: 10000
});

await queue.enqueue([event1, event2]);
const events = await queue.dequeue(10);
await queue.clear();
```

## Environment Variables

You can configure via environment variables:

```typescript
createAutoTraceMiddleware({
  serviceName: process.env.SERVICE_NAME || 'default-service',
  ingestionUrl: process.env.AUTOTRACE_URL || 'http://localhost:4000',
  apiKey: process.env.AUTOTRACE_API_KEY
})
```

## Troubleshooting

**Events not appearing in dashboard?**
- Check your API key is valid
- Verify `ingestionUrl` is reachable
- Enable `debug: true` to see logs
- Check disk queue size if offline

**High memory usage?**
- Reduce `maxBatchSize`
- Disable persistence if not needed
- Increase sampling rate to capture fewer events

**Performance impact?**
- Batching is asynchronous and won't block requests
- Circuit breaker prevents cascading failures
- Consider sampling high-traffic routes

## License

MIT

## Contributing

Issues and PRs welcome at [https://github.com/WesleyZeng206/AutoTrace](https://github.com/WesleyZeng206/AutoTrace)
