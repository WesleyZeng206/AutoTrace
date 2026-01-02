import * as fs from 'fs/promises';
import { createReadStream } from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { TelemetryEvent, PersistentQueueOptions } from './types';

interface QueueMetadata {
  eventCount: number;
  oldestTimestamp: string | null;
  newestTimestamp: string | null;
  lastUpdated: string;
}

function emptyMetadata(): QueueMetadata {
  return {
    eventCount: 0,
    oldestTimestamp: null,
    newestTimestamp: null,
    lastUpdated: new Date().toISOString(),
  };
}

export class PersistentQueue {
  private queueDir: string;
  private queueFile: string;
  private metaFile: string;
  private maxSize: number;
  private persistInterval: number;
  private writeBuffer: TelemetryEvent[] = [];
  private writeTimer: NodeJS.Timeout | null = null;
  private debug: boolean;
  private initialized = false;
  private persistenceDisabled = false;
  private metadata: QueueMetadata = emptyMetadata();
  private persistedCount = 0;
  private autoFlushOnExit: boolean;
  private exitHandler?: () => void;

  constructor(options: PersistentQueueOptions, debug: boolean = false) {
    const baseDir = options.queueDir || './.autotrace-queue';
    this.queueDir = `${baseDir}-${process.pid}`;
    this.queueFile = path.join(this.queueDir, 'events.jsonl');
    this.metaFile = path.join(this.queueDir, 'queue.meta.json');
    this.maxSize = options.maxQueueSize ?? 10000;
    this.persistInterval = options.persistInterval ?? 1000;
    this.autoFlushOnExit = options.autoFlushOnExit !== false;
    this.debug = debug;
  }
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      await this.ensureDirectory();
      await this.rebuildMetadataFromDisk();

      if (this.autoFlushOnExit && !this.exitHandler) {
        this.exitHandler = () => {
          void this.shutdown();
        };
        process.on('beforeExit', this.exitHandler);
      }

      this.initialized = true;

