const DEFAULT_INGESTION_URL = 'http://localhost:4000';

export const dashboardConfig = {
  publicIngestionUrl: process.env.NEXT_PUBLIC_INGESTION_URL || DEFAULT_INGESTION_URL,
  internalIngestionUrl:
    process.env.INTERNAL_INGESTION_URL ||
    process.env.NEXT_PUBLIC_INGESTION_URL ||
    DEFAULT_INGESTION_URL,
};
