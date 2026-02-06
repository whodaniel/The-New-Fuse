/**
 * MCP (Model Context Protocol) Action Trigger
 * Handles triggering actions in external systems based on business events
 */

import type { BusinessEvent } from '../types/business-events';
import type { Env } from '../types/env';
import { Logger } from '../utils/Logger';
import { retryWithBackoff } from '../utils/helpers';

interface MCPAction {
  id: string;
  name: string;
  type: MCPActionType;
  triggers: MCPTrigger[];
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  payload?: any;
  timeout: number;
  retries: number;
  enabled: boolean;
}

interface MCPTrigger {
  eventTypes: string[];
  sources: string[];
  conditions?: MCPCondition[];
  priority?: string[];
}

interface MCPCondition {
  field: string;
  operator:
    | 'equals'
    | 'not_equals'
    | 'contains'
    | 'not_contains'
    | 'greater_than'
    | 'less_than'
    | 'exists'
    | 'not_exists';
  value: any;
}

enum MCPActionType {
  WEBHOOK = 'webhook',
  API_CALL = 'api_call',
  EMAIL = 'email',
  NOTIFICATION = 'notification',
  WORKFLOW = 'workflow',
  ANALYTICS = 'analytics',
}

interface MCPActionResult {
  actionId: string;
  success: boolean;
  response?: any;
  error?: string;
  executionTime: number;
  timestamp: string;
}

export class MCPActionTrigger {
  private actions: MCPAction[] = [];

  constructor(
    private env: Env,
    private logger: Logger
  ) {
    this.loadActions();
  }

  async triggerActions(businessEvent: BusinessEvent): Promise<MCPActionResult[]> {
    const startTime = Date.now();

    try {
      this.logger.info(`Triggering MCP actions for event: ${businessEvent.type}`, {
        eventId: businessEvent.id,
        source: businessEvent.source,
      });

      // Find matching actions
      const matchingActions = this.findMatchingActions(businessEvent);

      if (matchingActions.length === 0) {
        this.logger.debug('No matching MCP actions found for event', {
          eventType: businessEvent.type,
          source: businessEvent.source,
        });
        return [];
      }

      // Execute actions in parallel
      const actionPromises = matchingActions.map((action) =>
        this.executeAction(action, businessEvent)
      );

      const results = await Promise.allSettled(actionPromises);

      // Process results
      const actionResults: MCPActionResult[] = results.map((result, index) => {
        const action = matchingActions[index];
        const executionTime = Date.now() - startTime;

        if (result.status === 'fulfilled') {
          return {
            actionId: action.id,
            success: true,
            response: result.value,
            executionTime,
            timestamp: new Date().toISOString(),
          };
        } else {
          return {
            actionId: action.id,
            success: false,
            error: result.reason instanceof Error ? result.reason.message : String(result.reason),
            executionTime,
            timestamp: new Date().toISOString(),
          };
        }
      });

      // Log results
      const successCount = actionResults.filter((r) => r.success).length;
      this.logger.info(
        `MCP action execution completed: ${successCount}/${actionResults.length} successful`,
        {
          eventId: businessEvent.id,
          totalActions: actionResults.length,
          successCount,
          totalExecutionTime: Date.now() - startTime,
        }
      );

      // Store results for analytics
      await this.storeActionResults(businessEvent, actionResults);

      return actionResults;
    } catch (error) {
      this.logger.error('Failed to trigger MCP actions:', error, {
        eventId: businessEvent.id,
        eventType: businessEvent.type,
      });
      return [];
    }
  }

