import { useState, useCallback, useEffect } from 'react';
import {
  WebhookConfiguration,
  WebhookRegistrationRequest,
  WebhookRegistrationResponse,
  WebhookStatusResponse,
  WebhookDeliveryLog,
  IntegrationSource,
  DeliveryStatus,
} from '@the-new-fuse/types';

export interface WebhookManagementState {
  configurations: WebhookConfiguration[];
  deliveryLogs: WebhookDeliveryLog[];
  loading: boolean;
  error: string | null;
}

export function useWebhookManagement() {
  const [state, setState] = useState<WebhookManagementState>({
    configurations: [],
    deliveryLogs: [],
    loading: false,
    error: null,
  });

  const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }, []);

  const handleApiError = useCallback((error: Error | unknown, action: string) => {
    console.error(`Failed to ${action}:`, error);
    const errorMessage = error instanceof Error ? error.message : `Failed to ${action}`;
    setState(prev => ({ ...prev, error: errorMessage, loading: false }));
    throw error;
  }, []);

  const registerWebhook = useCallback(async (
    request: WebhookRegistrationRequest
  ): Promise<WebhookRegistrationResponse> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch(`${apiBaseUrl}/webhooks/register`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: WebhookRegistrationResponse = await response.json();
      
      // Refresh configurations after successful registration
      await loadConfigurations();
      
      setState(prev => ({ ...prev, loading: false }));
      return result;
    } catch (error) {
      handleApiError(error, 'register webhook');
      throw error;
    }
  }, [apiBaseUrl, getAuthHeaders, handleApiError]);

  const getWebhookStatus = useCallback(async (
    webhookId: string
  ): Promise<WebhookStatusResponse> => {
    try {
      const response = await fetch(`${apiBaseUrl}/webhooks/status/${webhookId}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      handleApiError(error, 'get webhook status');
      throw error;
    }
  }, [apiBaseUrl, getAuthHeaders, handleApiError]);

  const retryFailedEvent = useCallback(async (eventId: string): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch(`${apiBaseUrl}/webhooks/events/${eventId}/retry`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Refresh delivery logs after retry
      await loadDeliveryLogs();
      
      setState(prev => ({ ...prev, loading: false }));
    } catch (error) {
      handleApiError(error, 'retry failed event');
    }
  }, [apiBaseUrl, getAuthHeaders, handleApiError]);

  const loadConfigurations = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Note: This endpoint would need to be implemented in the backend
      const response = await fetch(`${apiBaseUrl}/webhooks/configurations`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const configurations: WebhookConfiguration[] = await response.json();
      setState(prev => ({ ...prev, configurations, loading: false }));
    } catch (error) {
      handleApiError(error, 'load webhook configurations');
    }
  }, [apiBaseUrl, getAuthHeaders, handleApiError]);

  const loadDeliveryLogs = useCallback(async (webhookId?: string): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const url = webhookId 
        ? `${apiBaseUrl}/webhooks/${webhookId}/delivery-logs`
        : `${apiBaseUrl}/webhooks/delivery-logs`;
      
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const deliveryLogs: WebhookDeliveryLog[] = await response.json();
      setState(prev => ({ ...prev, deliveryLogs, loading: false }));
    } catch (error) {
      handleApiError(error, 'load delivery logs');
    }
  }, [apiBaseUrl, getAuthHeaders, handleApiError]);

  const deleteWebhook = useCallback(async (webhookId: string): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch(`${apiBaseUrl}/webhooks/${webhookId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Remove from local state
      setState(prev => ({
        ...prev,
        configurations: prev.configurations.filter(config => config.id !== webhookId),
        loading: false,
      }));
    } catch (error) {
      handleApiError(error, 'delete webhook');
    }
  }, [apiBaseUrl, getAuthHeaders, handleApiError]);

  const updateWebhook = useCallback(async (
    webhookId: string,
    updates: Partial<WebhookConfiguration>
  ): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch(`${apiBaseUrl}/webhooks/${webhookId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const updatedConfig: WebhookConfiguration = await response.json();
      
      // Update local state
      setState(prev => ({
        ...prev,
        configurations: prev.configurations.map(config =>
          config.id === webhookId ? updatedConfig : config
        ),
        loading: false,
      }));
    } catch (error) {
      handleApiError(error, 'update webhook');
    }
  }, [apiBaseUrl, getAuthHeaders, handleApiError]);

  const testWebhook = useCallback(async (
    webhookId: string,
    testPayload?: Record<string, unknown>
  ): Promise<{ success: boolean; response?: unknown; error?: string }> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch(`${apiBaseUrl}/webhooks/${webhookId}/test`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ payload: testPayload }),
      });

      const result = await response.json();
      setState(prev => ({ ...prev, loading: false }));
      
      return {
        success: response.ok,
        response: result,
        error: response.ok ? undefined : result.message || 'Test failed',
      };
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Test failed',
      };
    }
  }, [apiBaseUrl, getAuthHeaders]);

  const getIntegrationStats = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/webhooks/stats`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      handleApiError(error, 'get integration stats');
      throw error;
    }
  }, [apiBaseUrl, getAuthHeaders, handleApiError]);

  // Helper functions for filtering and grouping
  const getConfigurationsBySource = useCallback((source: IntegrationSource) => {
    return state.configurations.filter(config => config.source === source);
  }, [state.configurations]);

  const getActiveConfigurations = useCallback(() => {
    return state.configurations.filter(config => config.is_active);
  }, [state.configurations]);

  const getRecentDeliveryLogs = useCallback((limit: number = 50) => {
    return state.deliveryLogs
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }, [state.deliveryLogs]);

  const getFailedDeliveries = useCallback(() => {
    return state.deliveryLogs.filter(log => log.delivery_status === DeliveryStatus.FAILED);
  }, [state.deliveryLogs]);

  // Load initial data
  useEffect(() => {
    loadConfigurations();
    loadDeliveryLogs();
  }, [loadConfigurations, loadDeliveryLogs]);

  return {
    ...state,
    // Actions
    registerWebhook,
    getWebhookStatus,
    retryFailedEvent,
    loadConfigurations,
    loadDeliveryLogs,
    deleteWebhook,
    updateWebhook,
    testWebhook,
    getIntegrationStats,
    // Helpers
    getConfigurationsBySource,
    getActiveConfigurations,
    getRecentDeliveryLogs,
    getFailedDeliveries,
  };
}