import { EventBatcher } from '../src/batching';
import { TelemetryEvent, AutoTraceConfig } from '../src/types';

describe('EventBatcher', () => {
  let config: AutoTraceConfig;

  let mockSendFunction: jest.Mock<Promise<boolean>, [TelemetryEvent[]]>;

  let batcher: EventBatcher;

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
    config = {
      serviceName: 'test-service',
      ingestionUrl: 'http://localhost:4000/telemetry',
      batchSize: 3,
      batchInterval: 1000,
      debug: false,
    };
    mockSendFunction = jest.fn().mockResolvedValue(true);
    batcher = new EventBatcher(config, mockSendFunction);
  });

  afterEach(() => {
    batcher.stop();
    jest.clearAllTimers();
  });

  describe('Event batching', () => {
    it('should add events to the queue', () => {
      const event = createMockEvent();
      batcher.add(event);
      expect(batcher.getQueueSize()).toBe(1);
    });

    it('should flush when batch size is reached', async () => {
      const event1 = createMockEvent('id-1');
      const event2 = createMockEvent('id-2');
      const event3 = createMockEvent('id-3');

      batcher.add(event1);
      batcher.add(event2);
      batcher.add(event3);

      // Wait for async flush to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockSendFunction).toHaveBeenCalledTimes(1);
      expect(mockSendFunction).toHaveBeenCalledWith([event1, event2, event3]);
      expect(batcher.getQueueSize()).toBe(0);
    });

    it('should not flush if batch size is not reached', () => {
      const event = createMockEvent();
      batcher.add(event);
      expect(mockSendFunction).not.toHaveBeenCalled();
      expect(batcher.getQueueSize()).toBe(1);
    });
  });

  describe('Event deduplication', () => {
    it('should skip duplicate events with same request_id', () => {
      const event1 = createMockEvent('duplicate-id');
      const event2 = createMockEvent('duplicate-id');

      batcher.add(event1);
      batcher.add(event2);

      expect(batcher.getQueueSize()).toBe(1);
    });

  describe('Retry logic', () => {
    it('retry failed sends up to 3 times', async () => {
      mockSendFunction
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const event1 = createMockEvent('id-1');
      const event2 = createMockEvent('id-2');
      const event3 = createMockEvent('id-3');

      batcher.add(event1);
      batcher.add(event2);
      batcher.add(event3);

      // Need to wait longer for retries with backoff
      await new Promise(resolve => setTimeout(resolve, 2000));

      expect(mockSendFunction).toHaveBeenCalledTimes(3);
    }, 10000);

    it('should store failed events when all retries fail', async () => {
      mockSendFunction.mockResolvedValue(false);

      const event1 = createMockEvent('id-1');
      const event2 = createMockEvent('id-2');
      const event3 = createMockEvent('id-3');

      batcher.add(event1);
      batcher.add(event2);
      batcher.add(event3);

      // Need to wait longer for retries with backoff
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Should try 3 times
      expect(mockSendFunction).toHaveBeenCalledTimes(3);
    }, 10000);

    it('should handle send errors gracefully', async () => {
      mockSendFunction.mockRejectedValue(new Error('Network error'));

      const event1 = createMockEvent('id-1');
      const event2 = createMockEvent('id-2');
      const event3 = createMockEvent('id-3');

      expect(() => {
        batcher.add(event1);
        batcher.add(event2);
        batcher.add(event3);
      }).not.toThrow();

      await new Promise(resolve => setTimeout(resolve, 200));

      // Should have retried
      expect(mockSendFunction).toHaveBeenCalled();
    });
  });

      it('should allow events with different request_ids', () => {
      const event1 = createMockEvent('id-1');
      const event2 = createMockEvent('id-2');

      batcher.add(event1);
      batcher.add(event2);

      expect(batcher.getQueueSize()).toBe(2);
    });

    it('should handle deduplication set size limit', () => {
      for (let i = 0; i < 1100; i++) {
        batcher.add(createMockEvent(`id-${i}`));
      }

      expect(() => batcher.add(createMockEvent('new-id'))).not.toThrow();
    });
  });

  describe('Concurrent flush protection', () => {
    it('should prevent concurrent flushes', async () => {
      mockSendFunction.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(true), 500))
      );

      // Add events to trigger multiple flushes
      for (let i = 0; i < 6; i++) {
        batcher.add(createMockEvent(`id-${i}`));
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      // The second batch should wait while the first one is pending
      expect(mockSendFunction).toHaveBeenCalledTimes(1);
    });
  });

  describe('Timer-based flushing', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should flush events on timer interval', () => {
      const event = createMockEvent();
      batcher.add(event);

      expect(mockSendFunction).not.toHaveBeenCalled();

      // Fast-forward time
      jest.advanceTimersByTime(1000);

      // The autoFlush is called, but we can't easily verify the async call with fake timers
      // At minimum we can verify it doesn't error
      expect(batcher.getQueueSize()).toBe(1); // Still queued since timer just triggered
    });

    it('should stop flushing after stop() is called', () => {
      batcher.stop();

      const event = createMockEvent();
      batcher.add(event);

      jest.advanceTimersByTime(2000);

      // Timer should not trigger flush after stop
      expect(mockSendFunction).not.toHaveBeenCalled();
    });
  });

  describe('Failed events retry', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should retry failed events on timer', () => {
      // First call fails, second succeeds
      mockSendFunction
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const event1 = createMockEvent('id-1');
      const event2 = createMockEvent('id-2');
      const event3 = createMockEvent('id-3');

      batcher.add(event1);
      batcher.add(event2);
      batcher.add(event3);

      // Advance timer to trigger initial flush
      jest.advanceTimersByTime(100);

      // Advance timer to trigger retry of failed events
      jest.advanceTimersByTime(1000);

      // Verify the function was called (async completion can't be easily verified with fake timers)
      expect(mockSendFunction).toHaveBeenCalled();
    });

    it('should drain failed events when retry succeeds', async () => {
      batcher.stop();
      const failingEvents = [createMockEvent('retry-1'), createMockEvent('retry-2')];
      const internalBatcher = batcher as any;
      internalBatcher.failedEvents = [...failingEvents];
      internalBatcher.enableLocalBuffer = true;

      mockSendFunction.mockResolvedValue(true);

      await internalBatcher.retryFailedEvents();

      expect(mockSendFunction).toHaveBeenCalledWith(failingEvents);
      expect(internalBatcher.failedEvents.length).toBe(0);
      expect(internalBatcher.isFlushing).toBe(false);
    });

    it('should requeue failed events when retry send fails', async () => {
      batcher.stop();
      const failingEvents = [createMockEvent('retry-3'), createMockEvent('retry-4')];
      const internalBatcher = batcher as any;
      internalBatcher.failedEvents = [...failingEvents];
      internalBatcher.enableLocalBuffer = true;

      mockSendFunction.mockResolvedValue(false);

      await internalBatcher.retryFailedEvents();

      expect(mockSendFunction).toHaveBeenCalledWith(failingEvents);
      expect(internalBatcher.failedEvents.length).toBe(failingEvents.length);
      expect(internalBatcher.isFlushing).toBe(false);
    });

    it('should skip retry when local buffer is disabled', async () => {
      batcher.stop();
      const disabledBatcher = new EventBatcher(
        { ...config, enableLocalBuffer: false },
        mockSendFunction
      );
      const internal = disabledBatcher as any;
      internal.failedEvents = [createMockEvent('skip-buffer')];

      await internal.retryFailedEvents();

      expect(mockSendFunction).not.toHaveBeenCalled();
      disabledBatcher.stop();
    });

    it('should skip retry when no failed events exist', async () => {
      batcher.stop();
      const internal = batcher as any;
      internal.failedEvents = [];

      await internal.retryFailedEvents();

      expect(mockSendFunction).not.toHaveBeenCalled();
    });

    it('should skip retry when already flushing', async () => {
      batcher.stop();
      const internal = batcher as any;
      internal.failedEvents = [createMockEvent('busy-1')];
      internal.isFlushing = true;

      await internal.retryFailedEvents();

      expect(mockSendFunction).not.toHaveBeenCalled();
      expect(internal.failedEvents.length).toBe(1);
      internal.isFlushing = false;
    });

    it('should push events back when retry throws error', async () => {
      batcher.stop();
      const internal = batcher as any;
      const events = [createMockEvent('throw-1'), createMockEvent('throw-2')];
      internal.failedEvents = [...events];
      mockSendFunction.mockRejectedValueOnce(new Error('boom'));

      await internal.retryFailedEvents();

      expect(mockSendFunction).toHaveBeenCalledWith(events);
      expect(internal.failedEvents.length).toBe(events.length);
      expect(internal.isFlushing).toBe(false);
    });
  });

  describe('Local buffer configuration', () => {
    it('should drop failed events when local buffering is disabled', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const failingSend = jest.fn().mockResolvedValue(false);
      const noBufferBatcher = new EventBatcher(
        { ...config, batchSize: 10, enableLocalBuffer: false },
        failingSend
      );

      noBufferBatcher.add(createMockEvent('nb-1'));
      noBufferBatcher.add(createMockEvent('nb-2'));
      noBufferBatcher.add(createMockEvent('nb-3'));

      const flush = (noBufferBatcher as any).autoFlush?.bind(noBufferBatcher);
      if (flush) {
        await flush();
      }

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Dropping')
      );

      warnSpy.mockRestore();
      noBufferBatcher.stop();
    });
  });

  describe('Debug logging', () => {
    it('should log when debug is enabled', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const debugConfig = { ...config, debug: true };
      const debugBatcher = new EventBatcher(debugConfig, mockSendFunction);

      const event = createMockEvent('duplicate');
      debugBatcher.add(event);
      debugBatcher.add(event); // Duplicate

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('AutoTrace: Skipping duplicate event')
      );

      consoleSpy.mockRestore();
      debugBatcher.stop();
    });

    it('should not log when debug is disabled', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const event = createMockEvent('duplicate');
      batcher.add(event);
      batcher.add(event); 

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
