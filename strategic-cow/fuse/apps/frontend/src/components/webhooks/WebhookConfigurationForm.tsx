// @ts-nocheck
import { IntegrationSource, WebhookRegistrationRequest } from '@the-new-fuse/types';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  Textarea,
} from '@the-new-fuse/ui-consolidated';
import { AlertCircle, CheckCircle, Eye, EyeOff, Loader2, Save, TestTube, X } from 'lucide-react';
import React, { useState } from 'react';
import { useWebhookManagement } from './hooks/useWebhookManagement';

export interface WebhookConfigurationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  editingWebhook?: {
    id: string;
    source: IntegrationSource;
    endpoint_url: string;
    secret_key: string;
    configuration: Record<string, unknown>;
  };
  className?: string;
}

const INTEGRATION_SOURCES = [
  { value: IntegrationSource.STRIPE, label: 'Stripe', description: 'Payment processing' },
  { value: IntegrationSource.PAYPAL, label: 'PayPal', description: 'Payment processing' },
  { value: IntegrationSource.SALESFORCE, label: 'Salesforce', description: 'CRM and sales' },
  { value: IntegrationSource.HUBSPOT, label: 'HubSpot', description: 'CRM and marketing' },
  { value: IntegrationSource.PIPEDRIVE, label: 'Pipedrive', description: 'Sales CRM' },
  { value: IntegrationSource.SQUARE, label: 'Square', description: 'Point of sale' },
  { value: IntegrationSource.NETSUITE, label: 'NetSuite', description: 'ERP system' },
  { value: IntegrationSource.SAP, label: 'SAP', description: 'Enterprise software' },
  { value: IntegrationSource.QUICKBOOKS, label: 'QuickBooks', description: 'Accounting' },
  { value: IntegrationSource.ZAPIER, label: 'Zapier', description: 'Automation platform' },
  { value: IntegrationSource.WORKATO, label: 'Workato', description: 'Integration platform' },
  {
    value: IntegrationSource.POWER_AUTOMATE,
    label: 'Power Automate',
    description: 'Microsoft automation',
  },
];