  private loadActions(): void {
    // In a real implementation, this would load from configuration
    // For now, we'll define some example actions
    this.actions = [
      {
        id: 'send_welcome_email',
        name: 'Send Welcome Email',
        type: MCPActionType.EMAIL,
        triggers: [
          {
            eventTypes: ['customer_updated'],
            sources: ['*'],
            conditions: [
              {
                field: 'data.lifecycle_stage',
                operator: 'equals',
                value: 'new_customer',
              },
            ],
          },
        ],
        endpoint: 'https://api.sendgrid.com/v3/mail/send',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
        retries: 3,
        enabled: true,
      },
      {
        id: 'update_crm',
        name: 'Update CRM System',
        type: MCPActionType.API_CALL,
        triggers: [
          {
            eventTypes: ['lead_created', 'customer_updated'],
            sources: ['salesforce', 'hubspot'],
          },
        ],
        endpoint: `${this.env.CRM_API_ENDPOINT}/contacts`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.env.CRM_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
        retries: 2,
        enabled: true,
      },
      {
        id: 'payment_received_notification',
        name: 'Payment Received Notification',
        type: MCPActionType.NOTIFICATION,
        triggers: [
          {
            eventTypes: ['payment_received'],
            sources: ['stripe', 'paypal'],
            conditions: [
              {
                field: 'data.amount',
                operator: 'greater_than',
                value: 1000,
              },
            ],
          },
        ],
        endpoint: `${this.env.SLACK_WEBHOOK_URL}`,
        method: 'POST',
        timeout: 5000,
        retries: 1,
        enabled: true,
      },
      {
        id: 'invoice_analytics',
        name: 'Invoice Analytics Update',
        type: MCPActionType.ANALYTICS,
        triggers: [
          {
            eventTypes: ['invoice_generated'],
            sources: ['*'],
          },
        ],
        endpoint: `${this.env.ANALYTICS_ENDPOINT}/events`,
        method: 'POST',
        headers: {
          'X-API-Key': this.env.ANALYTICS_API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 8000,
        retries: 2,
        enabled: true,
      },
    ];
  }

  private findMatchingActions(businessEvent: BusinessEvent): MCPAction[] {
    return this.actions.filter((action) => {
      if (!action.enabled) return false;

      return action.triggers.some((trigger) => {
        // Check event type
        const eventTypeMatch =
          trigger.eventTypes.includes('*') || trigger.eventTypes.includes(businessEvent.type);

        if (!eventTypeMatch) return false;

        // Check source
        const sourceMatch =
          trigger.sources.includes('*') || trigger.sources.includes(businessEvent.source);

        if (!sourceMatch) return false;

        // Check priority if specified
        if (trigger.priority && trigger.priority.length > 0) {
          const priorityMatch = trigger.priority.includes(businessEvent.metadata.priority);
          if (!priorityMatch) return false;
        }

        // Check conditions
        if (trigger.conditions && trigger.conditions.length > 0) {
          return trigger.conditions.every((condition) =>
            this.evaluateCondition(condition, businessEvent)
          );
        }

        return true;
      });
    });
  }

  private evaluateCondition(condition: MCPCondition, businessEvent: BusinessEvent): boolean {
    const value = this.getValueByPath(businessEvent, condition.field);

    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'not_equals':
        return value !== condition.value;
      case 'contains':
        return String(value).includes(String(condition.value));
      case 'not_contains':
        return !String(value).includes(String(condition.value));
      case 'greater_than':
        return Number(value) > Number(condition.value);
      case 'less_than':
        return Number(value) < Number(condition.value);
      case 'exists':
        return value !== undefined && value !== null;
      case 'not_exists':
        return value === undefined || value === null;
      default:
        return false;
    }
  }

