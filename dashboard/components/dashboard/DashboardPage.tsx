'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/contexts/TeamContext';
import { TeamSwitcher } from '@/components/TeamSwitcher';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LatencyChart } from '@/components/LatencyChart';
import { MetricCard } from '@/components/MetricCard';
import { EndpointTable } from '@/components/EndpointTable';
import { ResponseTimeDistribution } from '@/components/ResponseTimeDistribution';
import { AnomaliesCard } from '@/components/AnomaliesCard';
import { Activity, AlertCircle, Clock, TrendingUp } from 'lucide-react';
import { fetchMetrics, fetchServices, fetchStats, fetchRoutes, fetchDistribution, fetchAnomalies } from '@/lib/dashboardApi';

const timeRanges = [
  { id: '15m', label: 'Last 15m', hours: 0.25 },
  { id: '30m', label: 'Last 30m', hours: 0.5 },
  { id: '1h', label: 'Last 1h', hours: 1 },
  { id: '6h', label: 'Last 6h', hours: 6 },
  { id: '24h', label: 'Last 24h', hours: 24 },
  { id: '7d', label: 'Last 7d', hours: 7 * 24 },
];

const intervals = [
  { id: '15m', label: '15 min' },
  { id: '30m', label: '30 min' },
  { id: '1h', label: '60 min' },
];

const gradients = ['from-blue-500 to-cyan-500', 'from-purple-500 to-pink-500', 'from-green-500 to-teal-500', 'from-orange-500 to-red-500', 'from-indigo-500 to-blue-500', 'from-pink-500 to-rose-500'];

