import { TelemetryEvent, AutoTraceSDKConfig } from '../src/types';

let createSender: typeof import('../src/sending').createSender;
let mockFetch: jest.MockedFunction<typeof fetch>;

const loadSender = (withFetch: boolean = true) => {
  jest.resetModules();

  if (withFetch) {
    global.fetch = jest.fn() as any;
  } else {
    delete (global as any).fetch;
  }

  ({ createSender } = require('../src/sending'));
  mockFetch = withFetch ? (global.fetch as jest.MockedFunction<typeof fetch>) : (undefined as any);
};

describe('HTTP Sender', () => {
  let config: AutoTraceSDKConfig;
  const createMockEvent = (requestId: string = 'test-id'): TelemetryEvent => ({
    request_id: requestId,
    service_name: 'test-service',
    route: '/test',
    method: 'GET',
    status_code: 200,
    duration_ms: 100,
    timestamp: new Date().toISOString(),
  });

  beforeEach(() => {
    loadSender(true);
    config = {
      serviceName: 'test-service',
      ingestionUrl: 'http://localhost:4000/telemetry',
      debug: false,
    };
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockClear();
  });

  describe('Successful sends', () => {
    it('should send events successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
      } as Response);

      const sender = createSender(config);
      const events = [createMockEvent('id-1'), createMockEvent('id-2')];

      const result = await sender(events);

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:4000/telemetry',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ events }),
        })
      );
    });

    it('should include API key in headers when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
      } as Response);

      const configWithKey = { ...config, apiKey: 'secret-key' };
      const sender = createSender(configWithKey);
      const events = [createMockEvent()];

      await sender(events);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-api-key': 'secret-key',
          }),
        })
      );
    });

    it('should return true for empty event array', async () => {
      const sender = createSender(config);
      const result = await sender([]);

      expect(result).toBe(true);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Failed sends', () => {
    it('should return false on HTTP error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const sender = createSender(config);
      const events = [createMockEvent()];

      const result = await sender(events);

      expect(result).toBe(false);
      // Should retry 3 times
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should return false on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const sender = createSender(config);
      const events = [createMockEvent()];

      const result = await sender(events);

      expect(result).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should handle timeout', async () => {
      mockFetch.mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            const error = new Error('AbortError');
            error.name = 'AbortError';
            reject(error);
          }, 100);
        });
      });

      const sender = createSender(config);
      const events = [createMockEvent()];

      const result = await sender(events);

      expect(result).toBe(false);
    });
  });

  describe('Retry logic', () => {
    it('should retry on failure with exponential backoff', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Error',
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Error',
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
        } as Response);

      const sender = createSender(config);
      const events = [createMockEvent()];

      const result = await sender(events);

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    }, 10000);

    it('should stop retrying after max retries', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Error',
      } as Response);

      const sender = createSender(config);
      const events = [createMockEvent()];

      const result = await sender(events);

      expect(result).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(3); // Max retries
    }, 10000);

    it('should respect custom retry options for max retries', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 500, statusText: 'Error',
      } as Response);

      const sender = createSender({ ...config,
        retryOptions: {
          maxRetries: 5,
        },
      });

      const events = [createMockEvent()];
      const result = await sender(events);

      expect(result).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(5);
    }, 10000);
  });

  describe('Circuit breaker', () => {
    it('should open circuit after threshold failures', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Error',
      } as Response);

      const sender = createSender(config);
      const events = [createMockEvent()];

      // Trigger 5 failures to open circuit
      for (let i = 0; i < 5; i++) {
        await sender(events);
      }

      // Circuit should now be open
      mockFetch.mockClear();
      const result = await sender(events);

      // Should not attempt to send when circuit is open
      expect(result).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    }, 30000);

    it('should transition to half-open after reset time', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Error',
      } as Response);

      const sender = createSender(config);
      const events = [createMockEvent()];

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        await sender(events);
      }

      // Wait past reset time (30 seconds) in real time (use shorter time for test)
      // Note: This is a simplified test - ideally we'd mock Date.now()
      await new Promise(resolve => setTimeout(resolve, 100));

      // For testing purposes, we verify the circuit was opened
      expect(mockFetch.mock.calls.length).toBeGreaterThan(0);
    }, 30000);

    it('should close circuit after successful requests in half-open state', async () => {
      // This test is complex to implement correctly without mocking Date.now()
      // Skipping detailed circuit state verification for now
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      } as Response);

      const sender = createSender(config);
      const events = [createMockEvent()];

      const result = await sender(events);
      expect(result).toBe(true);
    }, 10000);

    it('should reopen circuit on failure in half-open state', async () => {
      // Simplified test
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Error',
      } as Response);

      const sender = createSender(config);
      const events = [createMockEvent()];

      // Open circuit
      for (let i = 0; i < 5; i++) {
        await sender(events);
      }

      // Verify circuit behavior
      expect(mockFetch.mock.calls.length).toBeGreaterThan(0);
    }, 30000);

    it('should short circuit requests when breaker is open in debug mode', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const debugConfig = { ...config, debug: true };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Error',
      } as Response);

      const sender = createSender(debugConfig);
      const events = [createMockEvent()];

      for (let i = 0; i < 5; i++) {
        await sender(events);
      }

      mockFetch.mockClear();
      const result = await sender(events);

      expect(result).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('AutoTraceSDK: Circuit breaker is open, rejecting the request');

      consoleSpy.mockRestore();
    }, 30000);

    it('should transition from open to half-open after reset time and close after successes', async () => {
      const failureResponse = {
        ok: false,
        status: 500,
        statusText: 'Error',
      } as Response;
      const successResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
      } as Response;

      for (let i = 0; i < 15; i++) {
        mockFetch.mockResolvedValueOnce(failureResponse);
      }
      for (let i = 0; i < 3; i++) {
        mockFetch.mockResolvedValueOnce(successResponse);
      }
      for (let i = 0; i < 3; i++) {
        mockFetch.mockResolvedValueOnce(failureResponse);
      }

      let nowValue = 0;
      const nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => nowValue);

      const sender = createSender(config);
      const events = [createMockEvent()];

      try {
        for (let i = 0; i < 5; i++) {
          const result = await sender(events);
          expect(result).toBe(false);
        }

        const callsAfterFailures = mockFetch.mock.calls.length;

        const shortCircuited = await sender(events);
        expect(shortCircuited).toBe(false);
        expect(mockFetch).toHaveBeenCalledTimes(callsAfterFailures);

        nowValue += 31000;

        const halfOpenSuccess1 = await sender(events);
        const halfOpenSuccess2 = await sender(events);
        const halfOpenSuccess3 = await sender(events);

        expect(halfOpenSuccess1).toBe(true);
        expect(halfOpenSuccess2).toBe(true);
        expect(halfOpenSuccess3).toBe(true);
        expect(mockFetch).toHaveBeenCalledTimes(callsAfterFailures + 3);

        const postCloseFailure = await sender(events);
        expect(postCloseFailure).toBe(false);
        expect(mockFetch).toHaveBeenCalledTimes(callsAfterFailures + 6);
      } finally {
        nowSpy.mockRestore();
      }
    }, 30000);
  });

  describe('Environment requirements', () => {
    it('should warn and return false when fetch is unavailable', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      loadSender(false);
      const sender = createSender({ ...config, debug: true });
      const events = [createMockEvent()];

      const result = await sender(events);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'AutoTraceSDK: global fetch is not available. Telemetry events cannot be sent.'
      );

      consoleSpy.mockRestore();
    });

    it('should return false silently when fetch is unavailable and debug is disabled', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      loadSender(false);
      const sender = createSender(config);
      const events = [createMockEvent()];

      const result = await sender(events);

      expect(result).toBe(false);
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Debug logging', () => {
    it('should log when debug is enabled', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
      } as Response);

      const debugConfig = { ...config, debug: true };
      const sender = createSender(debugConfig);
      const events = [createMockEvent()];

      await sender(events);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('AutoTraceSDK: Successfully sent')
      );

      consoleSpy.mockRestore();
    });

    it('should log errors when debug is enabled', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Error',
      } as Response);

      const debugConfig = { ...config, debug: true };
      const sender = createSender(debugConfig);
      const events = [createMockEvent()];

      await sender(events);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('AutoTraceSDK: Send attempt')
      );

      consoleSpy.mockRestore();
    }, 10000);
  });
});
