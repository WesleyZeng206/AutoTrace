import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';
import { PersistentQueue } from '../src/persistence';
import type { TelemetryEvent, PersistentQueueOptions } from '../src/types';

const createEvent = (suffix: string): TelemetryEvent => ({
  request_id: `event-${suffix}`,
  service_name: 'queue-test',
  route: `/route-${suffix}`,
  method: 'GET',
  status_code: 200,
  duration_ms: 123,
  timestamp: new Date(
    Date.now() + (Number.isFinite(Number(suffix)) ? Number(suffix) : 0)
  ).toISOString(),
});

describe('PersistentQueue', () => {
  let baseDir: string;

  const makeQueue = (overrides: Partial<PersistentQueueOptions> = {}, debug = false) =>
    new PersistentQueue(
      {
        queueDir: baseDir,
        persistInterval: 5,
        autoFlushOnExit: false,
        ...overrides,
      },
      debug
    );

  const removeQueueDir = async () => {
    const dirPath = `${baseDir}-${process.pid}`;
    await fs.rm(dirPath, { recursive: true, force: true }).catch(() => undefined);
  };

  beforeEach(() => {
    baseDir = path.join(os.tmpdir(), `autotrace-pqueue-${Date.now()}-${Math.random()}`);
  });

  afterEach(async () => {
    await removeQueueDir();
  });

  it('persists events to disk and then loads them later', async () => {
    const queue = makeQueue();
    await queue.initialize();
    await queue.persist([createEvent('1'), createEvent('2')]);
    await queue.shutdown();

    const reloaded = makeQueue();
    await reloaded.initialize();
    const events = await reloaded.load();
    expect(events.map(event => event.request_id)).toEqual(['event-1', 'event-2']);
    await reloaded.shutdown();
  });

  it('counts buffered events before flushing ', async () => {
    const queue = makeQueue({ persistInterval: 60_000 });
    await queue.initialize();
    await queue.persist([createEvent('buffered')]);
    expect(await queue.getCount()).toBe(1);
    await queue.shutdown();

    const reopened = makeQueue();
    await reopened.initialize();
    expect(await reopened.getCount()).toBe(1);
    await reopened.shutdown();
  });

  it('clears persisted events and metadata', async () => {
    const queue = makeQueue();
    await queue.initialize();
    await queue.persist([createEvent('clear-1'), createEvent('clear-2')]);
    await queue.shutdown();

    const reopened = makeQueue();
    await reopened.initialize();
    await reopened.clear();
    expect(await reopened.getCount()).toBe(0);
    expect(await reopened.load()).toHaveLength(0);
    await reopened.shutdown();
  });

  it('drops the oldest events when going over the queue capacity', async () => {
    const queue = makeQueue({ maxQueueSize: 2 });
    await queue.initialize();
    await queue.persist([createEvent('1')]);
    await queue.shutdown();

    const queue2 = makeQueue({ maxQueueSize: 2 });
    await queue2.initialize();
    await queue2.persist([createEvent('2')]);
    await queue2.shutdown();

    const queue3 = makeQueue({ maxQueueSize: 2 });
    await queue3.initialize();
    await queue3.persist([createEvent('3')]);
    await queue3.shutdown();

    const finalQueue = makeQueue({ maxQueueSize: 2 });
    await finalQueue.initialize();
    const events = await finalQueue.load();
    expect(events.map(event => event.request_id)).toEqual(['event-2', 'event-3']);
    await finalQueue.shutdown();
  });

  it('skips corrupted lines when loading events', async () => {
    const queue = makeQueue();
    await queue.initialize();

    const queueFile = (queue as any).queueFile as string;
    const valid = createEvent('valid');
    const corruptedContent = `${JSON.stringify(valid)}\nnot-json\n${JSON.stringify({})}\n`;
    await fs.writeFile(queueFile, corruptedContent, 'utf-8');

    const events = await queue.load();
    expect(events).toHaveLength(1);
    expect(events[0].request_id).toBe('event-valid');
    await queue.shutdown();
  });

  it('flushes buffered events on shutdown even without timer firing', async () => {
    const queue = makeQueue({ persistInterval: 60_000 });
    await queue.initialize();
    await queue.persist([createEvent('late')]);
    await queue.shutdown();

    const reloaded = makeQueue();
    await reloaded.initialize();
    const events = await reloaded.load();
    expect(events).toHaveLength(1);
    expect(events[0].request_id).toBe('event-late');
    await reloaded.shutdown();
  });
});