  private getValueByPath(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private async executeAction(action: MCPAction, businessEvent: BusinessEvent): Promise<any> {
    const startTime = Date.now();

    try {
      this.logger.mcpAction(action.name, false, 0); // Log start

      const payload = this.buildActionPayload(action, businessEvent);

      const result = await retryWithBackoff(
        () => this.makeApiCall(action, payload),
        action.retries,
        1000
      );

      const executionTime = Date.now() - startTime;
      this.logger.mcpAction(action.name, true, executionTime);

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.mcpAction(action.name, false, executionTime);

      this.logger.error(`MCP action '${action.name}' failed:`, error, {
        actionId: action.id,
        eventId: businessEvent.id,
        executionTime,
      });

      throw error;
    }
  }

  private buildActionPayload(action: MCPAction, businessEvent: BusinessEvent): any {
    switch (action.type) {
      case MCPActionType.EMAIL:
        return this.buildEmailPayload(businessEvent);
      case MCPActionType.NOTIFICATION:
        return this.buildNotificationPayload(businessEvent);
      case MCPActionType.API_CALL:
        return this.buildApiCallPayload(businessEvent);
      case MCPActionType.ANALYTICS:
        return this.buildAnalyticsPayload(businessEvent);
      default:
        return action.payload || businessEvent.data;
    }
  }

  private buildEmailPayload(businessEvent: BusinessEvent): any {
    return {
      personalizations: [
        {
          to: [
            {
              email: businessEvent.data.email || 'default@example.com',
            },
          ],
        },
      ],
      from: {
        email: 'noreply@yourcompany.com',
        name: 'Your Company',
      },
      subject: `Welcome to Our Platform!`,
      content: [
        {
          type: 'text/html',
          value: `<h1>Welcome!</h1><p>Thank you for joining our platform.</p>`,
        },
      ],
    };
  }

  private buildNotificationPayload(businessEvent: BusinessEvent): any {
    const amount = businessEvent.data.amount || businessEvent.data.revenue_amount || 0;
    return {
      text: `💰 Payment received: $${amount} from ${businessEvent.source}`,
      attachments: [
        {
          color: 'good',
          fields: [
            {
              title: 'Event ID',
              value: businessEvent.id,
              short: true,
            },
            {
              title: 'Source',
              value: businessEvent.source,
              short: true,
            },
            {
              title: 'Amount',
              value: `$${amount}`,
              short: true,
            },
          ],
        },
      ],
    };
  }

  private buildApiCallPayload(businessEvent: BusinessEvent): any {
    return {
      event_type: businessEvent.type,
      source: businessEvent.source,
      timestamp: businessEvent.timestamp,
      data: businessEvent.data,
      organization_id: businessEvent.metadata.organization_id,
    };
  }

  private buildAnalyticsPayload(businessEvent: BusinessEvent): any {
    return {
      event: businessEvent.type,
      properties: {
        source: businessEvent.source,
        organization_id: businessEvent.metadata.organization_id,
        priority: businessEvent.metadata.priority,
        ...businessEvent.data,
      },
      timestamp: businessEvent.timestamp,
    };
  }

  private async makeApiCall(action: MCPAction, payload: any): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), action.timeout);

    try {
      const response = await fetch(action.endpoint, {
        method: action.method,
        headers: action.headers || {},
        body: action.method !== 'GET' ? JSON.stringify(payload) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      try {
        return JSON.parse(responseText);
      } catch {
        return responseText;
      }
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async storeActionResults(
    businessEvent: BusinessEvent,
    results: MCPActionResult[]
  ): Promise<void> {
    try {
      const analyticsData = {
        event_id: businessEvent.id,
        event_type: businessEvent.type,
        source: businessEvent.source,
        organization_id: businessEvent.metadata.organization_id,
        actions_executed: results.length,
        successful_actions: results.filter((r) => r.success).length,
        failed_actions: results.filter((r) => !r.success).length,
        total_execution_time: results.reduce((sum, r) => sum + r.executionTime, 0),
        results: results,
        timestamp: new Date().toISOString(),
      };

      // Store in KV for analytics
      const analyticsKey = `mcp_analytics:${businessEvent.id}`;
      await this.env.KV.put(analyticsKey, JSON.stringify(analyticsData), {
        expirationTtl: 604800, // 7 days
      });

      // Send to external analytics if configured
      if (this.env.ANALYTICS_ENDPOINT) {
        await fetch(`${this.env.ANALYTICS_ENDPOINT}/mcp-actions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.env.ANALYTICS_API_KEY || '',
          },
          body: JSON.stringify(analyticsData),
        });
      }
    } catch (error) {
      this.logger.error('Failed to store MCP action results:', error);
    }
  }

  // Configuration management methods
  async addAction(action: MCPAction): Promise<void> {
    this.actions.push(action);
    await this.saveActions();
    this.logger.info(`Added MCP action: ${action.name}`, { actionId: action.id });
  }

  async updateAction(actionId: string, updates: Partial<MCPAction>): Promise<void> {
    const index = this.actions.findIndex((a) => a.id === actionId);
    if (index !== -1) {
      this.actions[index] = { ...this.actions[index], ...updates };
      await this.saveActions();
      this.logger.info(`Updated MCP action: ${actionId}`);
    }
  }

  async removeAction(actionId: string): Promise<void> {
    this.actions = this.actions.filter((a) => a.id !== actionId);
    await this.saveActions();
    this.logger.info(`Removed MCP action: ${actionId}`);
  }

  async enableAction(actionId: string): Promise<void> {
    await this.updateAction(actionId, { enabled: true });
  }

  async disableAction(actionId: string): Promise<void> {
    await this.updateAction(actionId, { enabled: false });
  }

  private async saveActions(): Promise<void> {
    try {
      await this.env.KV.put('mcp_actions_config', JSON.stringify(this.actions));
    } catch (error) {
      this.logger.error('Failed to save MCP actions configuration:', error);
    }
  }

  // Analytics and monitoring methods
  async getActionMetrics(timeframe: string = '24h'): Promise<any> {
    try {
      // Get action execution metrics
      const metrics = {
        total_actions: this.actions.length,
        enabled_actions: this.actions.filter((a) => a.enabled).length,
        disabled_actions: this.actions.filter((a) => !a.enabled).length,
        actions_by_type: this.getActionsByType(),
        recent_executions: await this.getRecentExecutions(timeframe),
      };

      return metrics;
    } catch (error) {
      this.logger.error('Failed to get action metrics:', error);
      return null;
    }
  }

  private getActionsByType(): Record<string, number> {
    const counts: Record<string, number> = {};
    this.actions.forEach((action) => {
      counts[action.type] = (counts[action.type] || 0) + 1;
    });
    return counts;
  }

  private async getRecentExecutions(_timeframe: string): Promise<any[]> {
    // In a real implementation, this would query stored execution data
    return [];
  }

  getActions(): MCPAction[] {
    return [...this.actions];
  }

  getAction(actionId: string): MCPAction | undefined {
    return this.actions.find((a) => a.id === actionId);
  }
}
