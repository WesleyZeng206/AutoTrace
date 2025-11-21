import { TelemetryEvent, AIPConfig } from './types';

/**
 * EventBatcher collects events and groups them together
 *
 * Simple batching rules:
 * - Flush when we have 10 events (or configured batch size)
 * - Flush every 5 seconds (or configured interval)
 * - Retry failed sends 3 times before giving up
 */
export class EventBatcher {
  //Our main queue where events will be added to
  private queue: TelemetryEvent[] = [];

  private flushTimer: NodeJS.Timeout | null = null;
  private config: AIPConfig;
  private batchSize: number;
  private batchInterval: number;
  private sendFunction: (events: TelemetryEvent[]) => Promise<boolean>;
  private maxRetries: number = 3;

  constructor(
    config: AIPConfig, sendFunction: (events: TelemetryEvent[]) => Promise<boolean>
  ) {
    this.config = config;
    this.batchSize = config.batchSize || 10;
    this.batchInterval = config.batchInterval || 5000;
    this.sendFunction = sendFunction;

    this.startTimer();
  }

  /**
   * Add an event to the queue
   */
  add(event: TelemetryEvent): void {
    this.queue.push(event);

    if (this.queue.length >= this.batchSize) {
      this.autoFlush();
    }
  }

  /**
   * Automatic flush; will try to send events up to 3 times max
   */
  private async autoFlush(): Promise<void> {
    const events = this.getEvents();
    if (events.length === 0) {
      return;
    }

    let successful = false;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        successful = await this.sendFunction(events);

        if (successful) {
          if (this.config.debug) {
            console.log(`AIP: Sent ${events.length} events`);
          }
          break; 
        }

        if (attempt < this.maxRetries) {
          if (this.config.debug) {
            console.log(`AIP: Send failed, retrying (${attempt}/${this.maxRetries})`);
          }
          await this.sleep(500);
        }
      } catch (error) {
        if (this.config.debug) {
          console.error(`AIP: Send error on attempt ${attempt}:`, error);
        }

        if (attempt < this.maxRetries) {
          await this.sleep(500);
        }
      }
    }

    if (!successful && this.config.debug) {
      console.warn(`AIP: Failed to send ${events.length} events after ${this.maxRetries} attempts`);
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
    }, this.batchInterval);
  }

  /**
   * Stop the batcher
   */
  stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  getQueueSize(): number {
    return this.queue.length;  }
}
