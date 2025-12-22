import type { TelemetryEvent } from '@autotrace/telemetry';

type TelemetryRecord = Partial<TelemetryEvent> & Record<string, unknown>;

export function validateEvent(event: unknown): string[] {
  if (!isObject(event)) return ['Invalid event payload: expected object'];

  const errors: string[] = [];
  const telemetry = event as TelemetryRecord;

  if (!isValidUuid(telemetry.request_id)) {
    errors.push('Missing or invalid field: request_id');
  }

  if (!isNonEmptyString(telemetry.service_name)) {
    errors.push('Missing or invalid field: service_name (must be non-empty string)');
  }

  if (!isNonEmptyString(telemetry.route)) {
    errors.push('Missing or invalid field: route (must be non-empty string)');
  }

  if (!isNonEmptyString(telemetry.method)) {
    errors.push('Missing or invalid field: method (must be non-empty string)');
  }

  if (!isStatusCode(telemetry.status_code)) {
    errors.push('Missing or invalid field: status_code (must be 100-599)');
  }

  if (!isDuration(telemetry.duration_ms)) {
    errors.push('Missing or invalid field: duration_ms (must be non-negative number)');
  }

  if (!isIsoTimestamp(telemetry.timestamp)) {
    errors.push('Missing or invalid field: timestamp (must be ISO-8601 string)');
  }

  if (telemetry.error_type !== undefined && typeof telemetry.error_type !== 'string') {
    errors.push('Invalid field: error_type (must be string)');
  }

  if (telemetry.error_message !== undefined && typeof telemetry.error_message !== 'string') {
    errors.push('Invalid field: error_message (must be string)');
  }

  if (telemetry.metadata !== undefined) {
    if (!isObject(telemetry.metadata)) {
      errors.push('Invalid field: metadata (must be object)');
    } else if (!isSerializable(telemetry.metadata)) {
      errors.push('Invalid field: metadata (must be JSON serializable)');
    }
  }

  return errors;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isValidUuid = (value: unknown): value is string =>
  typeof value === 'string' && UUID_REGEX.test(value);

const isIsoTimestamp = (value: unknown): value is string =>
  typeof value === 'string' && !Number.isNaN(new Date(value).getTime());

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isStatusCode = (value: unknown): value is number =>
  typeof value === 'number' && value >= 100 && value <= 599;

const isDuration = (value: unknown): value is number =>
  typeof value === 'number' && value >= 0;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isSerializable = (value: unknown): boolean => {
  try {
    JSON.stringify(value);
    return true;
  } catch {
    return false;
  }
};