export default function DashboardPage() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const { currentTeam } = useTeam();
  const [selectedRange, setSelectedRange] = useState('1h');
  const [selectedInterval, setSelectedInterval] = useState('1h');

  const rangeHours = useMemo(() => {
    const range = timeRanges.find((item) => item.id === selectedRange);
    return range?.hours ?? 1;
  }, [selectedRange]);

  const { startTime, endTime } = useMemo(() => {
    const end = new Date();
    const start = new Date(end.getTime() - rangeHours * 60 * 60 * 1000);
    return { startTime: start.toISOString(), endTime: end.toISOString() };
  }, [rangeHours]);

  const teamId = currentTeam?.id;

  const statsQuery = useQuery({
    queryKey: ['stats', teamId, startTime, endTime],
    queryFn: () => fetchStats({ teamId: teamId!, startTime, endTime }),
    enabled: Boolean(teamId),
    staleTime: 30_000,
  });

  const servicesQuery = useQuery({
    queryKey: ['services', teamId],
    queryFn: () => fetchServices(teamId!),
    enabled: Boolean(teamId),
    staleTime: 60_000,
  });

  const metricsQuery = useQuery({
    queryKey: ['metrics', teamId, startTime, endTime, selectedInterval],
    queryFn: () => fetchMetrics({ teamId: teamId!, startTime, endTime, interval: selectedInterval }),
    enabled: Boolean(teamId),
    staleTime: 30_000,
  });

  const routesQuery = useQuery({
    queryKey: ['routes', teamId, startTime, endTime],
    queryFn: () => fetchRoutes({ teamId: teamId!, startTime, endTime }),
    enabled: Boolean(teamId),
    staleTime: 30_000,
  });

  const distributionQuery = useQuery({
    queryKey: ['distribution', teamId, startTime, endTime],
    queryFn: () => fetchDistribution({ teamId: teamId!, startTime, endTime }),
    enabled: Boolean(teamId),
    staleTime: 30_000,
  });

  const anomaliesQuery = useQuery({
    queryKey: ['anomalies', teamId, startTime, endTime],
    queryFn: () => fetchAnomalies({ teamId: teamId!, startTime, endTime, limit: 50 }),
    enabled: Boolean(teamId),
    staleTime: 30_000,
    refetchInterval: 60_000, // Refetch every minute
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <nav className="bg-gradient-to-r from-slate-900 to-slate-800 shadow-lg border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-white">AutoTrace</h1>
              <div className="flex flex-wrap space-x-2">
                <Link
                  href="/dashboard"
                  className="px-3 py-2 text-sm font-medium bg-blue-600 bg-opacity-90 text-white rounded-md hover:bg-opacity-100 transition-all"
                >
                  Dashboard
                </Link>
                <Link
                  href="/api-keys"
                  className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 hover:bg-opacity-50 rounded-md transition-all"
                >
                  API Keys
                </Link>
                <Link
                  href="/team-members"
                  className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 hover:bg-opacity-50 rounded-md transition-all"
                >
                  Team Members
                </Link>
                <Link
                  href="/docs"
                  className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 hover:bg-opacity-50 rounded-md transition-all"
                >
                  Documentation
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <TeamSwitcher />
              <span className="text-sm text-slate-300">{user?.username}</span>
              <button
                onClick={logout}
                className="px-3 py-1.5 text-sm text-slate-300 hover:text-white bg-slate-700 bg-opacity-50 hover:bg-opacity-70 rounded-md transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="mt-1 text-sm text-gray-600">Monitoring telemetry for {currentTeam?.name}</p>
        </header>

        {!teamId ? (
          <div className="text-center py-8 text-gray-500">Select a team to see metrics.</div>
        ) : statsQuery.isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading metrics...</div>
        ) : (
          <>
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <MetricCard
                title="Total Requests"
                value={(statsQuery.data?.totalRequests ?? 0).toLocaleString()}
                icon={Activity}
                iconColor="bg-blue-100 text-blue-600"
              />
              <MetricCard
                title="Error Rate"
                value={`${statsQuery.data?.errorRate ?? 0}%`}
                icon={AlertCircle}
                iconColor="bg-red-100 text-red-600"
                higherIsBetter={false}
              />
              <MetricCard
                title="Avg Latency"
                subtitle="(excludes zero latency)"
                value={`${statsQuery.data?.avgLatency ?? 0}ms`}
                icon={Clock}
                iconColor="bg-green-100 text-green-600"
                higherIsBetter={false}
              />
              <MetricCard
                title="P50 Latency"
                subtitle="(excludes zero latency)"
                value={`${statsQuery.data?.p50Latency ?? 0}ms`}
                icon={TrendingUp}
                iconColor="bg-purple-100 text-purple-600"
                higherIsBetter={false}
              />
            </section>

            <section className="mb-6 space-y-4">
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-gray-800">Latency Over Time</h3>
                  <div className="flex flex-wrap gap-2">
                    {timeRanges.map((range) => (
                      <button
                        key={range.id}
                        type="button"
                        onClick={() => setSelectedRange(range.id)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          selectedRange === range.id
                            ? 'bg-blue-600 text-white shadow'
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm font-medium text-gray-600">Interval</div>
                  <div className="flex flex-wrap gap-2">
                    {intervals.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSelectedInterval(option.id)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          selectedInterval === option.id
                            ? 'bg-slate-900 text-white shadow'
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <LatencyChart
                data={metricsQuery.data ?? []}
                isLoading={metricsQuery.isLoading}
                rangeHours={rangeHours}
                interval={selectedInterval}
              />
            </section>

            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50">
                <CardTitle className="text-2xl">Services</CardTitle>
                <CardDescription>Active services sending telemetry</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {servicesQuery.isLoading ? (
                  <div className="p-8 text-center text-gray-500">Loading...</div>
                ) : servicesQuery.data && servicesQuery.data.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {servicesQuery.data.map((service, index) => {
                      const gradient = gradients[index % gradients.length];
                      return (
                        <Card key={service} className="border-0 overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                          <div className={`h-2 bg-gradient-to-r ${gradient}`} />
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-semibold">{service}</CardTitle>
                            <CardDescription className="flex items-center gap-2 pt-2">
                              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                                <span className="inline-block w-2 h-2 bg-white rounded-full mr-1.5 animate-pulse" />
                                Active
                              </Badge>
                            </CardDescription>
                          </CardHeader>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 px-4">
                    <p className="text-lg font-medium text-gray-700 mb-2">No telemetry data yet</p>
                    <p className="text-sm text-muted-foreground mb-6">Get started by:</p>
                    <div className="max-w-md mx-auto bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                      <ol className="text-left space-y-3">
                        {['Create an API key', 'Install the AutoTrace client SDK', 'Configure the SDK with your key', 'Send telemetry and refresh'].map(
                          (step, stepIdx) => (
                            <li className="flex items-start gap-3" key={step}>
                              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                {stepIdx + 1}
                              </span>
                              <span className="text-gray-700">
                                {stepIdx === 0 ? (
                                  <Link href="/api-keys" className="text-blue-600 hover:text-blue-800 font-medium hover:underline">
                                    {step}
                                  </Link>
                                ) : (
                                  step
                                )}
                              </span>
                            </li>
                          )
                        )}
                      </ol>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Anomalies Section */}
            <div className="mt-6">
              <AnomaliesCard
                anomalies={anomaliesQuery.data ?? []}
                isLoading={anomaliesQuery.isLoading}
              />
            </div>

            {/* Bottom Grid - Route Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              {/* Response Time Distribution */}
              <Card className="border-2 shadow-lg lg:col-span-1">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50">
                  <CardTitle className="text-lg">Response Time Distribution</CardTitle>
                  <CardDescription>Request count by latency range</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {distributionQuery.isLoading ? (
                    <div className="text-center py-12 text-gray-500">Loading distribution...</div>
                  ) : distributionQuery.data ? (
                    <ResponseTimeDistribution data={distributionQuery.data} />
                  ) : (
                    <div className="text-center py-12 text-gray-500">No data available</div>
                  )}
                </CardContent>
              </Card>

              {/* Top Routes Table */}
              <Card className="border-2 shadow-lg lg:col-span-2">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50">
                  <CardTitle className="text-lg">Top Routes</CardTitle>
                  <CardDescription>Performance breakdown by route and method</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {routesQuery.isLoading ? (
                    <div className="text-center py-12 text-gray-500">Loading routes...</div>
                  ) : routesQuery.data ? (
                    <EndpointTable data={routesQuery.data} />
                  ) : (
                    <div className="text-center py-12 text-gray-500">No data available</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
