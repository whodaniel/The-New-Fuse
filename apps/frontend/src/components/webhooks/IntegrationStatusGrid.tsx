import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@the-new-fuse/ui-consolidated';
import { Button } from '@the-new-fuse/ui-consolidated';
import { Badge } from '@the-new-fuse/ui-consolidated';
import {
  Settings,
  Play,
  Pause,
  TestTube,
  Trash2,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MoreVertical,
} from 'lucide-react';
import { WebhookConfiguration, IntegrationSource } from '@the-new-fuse/types';
import { useWebhookManagement } from './hooks/useWebhookManagement';

export interface IntegrationStatusGridProps {
  configurations: WebhookConfiguration[];
  loading?: boolean;
  showActions?: boolean;
  showDetails?: boolean;
  onEdit?: (config: WebhookConfiguration) => void;
  className?: string;
}

const INTEGRATION_ICONS: Record<IntegrationSource, string> = {
  [IntegrationSource.STRIPE]: '💳',
  [IntegrationSource.PAYPAL]: '🅿️',
  [IntegrationSource.SALESFORCE]: '☁️',
  [IntegrationSource.HUBSPOT]: '🟠',
  [IntegrationSource.PIPEDRIVE]: '🔵',
  [IntegrationSource.SQUARE]: '⬜',
  [IntegrationSource.NETSUITE]: '🌐',
  [IntegrationSource.SAP]: '🔷',
  [IntegrationSource.QUICKBOOKS]: '📊',
  [IntegrationSource.ZAPIER]: '⚡',
  [IntegrationSource.WORKATO]: '🔧',
  [IntegrationSource.POWER_AUTOMATE]: '🔄',
};

const INTEGRATION_LABELS: Record<IntegrationSource, string> = {
  [IntegrationSource.STRIPE]: 'Stripe',
  [IntegrationSource.PAYPAL]: 'PayPal',
  [IntegrationSource.SALESFORCE]: 'Salesforce',
  [IntegrationSource.HUBSPOT]: 'HubSpot',
  [IntegrationSource.PIPEDRIVE]: 'Pipedrive',
  [IntegrationSource.SQUARE]: 'Square',
  [IntegrationSource.NETSUITE]: 'NetSuite',
  [IntegrationSource.SAP]: 'SAP',
  [IntegrationSource.QUICKBOOKS]: 'QuickBooks',
  [IntegrationSource.ZAPIER]: 'Zapier',
  [IntegrationSource.WORKATO]: 'Workato',
  [IntegrationSource.POWER_AUTOMATE]: 'Power Automate',
};

export function IntegrationStatusGrid({
  configurations,
  loading = false,
  showActions = false,
  showDetails = false,
  onEdit,
  className,
}: IntegrationStatusGridProps) {
  const { deleteWebhook, updateWebhook, testWebhook } = useWebhookManagement();
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const getStatusColor = (isActive: boolean, lastDeliverySuccess?: boolean) => {
    if (!isActive) return 'bg-gray-100 text-gray-800';
    if (lastDeliverySuccess === false) return 'bg-red-100 text-red-800';
    if (lastDeliverySuccess === true) return 'bg-green-100 text-green-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getStatusIcon = (isActive: boolean, lastDeliverySuccess?: boolean) => {
    if (!isActive) return <Pause className="w-4 h-4" />;
    if (lastDeliverySuccess === false) return <XCircle className="w-4 h-4" />;
    if (lastDeliverySuccess === true) return <CheckCircle className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  const getStatusText = (isActive: boolean, lastDeliverySuccess?: boolean) => {
    if (!isActive) return 'Inactive';
    if (lastDeliverySuccess === false) return 'Error';
    if (lastDeliverySuccess === true) return 'Active';
    return 'Warning';
  };

  const handleAction = async (configId: string, action: string) => {
    setActionLoading(prev => ({ ...prev, [configId]: true }));
    
    try {
      switch (action) {
        case 'toggle':
          const config = configurations.find(c => c.id === configId);
          if (config) {
            await updateWebhook(configId, { is_active: !config.is_active });
          }
          break;
        case 'test':
          await testWebhook(configId);
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this integration?')) {
            await deleteWebhook(configId);
          }
          break;
      }
    } catch (error) {
      console.error(`Failed to ${action} webhook:`, error);
    } finally {
      setActionLoading(prev => ({ ...prev, [configId]: false }));
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (configurations.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <div className="text-gray-400 text-4xl mb-4">🔗</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Integrations</h3>
          <p className="text-gray-500 mb-4">
            Get started by adding your first webhook integration
          </p>
          <Button>Add Integration</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {configurations.map((config) => (
        <Card key={config.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">
                  {INTEGRATION_ICONS[config.source] || '🔗'}
                </span>
                <div>
                  <CardTitle className="text-base">
                    {INTEGRATION_LABELS[config.source] || config.source}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {config.endpoint_url ? 
                      new URL(config.endpoint_url).hostname : 
                      'No endpoint'
                    }
                  </p>
                </div>
              </div>
              {showActions && (
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onEdit?.(config)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="space-y-3">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <Badge className={getStatusColor(config.is_active, config.last_delivery_success)}>
                  {getStatusIcon(config.is_active, config.last_delivery_success)}
                  <span className="ml-1">
                    {getStatusText(config.is_active, config.last_delivery_success)}
                  </span>
                </Badge>
                {config.endpoint_url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => window.open(config.endpoint_url, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Details */}
              {showDetails && (
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Events delivered:</span>
                    <span className="font-medium">
                      {config.events_delivered || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Success rate:</span>
                    <span className={`font-medium ${
                      (config.success_rate || 0) > 95 ? 'text-green-600' : 
                      (config.success_rate || 0) > 80 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {((config.success_rate || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  {config.last_delivery_at && (
                    <div className="flex items-center justify-between">
                      <span>Last delivery:</span>
                      <span className="font-medium">
                        {formatDate(config.last_delivery_at)}
                      </span>
                    </div>
                  )}
                  {config.created_at && (
                    <div className="flex items-center justify-between">
                      <span>Created:</span>
                      <span className="font-medium">
                        {formatDate(config.created_at)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              {showActions && (
                <div className="flex items-center space-x-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAction(config.id, 'toggle')}
                    disabled={actionLoading[config.id]}
                    className="flex-1"
                  >
                    {config.is_active ? (
                      <>
                        <Pause className="w-3 h-3 mr-1" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 mr-1" />
                        Activate
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAction(config.id, 'test')}
                    disabled={actionLoading[config.id] || !config.is_active}
                  >
                    <TestTube className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAction(config.id, 'delete')}
                    disabled={actionLoading[config.id]}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}