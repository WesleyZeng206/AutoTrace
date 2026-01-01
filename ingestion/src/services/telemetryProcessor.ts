import type { TelemetryEvent } from '@autotrace/telemetry';
import { storageService } from './storage';

type Batch = {
  events: TelemetryEvent[];
  teamId: string;
  apiKeyId?: string;
};

class TelemetryProcessor {
  private queue: Batch[] = [];
  private draining = false;

  enqueue(events: TelemetryEvent[], teamId: string, apiKeyId?: string) {
    this.queue.push({ events, teamId, apiKeyId });
    if (!this.draining) {
      this.scheduleDrain();
    }
  }

  private scheduleDrain() {
    setImmediate(() => {
      void this.drain();
    });
  }

  private async drain() {
    if (this.draining) return;
    this.draining = true;

    while (this.queue.length > 0) {
      const batch = this.queue.shift();
      if (!batch) {
        break;
      }

      try {
        await storageService.insertBatch(batch.events, batch.teamId, batch.apiKeyId);
      } catch (error) {
        console.error('Failed to persist telemetry batch', error);
      }
    }

    this.draining = false;
    if (this.queue.length > 0) {
      this.scheduleDrain();
    }
  }
}

export const telemetryProcessor = new TelemetryProcessor();
