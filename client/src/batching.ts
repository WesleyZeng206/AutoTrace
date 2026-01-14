import { TelemetryEvent, AutoTraceSDKConfig } from './types';
import { PersistentQueue } from './persistence';

/**
 * EventBatcher collects events and groups them together
 * 
 * Batching rules:
 * - Flush when we have 10 events 
 * - Flush every 5 seconds 
 * - Retry failed sends 3 times before giving up
 * - Prevents concurrent flushes to avoid race conditions
 * - Deduplicates events based on request_id (keeps last 1000 unique IDs)
 */
export class EventBatcher {
  //Our main queue where events will be added to
  private queue: TelemetryEvent[] = [];

  private flushTimer: NodeJS.Timeout | null = null;
  private config: AutoTraceSDKConfig;
  private batchSize: number;
  private batchInterval: number;
  private enableLocalBuffer: boolean;

  //dependency injection 
  private sendFunction: (events: TelemetryEvent[]) => Promise<boolean>;

  private maxRetries: number = 3;
  private retryDelayMs: number = 500;

  // Concurrent flush protection
  private isFlushing: boolean = false;

  // Event "deduplication" set to keep track of recently processed request ids
  private recentRequestIds: Set<string> = new Set();
  private maxDedupeSize: number = 1000;

  private failedEvents: TelemetryEvent[] = [];
  private maxFailedEvents: number = 500;

  // Persistent queue for offline resilience
  private persistentQueue: PersistentQueue | null = null;
  private consecutiveFailures: number = 0;
  private lastRetryTime: number = 0;

  constructor(
    config: AutoTraceSDKConfig, sendFunction: (events: TelemetryEvent[]) => Promise<boolean>
  ) {
    this.config = config;

    // default to 10 for now, unless someone overrides it somewhere up top
    this.batchSize = config.batchSize || 10;
    
    this.batchInterval = config.batchInterval || 5000;
    this.sendFunction = sendFunction;
    this.enableLocalBuffer = config.enableLocalBuffer !== false;
    const batchRetry = config.batchRetryOptions || {};
    if (typeof batchRetry.maxRetries === 'number' && batchRetry.maxRetries > 0) {
      this.maxRetries = batchRetry.maxRetries;
    }
    if (typeof batchRetry.delayMs === 'number' && batchRetry.delayMs > 0) {
      this.retryDelayMs = batchRetry.delayMs;
    }

    // Initialize persistent queue if enabled
    if (config.persistentQueue?.enabled) {
      this.persistentQueue = new PersistentQueue(
        config.persistentQueue,
        config.debug || false
      );
      this.initializePersistentQueue();
    }

    this.startTimer();
  }

  /**
   * Add an event to the queue
   */
  add(event: TelemetryEvent): void {
    // Deduplication check 
    if (this.recentRequestIds.has(event.request_id)) {
      if (this.config.debug) {
        console.log(`AutoTraceSDK: Skipping duplicate event with request_id: ${event.request_id}`);
      }
      return;
    }

    this.queue.push(event);

    this.recentRequestIds.add(event.request_id);

    // Prevent Set from growing too large 
    if (this.recentRequestIds.size > this.maxDedupeSize) {
      const idsArray = Array.from(this.recentRequestIds);
      this.recentRequestIds = new Set(idsArray.slice(1));
    }

    if (this.queue.length >= this.batchSize) {
      this.autoFlush();
    }
  }

  /**
   * Automatic flush; will try to send events up to 3 times max.
   * Implements concurrent flush protection to prevent race conditions
   */
  private async autoFlush(): Promise<void> {
    if (this.isFlushing) {
      if (this.config.debug) {
        console.log('AutoTraceSDK: Flush operation in progress, skipping');
      }
      return;
    }

    const events = this.getEvents();
    if (events.length === 0) {
      return;
    }

    this.isFlushing = true;

    try {
      let successful = false;

      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          successful = await this.sendFunction(events);

          if (successful) {
            if (this.config.debug) {
              console.log(`AutoTraceSDK: Sent ${events.length} events`);
            }
            break;
          }

          if (attempt < this.maxRetries) {
            if (this.config.debug) {
              console.log(`AutoTraceSDK: Send failed, retrying (${attempt}/${this.maxRetries})`);
            }
            await this.sleep(this.retryDelayMs);
          }
        } catch (error) {
          if (this.config.debug) {
            console.error(`AutoTraceSDK: Send error on attempt ${attempt}:`, error);
          }

          if (attempt < this.maxRetries) {
            await this.sleep(this.retryDelayMs);
          }
        }
      }

