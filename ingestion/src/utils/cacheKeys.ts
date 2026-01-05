export const CacheKeys = {
  stats: (teamId: string, startTime: string, endTime: string, service?: string) =>
    `stats:${teamId}:${startTime}:${endTime}:${service || 'all'}`,

  metrics: (teamId: string, startTime: string, endTime: string, interval: string, service?: string, route?: string) =>
    `metrics:${teamId}:${startTime}:${endTime}:${interval}:${service || 'all'}:${route || 'all'}`,

  routes: (teamId: string, startTime: string, endTime: string, service?: string) =>
    `routes:${teamId}:${startTime}:${endTime}:${service || 'all'}`,

  distribution: (teamId: string, startTime: string, endTime: string, service?: string, route?: string) =>
    `distribution:${teamId}:${startTime}:${endTime}:${service || 'all'}:${route || 'all'}`,

  services: (teamId: string) =>
    `services:${teamId}`,

  anomalies: (teamId: string, startTime: string, endTime: string, windowHours: number, severity?: string) =>
    `anomalies:${teamId}:${startTime}:${endTime}:${windowHours}:${severity || 'all'}`,

  teamPattern: (teamId: string) => `*:${teamId}:*`,
  allStats: () => 'stats:*',
  allMetrics: () => 'metrics:*',
  allRoutes: () => 'routes:*',
};
