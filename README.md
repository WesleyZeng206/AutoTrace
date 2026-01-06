# AutoTrace

A simple observability platform for tracking HTTP requests across your Node.js applications. All you have to do is drop in the middleware, spin up the backend, and get all the services without the complexity of full APM solutions.

## Summary

- Express middleware that captures request/response telemetry
- Backend service to collect and aggregate metrics
- Dashboard to visualize latency, errors, and anomalies
- Automatic anomaly detection using statistical analysis
- Team-based access control

## Quick start with Docker

**Requirements:** Docker and Docker Compose

1. Clone and start everything:
```bash
git clone https://github.com/WesleyZeng206/AutoTrace.git
cd AutoTrace
docker-compose up -d
```

The tech stack includes PostgreSQL, Redis, the ingestion service with Express.js, and the dashboard powered by Next.js.

2. Open the dashboard at `http://localhost:3000` and create an account.

3. Create an API key from the dashboard.

## Add to your service

Install the client:
```bash
npm install @wesleyzeng206/autotrace
```

Add the middleware to your Express app (example below):
```typescript
import express from 'express';
import { createAutoTraceMiddleware } from '@wesleyzeng206/autotrace';

const app = express();

app.use(createAutoTraceMiddleware({
  serviceName: 'my-service',
  ingestionUrl: 'http://localhost:4000',
  apiKey: 'your-api-key-from-dashboard'
}));

// your routes below
app.get('/users', (request, response) => {
  response.json({ ... });
});

app.listen(5050);
```

Make some requests and check the dashboard. Metrics update in real-time, and aggregations are run hourly.

## The components that running
 npm run build
  npm login
  npm publish
- **Dashboard**: `http://localhost:3000` - Dashboard/Website
- **Ingestion**: `http://localhost:4000` - API for telemetry
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379` - Caching (optional but enabled by default)

## Configuration

The docker-compose file has defaults for local development. For production, check `.env.production.example` and update:

- `SESSION_SECRET` - Change this to something random (32+ chars)
- `ALLOWED_ORIGINS` - Set to your dashboard URL
- `REDIS_ENABLED` - Turn it off if you don't need any caching
- Database credentials

## Development

Run tests:
```bash
cd client && npm test
cd ingestion && npm test
```

Build for production:
```bash
cd client && npm run build
cd ingestion && npm run build
cd dashboard && npm run build
```

## Notes

More documentation is provided in the dashboard frontend.

## License

MIT