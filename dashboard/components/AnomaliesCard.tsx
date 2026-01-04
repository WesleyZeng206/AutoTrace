'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { AnomalyData } from '@/lib/dashboardApi';

interface AnomaliesCardProps {
  anomalies: AnomalyData[];
  isLoading: boolean;
}

const severityConfig = {
  critical: {
    icon: AlertCircle,
    color: 'bg-red-100 text-red-700 border-red-200',
    badgeColor: 'bg-red-500 text-white',
    iconColor: 'text-red-600',
  },
  warning: {
    icon: AlertTriangle,
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    badgeColor: 'bg-yellow-500 text-white',
    iconColor: 'text-yellow-600',
  },
  info: {
    icon: Info,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    badgeColor: 'bg-blue-500 text-white',
    iconColor: 'text-blue-600',
  },
};

export function AnomaliesCard({ anomalies, isLoading }: AnomaliesCardProps) {
  if (isLoading) {
    return (
      <Card className="border-2 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50">
          <CardTitle className="text-lg">Anomalies</CardTitle>
          <CardDescription>Recent anomalies detected</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-12 text-gray-500">Loading anomalies...</div>
        </CardContent>
      </Card>
    );
  }

  if (!anomalies || anomalies.length === 0) {
    return (
      <Card className="border-2 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50">
          <CardTitle className="text-lg">Anomalies</CardTitle>
          <CardDescription>Recent anomalies detected</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-700">All systems normal</p>
            <p className="text-sm text-gray-500 mt-1">No anomalies detected</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          Anomalies Detected
        </CardTitle>
        <CardDescription>
          {anomalies.length} anomal{anomalies.length === 1 ? 'y' : 'ies'} in the selected time
          range
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {anomalies.slice(0, 20).map((anomaly) => {
            const config = severityConfig[anomaly.severity];
            const Icon = config.icon;
            const timestamp = new Date(anomaly.time_bucket);
            const relativeTime = getRelativeTime(timestamp);

            return (
              <div
                key={anomaly.id}
                className={`p-3 rounded-lg border ${config.color} transition-all hover:shadow-md`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${config.iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge className={`${config.badgeColor} border-0 text-xs`}>
                        {anomaly.severity.toUpperCase()}
                      </Badge>
                      <span className="text-sm font-semibold text-gray-900">
                        {anomaly.service_name}
                      </span>
                      <span className="text-xs text-gray-500">{relativeTime}</span>
                    </div>
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">Route:</span>{' '}
                      <code className="bg-white bg-opacity-70 px-1.5 py-0.5 rounded text-xs">
                        {anomaly.route}
                      </code>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      <span className="font-medium">{formatMetric(anomaly.metric)}:</span> Z-score{' '}
                      {anomaly.score.toFixed(2)} (baseline:{' '}
                      {anomaly.baseline_mean.toFixed(2)}
                      {anomaly.metric === 'error_rate' ? '%' : 'ms'})
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {anomalies.length > 20 && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Showing 20 of {anomalies.length} anomalies
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function formatMetric(metric: string): string {
  switch (metric) {
    case 'avg_latency':
      return 'Avg Latency';
    case 'error_rate':
      return 'Error Rate';
    default:
      return metric;
  }
}
