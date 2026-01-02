'use client';

import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function Documentation() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <nav className="bg-gradient-to-r from-slate-900 to-slate-800 shadow-lg border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-xl font-bold text-white hover:text-blue-300 transition-colors">
                AutoTrace
              </Link>
              <div className="flex flex-wrap space-x-2">
                <Link href="/dashboard"
                  className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 hover:bg-opacity-50 rounded-md transition-all">
                  Dashboard
                </Link>
                <Link href="/api-keys"
                  className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 hover:bg-opacity-50 rounded-md transition-all">
                  API Keys
                </Link>
                <Link href="/team-members"
                  className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 hover:bg-opacity-50 rounded-md transition-all">
                  Team Members
                </Link>
                <Link href="/docs"
                  className="px-3 py-2 text-sm font-medium bg-blue-600 bg-opacity-90 text-white rounded-md hover:bg-opacity-100 transition-all">
                  Documentation
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <>
                  <span className="text-sm text-slate-300">{user.username}</span>
                  <button
                    onClick={logout}
                    className="px-3 py-1.5 text-sm text-slate-300 hover:text-white bg-slate-700 bg-opacity-50 hover:bg-opacity-70 rounded-md transition-all">
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AutoTrace Documentation</h1>
            <p className="text-muted-foreground mt-2">
              How to install and use AutoTrace for monitoring your app
            </p>
          </div>

          <Tabs defaultValue="installation" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="installation">Installation</TabsTrigger>
              <TabsTrigger value="usage">Usage</TabsTrigger>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="examples">Examples</TabsTrigger>
              <TabsTrigger value="resilience">Resilience</TabsTrigger>
            </TabsList>

            {/* Installation Tab */}
            <TabsContent value="installation" className="space-y-4">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Step 1: Create an Account</h2>
                <p className="text-muted-foreground mb-4">
                  First thing: you need an account and an API key.
                </p>
                <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
                  <li>
                    <Link href="/register" className="text-blue-600 hover:underline font-medium">
                      Register
                    </Link> (or <Link href="/login" className="text-blue-600 hover:underline font-medium">login</Link> if you have an account already)
                  </li>
                  <li>Go to <Link href="/api-keys" className="text-blue-600 hover:underline font-medium">API Keys</Link></li>
                  <li>Create a new API key and give it a name</li>
                  <li>Copy the key (starts with <code className="bg-slate-100 px-1 py-0.5 rounded text-sm">at_live_</code>)</li>
                  <li className="text-amber-600 font-medium">Save this somewhere. You can't see it again after closing the page</li>
                </ol>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Step 2: Install the AutoTrace Client SDK</h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">NPM</h3>
                    <pre className="bg-slate-900 text-slate-50 p-4 rounded-md overflow-x-auto">
                      <code>npm install autotrace</code>
                    </pre>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Yarn</h3>
                    <pre className="bg-slate-900 text-slate-50 p-4 rounded-md overflow-x-auto">
                      <code>yarn add autotrace</code>
                    </pre>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">PNPM</h3>
                    <pre className="bg-slate-900 text-slate-50 p-4 rounded-md overflow-x-auto">
                      <code>pnpm add autotrace</code>
                    </pre>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">What You'll Need</h2>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Node.js version 16 or newer</li>
                  <li>Express.js 4.x or newer</li>
                  <li>TypeScript 4.5 or newer (optional, but recommended for better type checking)</li>
                </ul>
              </Card>
            </TabsContent>

            {/* Usage Tab */}
            <TabsContent value="usage" className="space-y-4">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Basic Setup</h2>
                <p className="text-muted-foreground mb-4">
                  Add the middleware to your Express app before your routes:
                </p>
                <pre className="bg-slate-900 text-slate-50 p-4 rounded-md overflow-x-auto">
                  <code>{`import express from 'express';
import { createAutoTraceMiddleware } from 'autotrace';

const app = express();

// Add AutoTrace middleware (before your routes)
app.use(createAutoTraceMiddleware({
  serviceName: 'my-service',
  ingestionUrl: 'http://localhost:4000',
  apiKey: 'at_live_your_api_key_here',
}));

// Your routes
app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});`}</code>
                </pre>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Configuration Options</h2>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium text-gray-900">serviceName <span className="text-red-500">*</span></p>
                    <p className="text-sm text-muted-foreground">Name for your service in the dashboard</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">ingestionUrl <span className="text-red-500">*</span></p>
                    <p className="text-sm text-muted-foreground">Where the ingestion service is running</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">apiKey</p>
                    <p className="text-sm text-muted-foreground">Your API key (starts with at_live_)</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">batchSize</p>
                    <p className="text-sm text-muted-foreground">Events to collect before sending (default: 100)</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">batchInterval</p>
                    <p className="text-sm text-muted-foreground">Max wait time before sending batch in ms (default: 5000)</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">debug</p>
                    <p className="text-sm text-muted-foreground">Show debug logs in console (default: false)</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">enableLocalBuffer</p>
                    <p className="text-sm text-muted-foreground">Buffer events locally if ingestion is down (default: true)</p>
                  </div>
                </div>
              </Card>


              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Error Handling</h2>
                <p className="text-muted-foreground mb-4">
                  To track errors, add the error handler after your routes:
                </p>
                <pre className="bg-slate-900 text-slate-50 p-4 rounded-md overflow-x-auto">
                  <code>{`import { createAutoTraceMiddleware, createAutoTraceErrorHandler } from 'autotrace';

const config = {
  serviceName: 'my-service',
  ingestionUrl: 'http://localhost:4000',
  apiKey: 'at_live_your_api_key_here',
};

app.use(createAutoTraceMiddleware(config));

// Your routes
app.get('/api/error', (req, res) => {
  throw new Error('Something went wrong!');
});

// Add error handler at the end (after all routes)
app.use(createAutoTraceErrorHandler(config));`}</code>
                </pre>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Viewing Your Data</h2>
                <p className="text-muted-foreground mb-4">
                  That's it. Now check your data:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Start your app and send some test requests</li>
                  <li>Go to the <Link href="/dashboard" className="text-blue-600 hover:underline font-medium">Dashboard</Link> to see telemetry</li>
                  <li>View metrics like request count, error rate, response time</li>
                  <li>Use time range selector for different periods</li>
                  <li>Change aggregation interval to zoom in/out</li>
                </ol>
              </Card>
            </TabsContent>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-4">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Dashboard Overview</h2>
                <p className="text-muted-foreground mb-4">
                  Dashboard shows real-time data about your app with auto-refresh every 30 seconds.
                </p>
                <div className="space-y-3">
                  <p className="font-medium text-gray-900">Features:</p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li><strong>Auto-refresh:</strong> Updates every 30 seconds</li>
                    <li><strong>Manual refresh:</strong> Click refresh for instant update</li>
                    <li><strong>Time range:</strong> 15 minutes to 7 days</li>
                    <li><strong>Intervals:</strong> 15m, 30m, or 1h aggregation</li>
                    <li><strong>Teams:</strong> Switch teams with the selector</li>
                  </ul>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Metrics Displayed</h2>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium text-gray-900">Total Requests</p>
                    <p className="text-sm text-muted-foreground">Total number of HTTP requests received in the selected time range</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Error Rate</p>
                    <p className="text-sm text-muted-foreground">Percentage of requests that resulted in 4xx or 5xx status codes</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Average Latency</p>
                    <p className="text-sm text-muted-foreground">Mean response time across all requests (excludes zero latency requests)</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">P50 Latency (Median)</p>
                    <p className="text-sm text-muted-foreground">50% of requests complete faster than this value</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">P90 Latency</p>
                    <p className="text-sm text-muted-foreground">90% of requests complete faster than this value</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Endpoint Status Thresholds</h2>
                <p className="text-muted-foreground mb-4">
                  Route color codes:
                </p>

                <div className="space-y-4">
                  <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded">
                    <p className="font-semibold text-green-900 mb-2">🟢 HEALTHY</p>
                    <p className="text-sm text-green-800 mb-2">Route looks good</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-green-800 ml-4">
                      <li>Error rate &lt; 1%</li>
                      <li>AND Average latency &lt; 500ms</li>
                    </ul>
                    <p className="text-xs text-green-700 mt-2 italic">Example: 0.5% errors, 200ms latency</p>
                  </div>

                  <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded">
                    <p className="font-semibold text-yellow-900 mb-2">🟡 WARNING</p>
                    <p className="text-sm text-yellow-800 mb-2">Might want to check this</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800 ml-4">
                      <li>Error rate ≥ 1% (but &lt; 5%)</li>
                      <li>OR Average latency ≥ 500ms (but &lt; 1000ms)</li>
                    </ul>
                    <p className="text-xs text-yellow-700 mt-2 italic">Examples: 2% errors + 300ms latency, or 0.2% errors + 600ms latency</p>
                  </div>

                  <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded">
                    <p className="font-semibold text-red-900 mb-2">🔴 CRITICAL</p>
                    <p className="text-sm text-red-800 mb-2">Fix this ASAP</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-red-800 ml-4">
                      <li>Error rate ≥ 5%</li>
                      <li>OR Average latency ≥ 1000ms (1 second)</li>
                    </ul>
                    <p className="text-xs text-red-700 mt-2 italic">Examples: 7% errors + 100ms latency, or 0.5% errors + 1200ms latency</p>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-900">
                    <strong>Note:</strong> Status uses the worst metric. Low errors but high latency still gets marked WARNING/CRITICAL.
                  </p>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Response Time Distribution</h2>
                <p className="text-muted-foreground mb-4">
                  Bar chart showing request speeds:
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between border-b pb-2">
                    <span className="font-medium">0-50ms</span>
                    <span>Very fast</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="font-medium">50-100ms</span>
                    <span>Fast</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="font-medium">100-200ms</span>
                    <span>Normal</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="font-medium">200-500ms</span>
                    <span>Slow</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="font-medium">500ms-1s</span>
                    <span>Very slow</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">1s+</span>
                    <span>Too slow</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Helps you see if most requests are fast or if some are dragging down averages.
                </p>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Top Routes Table</h2>
                <p className="text-muted-foreground mb-4">
                  Shows top 10 busiest endpoints:
                </p>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-gray-900">Route</p>
                    <p className="text-sm text-muted-foreground">The endpoint path (e.g., /api/users, /health)</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Method</p>
                    <p className="text-sm text-muted-foreground">HTTP method with color coding (GET=blue, POST=green, PUT=yellow, DELETE=red)</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Avg Latency</p>
                    <p className="text-sm text-muted-foreground">Average response time for this route</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Requests</p>
                    <p className="text-sm text-muted-foreground">Total number of requests to this route</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Error Rate</p>
                    <p className="text-sm text-muted-foreground">Percentage of requests that returned 4xx or 5xx status codes</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Status</p>
                    <p className="text-sm text-muted-foreground">Health status badge (Healthy/Warning/Critical)</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Interpreting the Charts</h2>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium text-gray-900 mb-2">Latency Over Time Chart</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Shows three lines representing different percentiles:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                      <li><strong className="text-green-600">P50 (Median):</strong> Typical user experience</li>
                      <li><strong className="text-orange-600">P95:</strong> Experience of your slower requests</li>
                      <li><strong className="text-red-600">P99:</strong> Worst-case scenarios (outliers)</li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-2">
                      Spikes in P95/P99 even when P50 is fine means some users are getting slow responses.
                    </p>
                  </div>

                  <div>
                    <p className="font-medium text-gray-900 mb-2">What to Look For</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                      <li>Sudden spikes in latency or error rates</li>
                      <li>Growing trends over time (degrading performance)</li>
                      <li>Routes with high request counts but poor performance</li>
                      <li>Distribution skewed toward slower response times</li>
                      <li>Large gaps between P50 and P99 (inconsistent performance)</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Examples Tab */}
            <TabsContent value="examples" className="space-y-4">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Advanced Sampling Configuration</h2>
                <p className="text-muted-foreground mb-4">
                  Sample requests to reduce telemetry volume:
                </p>
                <pre className="bg-slate-900 text-slate-50 p-4 rounded-md overflow-x-auto">
                  <code>{`import { createAutoTraceMiddleware } from 'autotrace';

app.use(createAutoTraceMiddleware({
  serviceName: 'my-service',
  ingestionUrl: 'http://localhost:4000',
  apiKey: 'at_live_your_api_key_here',

  sampling: {
    // Base sampling rate (10% of requests)
    samplingRate: 0.1,

    // Always sample errors (4xx and 5xx responses)
    alwaysSampleErrors: true,

    // Always sample slow requests (>500ms)
    alwaysSampleSlow: 500,

    // Route-specific sampling rules
    routeRules: [
      { pattern: '/health', rate: 0.01 },      // 1% of health checks
      { pattern: '/api/critical', rate: 1.0 }, // 100% of critical endpoints
    ],

    // Status-code based sampling
    statusRules: [
      { statuses: [500, 502, 503], rate: 1.0 }, // All server errors
      { min: 200, max: 299, rate: 0.05 },       // 5% of successful requests
    ],
  }
}));`}</code>
                </pre>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Retry Configuration</h2>
                <p className="text-muted-foreground mb-4">
                  Set up retries for when telemetry delivery fails:
                </p>
                <pre className="bg-slate-900 text-slate-50 p-4 rounded-md overflow-x-auto">
                  <code>{`app.use(createAutoTraceMiddleware({
  serviceName: 'my-service',
  ingestionUrl: 'http://localhost:4000',
  apiKey: 'at_live_your_api_key_here',

  // HTTP sender retry options
  retryOptions: {
    maxRetries: 3,           // Retry up to 3 times
    baseDelayMs: 1000,       // Start with 1 second delay
    maxDelayMs: 10000,       // Max delay of 10 seconds
    jitterMs: 200,           // Add random jitter
  },

  // Batch flush retry options
  batchRetryOptions: {
    maxRetries: 5,           // Retry batch flush 5 times
    delayMs: 2000,           // Wait 2 seconds between retries
  },

  enableLocalBuffer: true,   // Buffer events if ingestion is down
}));`}</code>
                </pre>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Batch Performance Tuning</h2>
                <p className="text-muted-foreground mb-4">
                  Adjust batch settings based on your traffic:
                </p>
                <pre className="bg-slate-900 text-slate-50 p-4 rounded-md overflow-x-auto">
                  <code>{`// High-traffic service (1000+ req/min)
app.use(createAutoTraceMiddleware({
  serviceName: 'high-traffic-api',
  ingestionUrl: 'http://localhost:4000',
  apiKey: 'at_live_your_api_key_here',
  batchSize: 500,          // Larger batches
  batchInterval: 2000,     // Flush every 2 seconds
}));

// Low-traffic service (<100 req/min)
app.use(createAutoTraceMiddleware({
  serviceName: 'low-traffic-api',
  ingestionUrl: 'http://localhost:4000',
  apiKey: 'at_live_your_api_key_here',
  batchSize: 50,           // Smaller batches
  batchInterval: 10000,    // Flush every 10 seconds
}));`}</code>
                </pre>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Environment Configuration</h2>
                <p className="text-muted-foreground mb-4">
                  Using env vars for config:
                </p>
                <pre className="bg-slate-900 text-slate-50 p-4 rounded-md overflow-x-auto">
                  <code>{`// .env file
AUTOTRACE_API_KEY=at_live_your_api_key_here
AUTOTRACE_SERVICE_NAME=my-service
AUTOTRACE_INGESTION_URL=https://autotrace.yourdomain.com
AUTOTRACE_BATCH_SIZE=100
AUTOTRACE_BATCH_INTERVAL=5000
AUTOTRACE_SAMPLING_RATE=1.0

// In your application
import { createAutoTraceMiddleware } from 'autotrace';

app.use(createAutoTraceMiddleware({
  apiKey: process.env.AUTOTRACE_API_KEY,
  serviceName: process.env.AUTOTRACE_SERVICE_NAME,
  ingestionUrl: process.env.AUTOTRACE_INGESTION_URL,
  batchSize: parseInt(process.env.AUTOTRACE_BATCH_SIZE || '100'),
  batchInterval: parseInt(process.env.AUTOTRACE_BATCH_INTERVAL || '5000'),
  sampling: {
    samplingRate: parseFloat(process.env.AUTOTRACE_SAMPLING_RATE || '1.0'),
  },
}));`}</code>
                </pre>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Dashboard Aggregation</h2>
                <p className="text-muted-foreground mb-4">
                  The AutoTrace backend automatically pre-computes metrics for fast dashboard queries:
                </p>
                <div className="space-y-3 text-muted-foreground">
                  <p className="font-medium text-gray-900">How Aggregation Works:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Raw telemetry events are stored in the database</li>
                    <li>Background aggregator computes hourly rollups (counts, latencies, percentiles)</li>
                    <li>Dashboard queries use pre-computed aggregates for instant loading</li>
                    <li>Aggregation runs automatically at configurable intervals</li>
                  </ul>
                  <p className="font-medium text-gray-900 mt-4">Aggregation Intervals:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>15 min / 30 min / 1 hour</strong> for chart granularity</li>
                    <li>Shorter intervals = more detail, longer query times</li>
                    <li>Longer intervals = smoother charts, faster queries</li>
                  </ul>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Production Best Practices</h2>
                <div className="space-y-3 text-muted-foreground">
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Use env vars for API keys and config</li>
                    <li>Sample high-traffic endpoints (health checks, static assets)</li>
                    <li>Always sample errors with <code className="bg-slate-100 px-1 py-0.5 rounded text-sm">alwaysSampleErrors: true</code></li>
                    <li>Adjust batch size based on traffic</li>
                    <li>Enable local buffering to avoid data loss if ingestion goes down</li>
                    <li>Use HTTPS for ingestion URL in prod</li>
                    <li>Check dashboard regularly</li>
                    <li>Set retry limits so you don't overwhelm ingestion</li>
                  </ul>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="resilience" className="space-y-4">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Persistent Queue Configuration</h2>
                <p className="text-muted-foreground mb-4">
                  AutoTrace SDK can keep telemetry safe on disk whenever networks or deploys interrupt delivery. Enable it via <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">persistentQueue</code>.
                </p>
                <pre className="bg-slate-900 text-slate-50 p-4 rounded-md overflow-x-auto">
                  <code>{`import { createAutoTraceMiddleware } from 'autotrace';

app.use(createAutoTraceMiddleware({
  serviceName: 'checkout-api',
  ingestionUrl: process.env.AUTOTRACE_URL,
  apiKey: process.env.AUTOTRACE_KEY,
  persistentQueue: {
    enabled: true,
    queueDir: './.autotrace-queue',
    maxQueueSize: 10000,     // trims oldest entries past this cap
    persistInterval: 1000,   // ms between disk flushes
    autoFlushOnExit: true    // drain buffer during shutdown
  }
}));`}</code>
                </pre>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <p>Runtime behavior:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Events are appended to JSONL files per process ID.</li>
                    <li>Oldest entries are dropped once <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">maxQueueSize</code> is reached.</li>
                    <li>The queue replays automatically once ingestion responds again.</li>
                    <li>Set <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">autoFlushOnExit</code> to false if you manage shutdown yourself.</li>
                  </ul>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Additional Resources */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Additional Resources</h2>
            <div className="space-y-2">
              <Link href="/dashboard" className="block text-blue-600 hover:underline">
                → View Dashboard
              </Link>
              <Link href="/api-keys" className="block text-blue-600 hover:underline">
                → Manage API Keys
              </Link>
              <Link href="/team-members" className="block text-blue-600 hover:underline">
                → Team Management
              </Link>
              <a href="https://github.com/WesleyZeng206/AutoTrace" target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline">
                → GitHub Repository
              </a>
              <a href="https://github.com/WesleyZeng206/AutoTrace/issues" target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline">
                → Report an Issue
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