      if (this.debug) {
        console.log(`AutoTrace: Persistent queue ready at ${this.queueDir}`);
      }
    } catch (error: any) {
      if (this.debug) {
        console.error('AutoTrace: Failed to initialize persistent queue:', error.message);
      }
      this.persistenceDisabled = true;
      throw error;
    }
  }

  async persist(events: TelemetryEvent[]): Promise<void> {
    if (!this.initialized || this.persistenceDisabled || events.length === 0) {
      return;
    }

    this.writeBuffer.push(...events);

    if (!this.writeTimer) {
      this.writeTimer = setTimeout(() => {
        this.flushBuffer().catch(err => {
          if (this.debug) {
            console.error('AutoTrace: Error flushing write buffer:', err);
          }
        });
      }, this.persistInterval);
    }
  }

  async load(): Promise<TelemetryEvent[]> {
    if (!this.initialized || this.persistenceDisabled) {
      return [];
    }

    const { events, corrupted } = await this.readEventsFromDisk(this.maxSize);

    if (corrupted > 0 && this.debug) {
      console.warn(`AutoTrace: Skipped ${corrupted} corrupted events from persistent queue`);
    }

    if (corrupted > 0 && corrupted > events.length * 0.1) {
      const backupFile = `${this.queueFile}.corrupted.${Date.now()}`;
      await fs.rename(this.queueFile, backupFile).catch(() => undefined);
      await this.rebuildMetadataFromDisk();

      if (this.debug) {
        console.warn(`AutoTrace: Backed up corrupted queue file to ${backupFile}`);
      }
    }

    if (this.debug && events.length > 0) {
      console.log(`AutoTrace: Loaded ${events.length} events from persistent queue`);
    }

    return events;
  }

  async clear(): Promise<void> {
    if (!this.initialized || this.persistenceDisabled) {
      return;
    }

    this.writeBuffer = [];

    try {
      await fs.unlink(this.queueFile);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    await this.resetMetadata();

    if (this.debug) {
      console.log('AutoTrace: Persistent queue cleared');
    }
  }

  async getCount(): Promise<number> {
    if (!this.initialized || this.persistenceDisabled) {
      return 0;
    }
    return this.persistedCount + this.writeBuffer.length;
  }

  async shutdown(): Promise<void> {
    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
      this.writeTimer = null;
    }

    if (this.exitHandler) {
      process.off('beforeExit', this.exitHandler);
      this.exitHandler = undefined;
    }

    if (this.writeBuffer.length > 0) {
      await this.flushBuffer();
    }

    if (this.debug) {
      console.log('AutoTrace: Persistent queue shutdown complete');
    }
  }

  private async flushBuffer(): Promise<void> {
    if (this.writeBuffer.length === 0 || this.persistenceDisabled) {
      this.writeTimer = null;
      return;
    }

    const eventsToWrite = [...this.writeBuffer];
    this.writeBuffer = [];

    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
      this.writeTimer = null;
    }

    try {
      const available = Math.max(this.maxSize - this.persistedCount, 0);
      const deficit = Math.max(eventsToWrite.length - available, 0);

      if (deficit > 0) {
        await this.discardOldest(deficit);
        await this.rebuildMetadataFromDisk();
      }

      let newCapacity = Math.max(this.maxSize - this.persistedCount, 0);
      if (newCapacity <= 0) {
        if (this.debug) {
          console.warn('AutoTrace: Persistent queue full, dropping new events');
        }
        return;
      }

      const toPersist = eventsToWrite.slice(0, newCapacity);
      await this.appendToFile(toPersist);
      this.persistedCount += toPersist.length;
      this.updateMetadataAfterAppend(toPersist);
      await this.writeMetadata();

      if (this.debug) {
        console.log(`AutoTrace: Persisted ${toPersist.length} events to disk`);
      }

      if (eventsToWrite.length > toPersist.length && this.debug) {
        console.warn(
          `AutoTrace: Dropped ${eventsToWrite.length - toPersist.length} events after trimming queue`
        );
      }
    } catch (error: any) {
      if (error.code === 'ENOSPC' || error.code === 'EACCES') {
        this.persistenceDisabled = true;
        if (this.debug) {
          console.error(`AutoTrace: ${error.code === 'ENOSPC' ? 'Disk full' : 'Permission denied'}, disabling persistent queue`);
        }
      } else if (this.debug) {
        console.error('AutoTrace: Failed to flush write buffer:', error.message);
      }
    }
  }

  private async readEventsFromDisk(limit?: number): Promise<{ events: TelemetryEvent[]; corrupted: number }> {
    const events: TelemetryEvent[] = [];
    let corrupted = 0;

    try {
      const fileStream = createReadStream(this.queueFile, { encoding: 'utf-8' });
      const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

      for await (const line of rl) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const event = JSON.parse(trimmed);
          if (this.isValidEvent(event)) {
            events.push(event);
            if (limit && events.length >= limit) {
              break;
            }
          } else {
            corrupted++;
          }
        } catch {
          corrupted++;
        }
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return { events: [], corrupted: 0 };
      }
      if (this.debug) {
        console.error('AutoTrace: Failed to load persistent queue:', error.message);
      }
    }

    return { events, corrupted };
  }

  private async appendToFile(events: TelemetryEvent[]): Promise<void> {
    if (events.length === 0) return;
    const content = events.map(e => JSON.stringify(e)).join('\n') + '\n';
    await fs.appendFile(this.queueFile, content, 'utf-8');
  }

  private async ensureDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.queueDir, { recursive: true });
    } catch (error: any) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  private async discardOldest(count: number): Promise<void> {
    if (count <= 0) return;

    try {
      const content = await fs.readFile(this.queueFile, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        return;
      }

      const remaining = lines.slice(Math.min(count, lines.length));
      const data = remaining.length > 0 ? remaining.join('\n') + '\n' : '';
      await fs.writeFile(this.queueFile, data, 'utf-8');
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  private async rebuildMetadataFromDisk(): Promise<void> {
    const metadata = emptyMetadata();

    try {
      const fileStream = createReadStream(this.queueFile, { encoding: 'utf-8' });
      const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

      for await (const line of rl) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const event = JSON.parse(trimmed);
          if (!this.isValidEvent(event)) {
            continue;
          }

          metadata.eventCount += 1;
          if (!metadata.oldestTimestamp) {
            metadata.oldestTimestamp = event.timestamp;
          }
          metadata.newestTimestamp = event.timestamp;
        } catch {
          continue;
        }
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT' && this.debug) {
        console.warn('AutoTrace: Failed to rebuild queue metadata:', error.message);
      }
    }

    metadata.lastUpdated = new Date().toISOString();
    this.metadata = metadata;
    this.persistedCount = metadata.eventCount;
    await this.writeMetadata();
  }

  private async resetMetadata(): Promise<void> {
    this.metadata = emptyMetadata();
    this.persistedCount = 0;
    await this.writeMetadata();
  }

  private updateMetadataAfterAppend(events: TelemetryEvent[]): void {
    if (events.length === 0) return;

    const timestamps = events
      .map(event => event.timestamp)
      .filter((ts): ts is string => typeof ts === 'string');

    this.metadata.eventCount = this.persistedCount;
    if (!this.metadata.oldestTimestamp && timestamps.length > 0) {
      this.metadata.oldestTimestamp = timestamps[0];
    }
    if (timestamps.length > 0) {
      this.metadata.newestTimestamp = timestamps[timestamps.length - 1];
    }
    this.metadata.lastUpdated = new Date().toISOString();
  }

  private async writeMetadata(): Promise<void> {
    try {
      await fs.writeFile(this.metaFile, JSON.stringify(this.metadata, null, 2), 'utf-8');
    } catch (error: any) {
      if (this.debug) {
        console.warn('AutoTrace: Failed to update metadata:', error.message);
      }
    }
  }

  private isValidEvent(obj: any): obj is TelemetryEvent {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      typeof obj.request_id === 'string' &&
      typeof obj.service_name === 'string' &&
      typeof obj.route === 'string' &&
      typeof obj.method === 'string' &&
      typeof obj.status_code === 'number' &&
      typeof obj.duration_ms === 'number' &&
      typeof obj.timestamp === 'string'
    );
  }
}
