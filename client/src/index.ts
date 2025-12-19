/**
 * Lightweight telemetry middleware for Express.js.
 * Entry point to the package is here.
 */

export { createAutoTraceMiddleware, createAutoTraceErrorHandler } from './middleware';

export type { TelemetryEvent, AutoTraceConfig } from './types';


