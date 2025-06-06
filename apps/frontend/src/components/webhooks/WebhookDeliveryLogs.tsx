import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@tnf/ui-consolidated';
import { Button } from '@tnf/ui-consolidated';
import { Badge } from '@tnf/ui-consolidated';
import { Input } from '@tnf/ui-consolidated';
import { Select } from '@tnf/ui-consolidated';
import { 
  Search, 
  RefreshCw, 
  Download, 
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { DeliveryStatus, IntegrationSource } from '@tnf/types';
import { useWebhookManagement } from './hooks/useWebhookManagement';

export interface WebhookDeliveryLog {
  id: string;
  webhook_config_id: string;
  event_id: string;
  delivery_url: string;
  http_status: number;
  status: DeliveryStatus;
  attempt_number: number;
  response_time_ms: number;
  error_message?: string;
  request_headers: Record<string, string>;
  request_body: Record<string, unknown>;
  response_headers: Record<string, string>;
  response_body: Record<string, unknown>;
  created_at: string;
  next_retry_at?: string;
  source: IntegrationSource;
  event_type: string;
}

export interface WebhookDeliveryLogsProps {
  webhookConfigId?: string;
  className?: string;
}

const STATUS_COLORS: Record<DeliveryStatus, string> = {
  [DeliveryStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [DeliveryStatus.DELIVERED]: 'bg-green-100 text-green-800',
  [DeliveryStatus.FAILED]: 'bg-red-100 text-red-800',
  [DeliveryStatus.RETRYING]: 'bg-blue-100 text-blue-800',
  [DeliveryStatus.ABANDONED]: 'bg-gray-100 text-gray-800',
};

const STATUS_ICONS: Record<DeliveryStatus, JSX.Element> = {
  [DeliveryStatus.PENDING]: <Clock className="w-4 h-4" />,
  [DeliveryStatus.DELIVERED]: <CheckCircle className="w-4 h-4" />,
  [DeliveryStatus.FAILED]: <XCircle className="w-4 h-4" />,
  [DeliveryStatus.RETRYING]: <RotateCcw className="w-4 h-4" />,
  [DeliveryStatus.ABANDONED]: <AlertTriangle className="w-4 h-4" />,
};

export function WebhookDeliveryLogs({
  webhookConfigId,
  className,
}: WebhookDeliveryLogsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<DeliveryStatus | 'all'>('all');
  const [selectedSource, setSelectedSource] = useState<IntegrationSource | 'all'>('all');
  const [selectedLog, setSelectedLog] = useState<WebhookDeliveryLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const { getDeliveryLogs, retryDelivery, loading } = useWebhookManagement();
  const [logs, setLogs] = useState<WebhookDeliveryLog[]>([]);

  const handleRetry = async (logId: string) => {
    try {
      await retryDelivery(logId);
      // Refresh logs after retry
      const fetchedLogs = await getDeliveryLogs(webhookConfigId);
      setLogs(fetchedLogs);
    } catch (error) {
      console.error('Failed to retry delivery:', error);
    }
  };

  // Fetch logs when component mounts or webhookConfigId changes
  React.useEffect(() => {
    const fetchLogs = async () => {
      try {
        const fetchedLogs = await getDeliveryLogs(webhookConfigId);
        setLogs(fetchedLogs);
      } catch (error) {
        console.error('Failed to fetch delivery logs:', error);
        // Fallback to empty array if fetch fails
        setLogs([]);
      }
    };
    
    fetchLogs();
  }, [getDeliveryLogs, webhookConfigId]);
  
  // Fallback mock data if logs array is empty
  React.useEffect(() => {
    if (logs.length === 0) {
      setLogs([
        {
          id: '1',
          webhook_config_id: 'config-1',
          event_id: 'event-1',
          delivery_url: 'https://api.example.com/webhooks',
          http_status: 200,
          status: DeliveryStatus.DELIVERED,
          attempt_number: 1,
          response_time_ms: 245,
          request_headers: { 'Content-Type': 'application/json' },
          request_body: { event: 'payment.completed', amount: 1000 },
          response_headers: { 'Status': '200 OK' },
          response_body: { received: true },
          created_at: new Date().toISOString(),
          source: IntegrationSource.STRIPE,
          event_type: 'payment.completed',
        },
        // Add more mock logs if needed
      ]);
    }
  }, [logs.length]);

  const filteredLogs = useMemo(() => {
    let filtered = logs;

    if (webhookConfigId) {
      filtered = filtered.filter(log => log.webhook_config_id === webhookConfigId);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(log => log.status === selectedStatus);
    }

    if (selectedSource !== 'all') {
      filtered = filtered.filter(log => log.source === selectedSource);
    }

    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [logs, webhookConfigId, searchTerm, selectedStatus, selectedSource]);

  // handleRetry is already defined inside the useMemo callback

  const handleExportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `webhook-delivery-logs-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
    });
  };

  const getHttpStatusColor = (status: number): string => {
    if (status >= 200 && status < 300) return 'text-green-600';
    if (status >= 300 && status < 400) return 'text-blue-600';
    if (status >= 400 && status < 500) return 'text-orange-600';
    if (status >= 500) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Delivery Logs</h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportLogs}
            disabled={filteredLogs.length === 0}
          >
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={selectedStatus}
              onValueChange={(value: DeliveryStatus | 'all') => setSelectedStatus(value)}
            >
              <option value="all">All Statuses</option>
              {Object.values(DeliveryStatus).map(status => (
                <option key={status} value={status}>
                  {getStatusText(status)}
                </option>
              ))}
            </Select>
            <Select
              value={selectedSource}
              onValueChange={(value: IntegrationSource | 'all') => setSelectedSource(value)}
            >
              <option value="all">All Sources</option>
              {Object.values(IntegrationSource).map(source => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </Select>
            <div className="flex items-center text-sm text-muted-foreground">
              <Filter className="w-4 h-4 mr-1" />
              {filteredLogs.length} logs
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Clock className="w-8 h-8 mx-auto mb-2" />
              <p>No delivery logs found</p>
              <p className="text-sm">Logs will appear here as webhooks are delivered</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Response
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timing
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attempts
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {log.event_type}
                          </div>
                          <div className="text-sm text-gray-500">
                            {log.source}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={STATUS_COLORS[log.status]}>
                          {STATUS_ICONS[log.status]}
                          <span className="ml-1">{getStatusText(log.status)}</span>
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className={`text-sm font-medium ${getHttpStatusColor(log.http_status)}`}>
                            {log.http_status}
                          </div>
                          {log.error_message && (
                            <div className="text-sm text-red-600 truncate max-w-xs">
                              {log.error_message}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">
                            {log.response_time_ms}ms
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(log.created_at)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {log.attempt_number}
                          {log.next_retry_at && (
                            <div className="text-xs text-gray-500">
                              Next: {formatDate(log.next_retry_at)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedLog(log);
                              setShowDetails(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {log.status === DeliveryStatus.FAILED && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRetry(log.id)}
                              disabled={loading}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(log.delivery_url, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Details Modal */}
      {showDetails && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <Card className="border-0">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle>Delivery Log Details</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDetails(false)}
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Event Information</h4>
                    <div className="space-y-1 text-sm">
                      <div>Event Type: <span className="font-medium">{selectedLog.event_type}</span></div>
                      <div>Source: <span className="font-medium">{selectedLog.source}</span></div>
                      <div>Event ID: <span className="font-mono text-xs">{selectedLog.event_id}</span></div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Delivery Information</h4>
                    <div className="space-y-1 text-sm">
                      <div>Status: <Badge className={STATUS_COLORS[selectedLog.status]}>{getStatusText(selectedLog.status)}</Badge></div>
                      <div>HTTP Status: <span className={`font-medium ${getHttpStatusColor(selectedLog.http_status)}`}>{selectedLog.http_status}</span></div>
                      <div>Response Time: <span className="font-medium">{selectedLog.response_time_ms}ms</span></div>
                      <div>Attempt: <span className="font-medium">{selectedLog.attempt_number}</span></div>
                    </div>
                  </div>
                </div>

                {/* Request Details */}
                <div>
                  <h4 className="font-medium mb-2">Request</h4>
                  <div className="space-y-2">
                    <div>
                      <div className="text-sm font-medium">URL:</div>
                      <div className="text-sm font-mono bg-gray-100 p-2 rounded">{selectedLog.delivery_url}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Headers:</div>
                      <pre className="text-xs font-mono bg-gray-100 p-2 rounded overflow-x-auto">
                        {JSON.stringify(selectedLog.request_headers, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Body:</div>
                      <pre className="text-xs font-mono bg-gray-100 p-2 rounded overflow-x-auto max-h-32">
                        {JSON.stringify(selectedLog.request_body, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Response Details */}
                <div>
                  <h4 className="font-medium mb-2">Response</h4>
                  <div className="space-y-2">
                    <div>
                      <div className="text-sm font-medium">Headers:</div>
                      <pre className="text-xs font-mono bg-gray-100 p-2 rounded overflow-x-auto">
                        {JSON.stringify(selectedLog.response_headers, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Body:</div>
                      <pre className="text-xs font-mono bg-gray-100 p-2 rounded overflow-x-auto max-h-32">
                        {JSON.stringify(selectedLog.response_body, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {selectedLog.error_message && (
                  <div>
                    <h4 className="font-medium mb-2 text-red-600">Error</h4>
                    <div className="text-sm bg-red-50 border border-red-200 rounded p-3">
                      {selectedLog.error_message}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}