import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';

interface EndpointData {
  id: string;
  route: string;
  method: string;
  avgLatency: number;
  requests: number;
  errorRate: number;
  status: 'healthy' | 'warning' | 'critical';
}

interface EndpointTableProps {
  data: EndpointData[];
}

const statusColors = {
  healthy: 'bg-green-100 text-green-800 hover:bg-green-100',
  warning: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  critical: 'bg-red-100 text-red-800 hover:bg-red-100',
};

const methodColors = {
  GET: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  POST: 'bg-green-100 text-green-800 hover:bg-green-100',
  PUT: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  PATCH: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
  DELETE: 'bg-red-100 text-red-800 hover:bg-red-100',
};

export function EndpointTable({ data }: EndpointTableProps) {

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Route</TableHead>
            <TableHead>Method</TableHead>
            <TableHead className="text-right">Avg Latency</TableHead>
            <TableHead className="text-right">Requests</TableHead>
            <TableHead className="text-right">Error Rate</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                No route data available
              </TableCell>
            </TableRow>) : (
            data.map((endpoint) => (
              <TableRow key={endpoint.id}>
                <TableCell className="font-mono text-sm">{endpoint.route}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={methodColors[endpoint.method as keyof typeof methodColors] || 'bg-gray-100 text-gray-800 hover:bg-gray-100'}>
                    {endpoint.method}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{endpoint.avgLatency}ms</TableCell>
                <TableCell className="text-right">{endpoint.requests.toLocaleString()}</TableCell>
                <TableCell className="text-right">{endpoint.errorRate.toFixed(2)}%</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={statusColors[endpoint.status] || 'bg-gray-100 text-gray-800 hover:bg-gray-100'}>
                    {endpoint.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
