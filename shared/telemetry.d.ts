declare module '@autotrace/telemetry' {
  export interface TelemetryEvent {
  /** Unique identifier for the request; uses UUID */
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

  /** Request duration in milliseconds */
  duration_ms: number;

  /** Type of error when the request failed */
  error_type?: string;

  /** Human-readable error message */
  error_message?: string;

  /** Additional metadata such as user identifiers, custom fields, etc. */
  metadata?: Record<string, any>;
  }
}
