/**
 * This will represent a single telemetry event captured by the middleware
 */
export interface TelemetryEvent {
  /** The unique identifier for this request; we use UUID here */
  request_id: string;

  /** Name of the service generating this event */
  service_name: string;

  /** HTTP route */
  route: string;

  /** HTTP method */
  method: string;

  /** HTTP response status code */
  status_code: number;

  /** ISO-8601 timestamp of when the request completed */
  timestamp: string;

  /** Request's duration in milliseconds */
  duration_ms: number;

  /** Type of error if the request failed */
  error_type?: string;

  /** OPtional error message for humans to read */
  error_message?: string;

  /** Additional metadata, including user_id, custom fields, etc. */
  metadata?: Record<string, any>;
}

export interface RetryOptions {
  /** Maximum retry attempts for HTTP sender */
  maxRetries?: number;
  /** Base delay for exponential backoff (in milliseconds) */
  baseDelayMs?: number;
  /** Limit for exponential backoff (in milliseconds) */
  maxDelayMs?: number;
  /** Optional jitter value added to each delay */
  jitterMs?: number;
}

export interface BatchRetryOptions {
  /** Maximum retry attempts when flushing queued events */
  maxRetries?: number;
  /** Delay between retry attempts while flushing (in milliseconds) */
  delayMs?: number;
}

/**
 * Configuration options for th instrumentation middleware
 */
export interface AutoTraceConfig {
  /** Name of the service (used to identify in dashboard) */
  serviceName: string;

  /** URL of the AutoTrace ingestion service endpoint */
  ingestionUrl: string;

  /** Optional API key for authentication with the ingestion service */
  apiKey?: string;

  /** Optional number of events to batch before sending */
  batchSize?: number;

  /** Max time in milliseconds to wait before flushing batch */
  batchInterval?: number;

  /** Enable debug logging to console. Default value is false */
  debug?: boolean;

  /** Buffer events locally if ingestion service is down. True by default */
  enableLocalBuffer?: boolean;

  /** Customize retry behavior for the HTTP sender */
  retryOptions?: RetryOptions;

  /** Customize retry behavior for batch flushing */
  batchRetryOptions?: BatchRetryOptions;
}
