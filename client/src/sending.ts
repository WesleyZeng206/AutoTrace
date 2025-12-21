
import { TelemetryEvent, AutoTraceConfig } from './types';

type FetchFn = (input: string, init?: any) => Promise<Response>;

// Works with older versions of Node that don't have [fetch]
const runtimeFetch: FetchFn | undefined = typeof (globalThis as any).fetch === 'function'
  ? ((globalThis as any).fetch as FetchFn).bind(globalThis) : undefined;

// Possible circuit breaker states
type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

// Default configuration values
const TIMEOUT_MS = 5000;
const MAX_RETRIES = 3;
const CIRCUIT_THRESHOLD = 5;  
const CIRCUIT_RESET_MS = 30000;  
const BASE_DELAY_MS = 100;
const MAX_DELAY_MS = 5000;
const JITTER_MS = 100;

/**
 * Result of a send operation
 */
interface SendResult {
  success: boolean;
  statusCode?: number;
  eventsAccepted?: number;
  error?: string;
}

/**
 * Circuit breaker state
 */
interface CircuitBreakerState {
  state: CircuitState;
  failureCount: number;
  lastFailureTime: number | null;
  successCount: number;
}

/**
 * Creates a sender function that can be passed to the EventBatcher
 * Sender function returns a promise of a boolean
 */
export function createSender(config: AutoTraceConfig): (events: TelemetryEvent[]) => Promise<boolean> {
  let circuitState = createInitialCircuitState();
  const circuitThreshold = CIRCUIT_THRESHOLD;
  const circuitResetMs = CIRCUIT_RESET_MS;
  const timeoutMs = TIMEOUT_MS;
  const retryOptions = config.retryOptions || {};
  const maxRetries = sanitizePositiveNumber(retryOptions.maxRetries, MAX_RETRIES);
  const baseDelayMs = sanitizePositiveNumber(retryOptions.baseDelayMs, BASE_DELAY_MS);
  const maxDelayMs = sanitizePositiveNumber(retryOptions.maxDelayMs, MAX_DELAY_MS);
  const jitterMs = sanitizeNonNegativeNumber(retryOptions.jitterMs, JITTER_MS);

  if (!runtimeFetch && config.debug) {
    console.warn('AutoTrace: global fetch is not available. Telemetry events cannot be sent.');
  }

  return async (events: TelemetryEvent[]): Promise<boolean> => {
    if (events.length === 0) {
      return true;
    }

    if (!runtimeFetch) {
      return false;
    }

    if (!shouldAllowRequest(circuitState, circuitResetMs)) {
      if (config.debug) {
        console.log('AutoTrace: Circuit breaker is open, rejecting the request');
      }
      return false;
    }

    if (circuitState.state === 'OPEN') {
      circuitState = { ...circuitState, state: 'HALF_OPEN', successCount: 0 };
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const result = await sendHttpRequest(config.ingestionUrl, events, config.apiKey, timeoutMs, runtimeFetch);

      if (result.success) {
        circuitState = updateCircuitState(circuitState, true, circuitThreshold);
        if (config.debug) {
          console.log(`AutoTrace: Successfully sent ${events.length} events`);
        }
        return true;
      }

      if (config.debug) {
        console.log(`AutoTrace: Send attempt ${attempt}/${maxRetries} failed: ${result.error}`);
      }

      if (attempt < maxRetries) {
        const delay = calculateBackoffDelay(attempt, baseDelayMs, maxDelayMs, jitterMs);
        await sleep(delay);
      }
    }

    circuitState = updateCircuitState(circuitState, false, circuitThreshold);
    return false;
  };
}

async function sendHttpRequest(
  url: string,
  events: TelemetryEvent[],
  apiKey: string | undefined,
  timeoutMs: number = TIMEOUT_MS,
  fetchFn: FetchFn | undefined): Promise<SendResult> {
  if (!fetchFn) {
    return { success: false, error: 'fetch_not_available' };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }

    const response = await fetchFn(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ events }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return {
        success: true,
        statusCode: response.status,
        eventsAccepted: events.length,
      };
    }

    return {
      success: false,
      statusCode: response.status,
      error: `HTTP ${response.status}: ${response.statusText}`,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { success: false, error: 'Request timeout' };
      }
      return { success: false, error: error.message };
    }

    return { success: false, error: 'UnknownError' };
  }
}

function shouldAllowRequest(
  state: CircuitBreakerState,
  resetMs: number = CIRCUIT_RESET_MS
): boolean {
  if (state.state === 'CLOSED') {
    return true;
  }

  if (state.state === 'OPEN') {
    if (state.lastFailureTime === null) {
      return true;
    }
    const timeSinceFailure = Date.now() - state.lastFailureTime;
    return timeSinceFailure >= resetMs;
  }

  if (state.state === 'HALF_OPEN') {
    return state.successCount < 3;
  }

  return true;
}

function updateCircuitState(
  state: CircuitBreakerState,
  success: boolean,
  threshold: number = CIRCUIT_THRESHOLD
): CircuitBreakerState {
  if (success === true) {
    if (state.state === 'CLOSED') {
      return { ...state, failureCount: 0 };
    }

    if (state.state === 'HALF_OPEN') {
      const newSuccessCount = state.successCount + 1;
      if (newSuccessCount >= 3) {
        return createInitialCircuitState();
      }
      return { ...state, successCount: newSuccessCount };
    }

    return state;
  }

  if (state.state === 'CLOSED') {
    const newFailureCount = state.failureCount + 1;
    if (newFailureCount >= threshold) {
      return {
        state: 'OPEN',
        failureCount: newFailureCount,
        lastFailureTime: Date.now(),
        successCount: 0,
      };
    }
    return { ...state, failureCount: newFailureCount, lastFailureTime: Date.now() };
  }

  if (state.state === 'HALF_OPEN') {
    return { state: 'OPEN', failureCount: state.failureCount + 1, lastFailureTime: Date.now(), successCount: 0,};
  }

  return { ...state, lastFailureTime: Date.now() };
}

function calculateBackoffDelay(
  attempt: number,
  baseDelayMs: number = BASE_DELAY_MS,
  maxDelayMs: number = MAX_DELAY_MS,
  jitterMs: number = JITTER_MS
): number {
  //Calculations here are conventional; we can tune them later
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
  const cappedDelay = Math.min(exponentialDelay, maxDelayMs);
  const jitter = Math.random() * jitterMs;
  return cappedDelay + jitter;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Default Circuit State creator
 */
function createInitialCircuitState(): CircuitBreakerState {
  return { state: 'CLOSED', failureCount: 0, lastFailureTime: null, successCount: 0};
}

function sanitizePositiveNumber(value: number | undefined, fallback: number): number {
  if (typeof value === 'number' && value > 0) {
    return value;
  }
  return fallback;
}

/*
* For the case of 0
*/
function sanitizeNonNegativeNumber(value: number | undefined, fallback: number): number {
  if (typeof value === 'number' && value >= 0) {
    return value;
  }
  return fallback;
}