export function WebhookConfigurationForm({
  onSuccess,
  onCancel,
  editingWebhook,
  className,
}: WebhookConfigurationFormProps) {
  const { registerWebhook, updateWebhook, testWebhook, loading } = useWebhookManagement();

  const [formData, setFormData] = useState({
    source: editingWebhook?.source || IntegrationSource.STRIPE,
    endpoint_url: editingWebhook?.endpoint_url || '',
    secret_key: editingWebhook?.secret_key || '',
    configuration: editingWebhook?.configuration || {},
  });

  const [showSecret, setShowSecret] = useState(false);
  const [configJson, setConfigJson] = useState(
    JSON.stringify(editingWebhook?.configuration || {}, null, 2)
  );
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedSource = INTEGRATION_SOURCES.find((s) => s.value === formData.source);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.endpoint_url.trim()) {
      newErrors.endpoint_url = 'Endpoint URL is required';
    } else if (!formData.endpoint_url.startsWith('https://')) {
      newErrors.endpoint_url = 'Endpoint URL must use HTTPS';
    }

    if (!formData.secret_key.trim()) {
      newErrors.secret_key = 'Secret key is required';
    } else if (formData.secret_key.length < 8) {
      newErrors.secret_key = 'Secret key must be at least 8 characters';
    }

    try {
      const config = JSON.parse(configJson);
      if (typeof config !== 'object' || config === null) {
        newErrors.configuration = 'Configuration must be a valid JSON object';
      }
    } catch (error) {
      console.error('JSON parsing error:', error);
      newErrors.configuration = 'Configuration must be valid JSON';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const configuration = JSON.parse(configJson);
      const requestData: WebhookRegistrationRequest = {
        source: formData.source,
        endpoint_url: formData.endpoint_url,
        secret_key: formData.secret_key,
        configuration,
      };

      if (editingWebhook) {
        await updateWebhook(editingWebhook.id, requestData);
      } else {
        await registerWebhook(requestData);
      }

      onSuccess?.();
    } catch (error) {
      console.error('Failed to save webhook:', error);
    }
  };

  const handleTest = async () => {
    if (!editingWebhook) {
      setTestResult({
        success: false,
        message: 'Save the webhook first to test it',
      });
      return;
    }

    try {
      const result = await testWebhook(editingWebhook.id, {
        test: true,
        timestamp: new Date().toISOString(),
      });

      setTestResult({
        success: result.success,
        message: result.success ? 'Webhook test successful!' : result.error || 'Test failed',
      });
    } catch (error) {
      console.error('Test webhook error:', error);
      setTestResult({
        success: false,
        message: 'Failed to test webhook',
      });
    }
  };

  const generateWebhookUrl = (): string => {
    const baseUrl = process.env.REACT_APP_API_URL || 'https://api.example.com';
    return `${baseUrl}/webhooks/incoming/${formData.source}`;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{editingWebhook ? 'Edit' : 'Add'} Webhook Integration</span>
          <div className="flex items-center space-x-2">
            {editingWebhook && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTest}
                disabled={loading}
              >
                <TestTube className="w-4 h-4 mr-2" />
                Test
              </Button>
            )}
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Integration Source */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Integration Source</label>
            <Select
              value={formData.source}
              onValueChange={(value: IntegrationSource) =>
                setFormData({ ...formData, source: value })
              }
            >
              {INTEGRATION_SOURCES.map((source) => (
                <option key={source.value} value={source.value}>
                  {source.label} - {source.description}
                </option>
              ))}
            </Select>
            {selectedSource && (
              <p className="text-xs text-muted-foreground">
                Configure webhooks for {selectedSource.label} integration
              </p>
            )}
          </div>

          {/* Webhook URL (Read-only) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Webhook URL</label>
            <div className="relative">
              <Input value={generateWebhookUrl()} readOnly className="bg-gray-50 pr-16" />
              <Badge className="absolute right-2 top-2 text-xs">Auto-generated</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Use this URL in your {selectedSource?.label} webhook configuration
            </p>
          </div>

          {/* Endpoint URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Endpoint URL</label>
            <Input
              placeholder="https://your-app.com/webhook-handler"
              value={formData.endpoint_url}
              onChange={(e) => setFormData({ ...formData, endpoint_url: e.target.value })}
              className={errors.endpoint_url ? 'border-red-500' : ''}
            />
            {errors.endpoint_url && <p className="text-xs text-red-600">{errors.endpoint_url}</p>}
            <p className="text-xs text-muted-foreground">
              Where we&apos;ll forward the webhook events
            </p>
          </div>

          {/* Secret Key */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Secret Key</label>
            <div className="relative">
              <Input
                type={showSecret ? 'text' : 'password'}
                placeholder="Enter a secure secret key"
                value={formData.secret_key}
                onChange={(e) => setFormData({ ...formData, secret_key: e.target.value })}
                className={errors.secret_key ? 'border-red-500' : ''}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1 h-8 w-8 p-0"
                onClick={() => setShowSecret(!showSecret)}
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.secret_key && <p className="text-xs text-red-600">{errors.secret_key}</p>}
            <p className="text-xs text-muted-foreground">Used to verify webhook authenticity</p>
          </div>

          {/* Configuration JSON */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Configuration (JSON)</label>
            <Textarea
              placeholder='{"timeout": 30, "retries": 3}'
              value={configJson}
              onChange={(e) => setConfigJson(e.target.value)}
              rows={6}
              className={`font-mono text-sm ${errors.configuration ? 'border-red-500' : ''}`}
            />
            {errors.configuration && <p className="text-xs text-red-600">{errors.configuration}</p>}
            <p className="text-xs text-muted-foreground">
              Additional configuration options (optional)
            </p>
          </div>

          {/* Test Result */}
          {testResult && (
            <Alert
              className={
                testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }
            >
              <div className="flex items-center">
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                )}
                <span className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                  {testResult.message}
                </span>
              </div>
            </Alert>
          )}

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {editingWebhook ? 'Update' : 'Create'} Webhook
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
