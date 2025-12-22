import express from 'express';
import request from 'supertest';

const queryEventsMock = jest.fn().mockResolvedValue([]);
const insertBatchMock = jest.fn();

const storageServiceMock = {
  insertBatch: insertBatchMock,
  insertEvent: jest.fn(),
  queryEvents: queryEventsMock,
  close: jest.fn(),
  healthCheck: jest.fn()
};

jest.mock('../../services/storage', () => ({
  storageService: storageServiceMock
}));

const { telemetryRouter } = require('../telemetry');

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/telemetry', telemetryRouter);
  return app;
};

describe('GET /telemetry validation', () => {
  beforeEach(() => {
    queryEventsMock.mockReset();
    queryEventsMock.mockResolvedValue([]);
    insertBatchMock.mockReset();
  });

  it('rejects invalid startTime format', async () => {
    const response = await request(createTestApp())
      .get('/telemetry')
      .query({ startTime: 'not-a-date' });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('startTime');
    expect(queryEventsMock).not.toHaveBeenCalled();
  });

  it('rejects invalid endTime format', async () => {
    const response = await request(createTestApp())
      .get('/telemetry')
      .query({ endTime: 'not-a-date' });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('endTime');
    expect(queryEventsMock).not.toHaveBeenCalled();
  });

  it('rejects when startTime is after endTime', async () => {
    const response = await request(createTestApp())
      .get('/telemetry')
      .query({
        startTime: '2024-01-02T00:00:00.000Z',
        endTime: '2024-01-01T00:00:00.000Z'
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('earlier than endTime');
    expect(queryEventsMock).not.toHaveBeenCalled();
  });

  it('rejects invalid limit value', async () => {
    const response = await request(createTestApp())
      .get('/telemetry')
      .query({ limit: '2001' });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('limit');
    expect(queryEventsMock).not.toHaveBeenCalled();
  });

  it('rejects invalid offset value', async () => {
    const response = await request(createTestApp())
      .get('/telemetry')
      .query({ offset: '-5' });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('offset');
    expect(queryEventsMock).not.toHaveBeenCalled();
  });

  it('passes filters through on valid query parameters', async () => {
    const response = await request(createTestApp())
      .get('/telemetry')
      .query({
        service: 'api',
        route: '/users',
        startTime: '2024-01-01T00:00:00.000Z',
        endTime: '2024-01-02T00:00:00.000Z',
        limit: '10',
        offset: '5'
      });

    expect(response.status).toBe(200);
    expect(queryEventsMock).toHaveBeenCalledTimes(1);
    expect(queryEventsMock).toHaveBeenCalledWith({
      service: 'api',
      route: '/users',
      startTime: new Date('2024-01-01T00:00:00.000Z'),
      endTime: new Date('2024-01-02T00:00:00.000Z'),
      limit: 10,
      offset: 5
    });
  });
});
