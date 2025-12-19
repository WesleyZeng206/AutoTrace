import { Request, Response, NextFunction } from 'express';
import { v4 as generateUUID } from 'uuid';
import { TelemetryEvent, AutoTraceConfig } from './types';
import { createSender } from './sending';
import { EventBatcher } from './batching';


//just stash callbacks so GC can do its thing later
const errorCallbackMap = new WeakMap<Response, (err: Error) => void>();

/**
 * Creates Express middleware that automatically handles all requests
 */
export function createAutoTraceMiddleware(config: AutoTraceConfig) {
  const sender = createSender(config);
  const batcher = new EventBatcher(config, sender);

  return function autoTraceMiddleware(req: Request, res: Response, next: NextFunction) {
    const requestId = generateUUID();
    const startTime = Date.now();

    let caughtError: Error | null = null;
    let hasLogged = false;

    const errorCallback = (err: Error) => {
      if (!caughtError) {
        caughtError = err;
      }
    };
    errorCallbackMap.set(res, errorCallback);

    const logEvent = () => {
      if (hasLogged) {
        return;
      }
      hasLogged = true;

      const duration = Date.now() - startTime;

      const event: TelemetryEvent = {
        request_id: requestId,
        service_name: config.serviceName,
        route: req.route?.path || req.path,
        method: req.method,
        status_code: res.statusCode,
        duration_ms: duration,
        timestamp: new Date().toISOString(),
      };

      if (caughtError) {
        event.error_type = caughtError.name || 'Error';
        event.error_message = caughtError.message || 'Unknown Error';
      } else if (res.locals.errorType && res.locals.errorType !== '') {
        event.error_type = res.locals.errorType;
        event.error_message = res.locals.errorMessage || '';
      } else if (res.statusCode >= 400) {
        event.error_type = 'HTTP_ERROR';
        event.error_message = '';
      }

      batcher.add(event);
      errorCallbackMap.delete(res);
    };

    res.once('finish', logEvent);
    res.once('close', logEvent);

    try {
      next();
    } catch (err) {
      if (err instanceof Error) {
        caughtError = err;
      } else {
        caughtError = new Error(String(err));
      }

      res.locals.errorType = caughtError.name;
      res.locals.errorMessage = caughtError.message;

      next(err);
    }
  };
}

/**
 * Catches errors and makes sure they get logged to telemetry
 */
export function createAutoTraceErrorHandler(config: AutoTraceConfig) {
  return function autoTraceErrorHandler(err: Error, _req: Request, res: Response, next: NextFunction) {
    res.locals.errorType = err.name || 'Error';
    res.locals.errorMessage = err.message || 'Something went wrong';

    const callback = errorCallbackMap.get(res);
    if (callback) {
      callback(err);
    }

    if (config.debug) {
      console.error('AutoTrace caught error:', err);
    }

    next(err);
  };
}