      if (!successful) {
        if (this.enableLocalBuffer) {
          if (this.failedEvents.length < this.maxFailedEvents) {
            this.failedEvents.push(...events);
            if (this.config.debug) {
              console.warn(`AutoTraceSDK: Failed to send ${events.length} events, saved ${this.failedEvents.length} total failed events`);
            }

            // Persist to disk if buffer is getting full
            if (this.persistentQueue && this.failedEvents.length > 100) {
              await this.persistToDisk();
            }
          } else if (this.config.debug) {
            console.warn(`AutoTraceSDK: Failed to send ${events.length} events and failedEvents queue is full`);
          }
        } else {
          console.warn(`AutoTraceSDK: Dropping ${events.length} events because local buffering is disabled`);
        }
      }
    } finally {
      // Always reset the flushing flag at the end 
      this.isFlushing = false;
    }
  }

  /**
   * Get all events from queue and clear them
   */
  private getEvents(): TelemetryEvent[] {
    if (this.queue.length === 0) {
      return [];
    }

    const events = [...this.queue];
    this.queue = [];
    return events;
  }

  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }


  private startTimer(): void {
    this.flushTimer = setInterval(() => {
      this.autoFlush();
      if (this.enableLocalBuffer) {
        this.retryFailedEvents();
      }
    }, this.batchInterval);
  }

  private async retryFailedEvents(): Promise<void> {
    if (!this.enableLocalBuffer || this.failedEvents.length === 0 || this.isFlushing) {
      return;
    }

    // Apply long-term backoff logic
    const backoffDelay = this.calculateLongTermBackoff(this.consecutiveFailures);
    if (this.lastRetryTime && Date.now() - this.lastRetryTime < backoffDelay) {
      return; // Skip this cycle, waiting for backoff
    }

    this.lastRetryTime = Date.now();

    const eventsToRetry = this.failedEvents.splice(0, this.batchSize);

    if (this.config.debug) {
      console.log(`AutoTraceSDK: Retrying ${eventsToRetry.length} failed events (consecutive failures: ${this.consecutiveFailures})`);
    }

    this.isFlushing = true;
    try {
      const successful = await this.sendFunction(eventsToRetry);

      if (!successful) {
        this.failedEvents.push(...eventsToRetry);
        this.consecutiveFailures++;
      } else {
        this.consecutiveFailures = 0; // Reset on success
      }

    } catch (error) {
      this.failedEvents.push(...eventsToRetry);
      this.consecutiveFailures++;
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Stop the batcher
   */
  stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Gracefully shutdown persistent queue
    if (this.persistentQueue) {
      this.shutdown();
    }
  }

  /**
   * Initialize persistent queue and load any persisted events
   */
  private async initializePersistentQueue(): Promise<void> {
    if (!this.persistentQueue) return;

    try {
      await this.persistentQueue.initialize();
      const persisted = await this.persistentQueue.load();

      if (persisted.length > 0) {
        // Filter expired events
        const valid = this.filterExpiredEvents(persisted);

        // Add to failedEvents for retry
        this.failedEvents.push(...valid);

        // Rebuild recentRequestIds Set from loaded events
        for (const event of valid) {
          this.recentRequestIds.add(event.request_id);
        }

        // Trim dedupe set to maxDedupeSize
        if (this.recentRequestIds.size > this.maxDedupeSize) {
          const idsArray = Array.from(this.recentRequestIds);
          this.recentRequestIds = new Set(idsArray.slice(-this.maxDedupeSize));
        }

        if (this.config.debug) {
          console.log(`AutoTraceSDK: Loaded ${valid.length} persisted events (${persisted.length - valid.length} expired)`);
        }

        // Clear disk queue after loading
        await this.persistentQueue.clear();
      }
    } catch (error) {
      if (this.config.debug) {
        console.error('AutoTraceSDK: Failed to initialize persistent queue:', error);
      }
      // Disable persistence on error
      this.persistentQueue = null;
    }
  }

  /**
   * Persist failed events to disk
   */
  private async persistToDisk(): Promise<void> {
    if (!this.persistentQueue) return;

    try {
      const toPersist = [...this.failedEvents];
      await this.persistentQueue.persist(toPersist);

      // Clear in-memory after successful persist
      this.failedEvents = [];

      if (this.config.debug) {
        console.log(`AutoTraceSDK: Persisted ${toPersist.length} events to disk`);
      }
    } catch (error) {
      if (this.config.debug) {
        console.error('AutoTraceSDK: Failed to persist events:', error);
      }
    }
  }

  /**
   * Calculate long-term exponential backoff delay
   */
  private calculateLongTermBackoff(failures: number): number {
    const config = this.config.persistentQueue;
    if (!config?.longTermRetryEnabled) {
      return 0; // No additional backoff
    }

    const baseDelay = 5000; // 5 seconds
    const multiplier = config.longTermBackoffMultiplier || 1.5;
    const maxDelay = config.longTermMaxDelayMs || 300000; // 5 minutes

    const delay = baseDelay * Math.pow(multiplier, failures);
    return Math.min(delay, maxDelay);
  }

  /**
   * Filter out expired events based on maxEventAge
   */
  private filterExpiredEvents(events: TelemetryEvent[]): TelemetryEvent[] {
    const config = this.config.persistentQueue;
    if (!config?.dropExpiredEvents) {
      return events;
    }

    const maxAge = config.maxEventAge || 86400000; // 24 hours
    const cutoff = Date.now() - maxAge;

    return events.filter(event => {
      const eventTime = new Date(event.timestamp).getTime();
      return eventTime >= cutoff;
    });
  }

  /**
   * Gracefully shutdown the batcher and persist remaining events
   */
  private async shutdown(): Promise<void> {
    if (!this.persistentQueue) return;

    try {
      // Persist any remaining failed events
      if (this.failedEvents.length > 0) {
        await this.persistentQueue.persist(this.failedEvents);
      }

      await this.persistentQueue.shutdown();
    } catch (error) {
      if (this.config.debug) {
        console.error('AutoTraceSDK: Error during shutdown:', error);
      }
    }
  }

  getQueueSize(): number { return this.queue.length;  }
}
