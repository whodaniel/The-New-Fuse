import * as vscode from 'vscode';
import { getLogger,  Logger  } from '../core/logging.js';
import { TelemetryService } from '../core/telemetry.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * AgentMetrics holds monitoring data for AI agents, including tool usage,
 * response times, errors, and active agent tracking.
 */
export interface AgentMetrics {
  toolUsage: Map<string, number>;
  responseTime: number[];
  errorCount: number;
  activeAgents: string[];
  // New metrics for enhanced monitoring
  toolSuccessRate: Map<string, { success: number, failure: number }>;
  responseTimeByTool: Map<string, number[]>;
  activeToolExecutions: Map<string, { startTime: number, toolId: string }>;
  mostRecentTools: { agentId: string, toolId: string, timestamp: number, success: boolean }[];
}

/**
 * Status of an agent
 */
export enum AgentStatus {
  ACTIVE = 'active',
  IDLE = 'idle',
  ERROR = 'error'
}

/**
 * Interface for tool execution tracking
 */
export interface ToolExecution {
  agentId: string;
  toolId: string;
  startTime: number;
  endTime?: number;
  success?: boolean;
  error?: Error;
  metadata?: Record<string, any>;
  traceId?: string;
}

/**
 * AgentMonitor provides singleton monitoring for all AI agents.
 */
export class AgentMonitor {
  private static instance: AgentMonitor;
  private metrics: AgentMetrics;
  private logger: Logger;
  private telemetry: TelemetryService;
  private enabled: boolean = true;
  private backendEnabled: boolean = false;
  private backendUrl: string = '';
  private eventQueue: any[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  
  private constructor() {
    this.logger = Logger.getInstance();
    this.telemetry = TelemetryService.getInstance();
    this.metrics = {
      toolUsage: new Map(),
      responseTime: [],
      errorCount: 0,
      activeAgents: [],
      // Initialize new metrics
      toolSuccessRate: new Map(),
      responseTimeByTool: new Map(),
      activeToolExecutions: new Map(),
      mostRecentTools: []
    };
    
    // Initialize settings
    this.loadSettings();
    
    // Start flush interval if backend is enabled
    if (this.backendEnabled) {
      this.startFlushInterval();
    }
    
    // Listen to configuration changes
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('theFuse')) {
        this.loadSettings();
      }
    });
  }

  /**
   * Load settings from VS Code configuration
   */
  private loadSettings(): void {
    const config = vscode.workspace.getConfiguration('theFuse');
    this.enabled = config.get<boolean>('agentMonitoringEnabled', true);
    this.backendEnabled = config.get<boolean>('telemetryBackendEnabled', false);
    this.backendUrl = config.get<string>('telemetryBackendUrl', 'http://localhost:3000/api/telemetry');
    
    // If backend was just enabled, start flush interval
    if (this.backendEnabled && !this.flushInterval) {
      this.startFlushInterval();
    }
    // If backend was just disabled, stop flush interval
    else if (!this.backendEnabled && this.flushInterval) {
      this.stopFlushInterval();
    }
  }

  /**
   * Start the interval to flush events to the backend
   */
  private startFlushInterval(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    
    this.flushInterval = setInterval(() => {
      this.flushEvents();
    }, 5000); // Flush every 5 seconds
  }

  /**
   * Stop the flush interval
   */
  private stopFlushInterval(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  /**
   * Flush queued events to the backend
   */
  private async flushEvents(): Promise<void> {
    if (!this.backendEnabled || this.eventQueue.length === 0) {
      return;
    }
    
    try {
      const events = [...this.eventQueue];
      this.eventQueue = [];
      
      const response = await fetch(`${this.backendUrl}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ events })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send events: ${response.statusText}`);
      }
      
      const result = await response.json();
      this.logger.info('Telemetry', `Sent ${result.processed} events to telemetry backend`);
    } catch (error) {
      this.logger.error('Failed to send events to backend:', error);
      // Re-queue the events for next attempt
      this.eventQueue.push(...this.eventQueue);
    }
  }

  public static getInstance(): AgentMonitor {
    if (!AgentMonitor.instance) {
      AgentMonitor.instance = new AgentMonitor();
    }
    return AgentMonitor.instance;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    vscode.workspace.getConfiguration('theFuse').update(
      'agentMonitoringEnabled', enabled,
      vscode.ConfigurationTarget.Global
    );
  }

  public isEnabled(): boolean {
    return this.enabled;
  }
  
  /**
   * Configure backend telemetry settings
   */
  public setBackendSettings(enabled: boolean, url?: string): void {
    this.backendEnabled = enabled;
    if (url) {
      this.backendUrl = url;
    }
    
    const config = vscode.workspace.getConfiguration('theFuse');
    config.update('telemetryBackendEnabled', enabled, vscode.ConfigurationTarget.Global);
    if (url) {
      config.update('telemetryBackendUrl', url, vscode.ConfigurationTarget.Global);
    }
    
    // Handle interval based on new settings
    if (enabled && !this.flushInterval) {
      this.startFlushInterval();
    } else if (!enabled && this.flushInterval) {
      this.stopFlushInterval();
    }
  }

  /**
   * Track usage of a specific tool by an agent
   */
  public trackToolUsage(agentId: string, toolId: string, executionTime: number): void {
    if (!this.enabled) return;
    const key = `${agentId}:${toolId}`;
    const count = this.metrics.toolUsage.get(key) || 0;
    this.metrics.toolUsage.set(key, count + 1);
    this.metrics.responseTime.push(executionTime);
    this.telemetry.trackEvent('agent_tool_execution', { agentId, toolId, executionTime: executionTime.toString() });
    
    // Add to recent tools
    this.addRecentTool(agentId, toolId, true);
    
    // Add to backend queue if enabled
    if (this.backendEnabled) {
      this.queueEvent({
        id: uuidv4(),
        type: 'tool_usage',
        timestamp: Date.now(),
        source: 'vscode-extension',
        sourceId: agentId,
        metadata: {
          toolId,
          executionTime,
          success: true
        }
      });
    }
  }
  
  /**
   * Start tracking a tool execution
   */
  public startToolExecution(agentId: string, toolId: string, metadata?: Record<string, any>, traceId?: string): string {
    if (!this.enabled) return '';
    
    const executionId = uuidv4();
    const startTime = Date.now();
    
    // Track active execution
    this.metrics.activeToolExecutions.set(executionId, {
      startTime,
      toolId
    });
    
    // Queue start event if backend enabled
    if (this.backendEnabled) {
      this.queueEvent({
        id: executionId,
        type: 'tool_usage',
        timestamp: startTime,
        source: 'vscode-extension',
        sourceId: agentId,
        metadata: {
          toolId,
          stage: 'start',
          traceId,
          ...metadata
        }
      });
    }
    
    return executionId;
  }
  
  /**
   * Complete a tool execution (success or failure)
   */
  public completeToolExecution(
    executionId: string, 
    agentId: string, 
    success: boolean, 
    error?: Error,
    metadata?: Record<string, any>
  ): void {
    if (!this.enabled) return;
    
    const execution = this.metrics.activeToolExecutions.get(executionId);
    if (!execution) {
      this.logger.warn(`No active execution found for ID ${executionId}`);
      return;
    }
    
    const { toolId, startTime } = execution;
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    // Update tool usage counts
    const key = `${agentId}:${toolId}`;
    const count = this.metrics.toolUsage.get(key) || 0;
    this.metrics.toolUsage.set(key, count + 1);
    
    // Update response times
    this.metrics.responseTime.push(executionTime);
    
    // Update tool-specific response times
    const toolResponseTimes = this.metrics.responseTimeByTool.get(toolId) || [];
    toolResponseTimes.push(executionTime);
    this.metrics.responseTimeByTool.set(toolId, toolResponseTimes);
    
    // Update success rate
    const successRate = this.metrics.toolSuccessRate.get(toolId) || { success: 0, failure: 0 };
    if (success) {
      successRate.success++;
    } else {
      successRate.failure++;
    }
    this.metrics.toolSuccessRate.set(toolId, successRate);
    
    // Add to recent tools
    this.addRecentTool(agentId, toolId, success);
    
    // Remove from active executions
    this.metrics.activeToolExecutions.delete(executionId);
    
    // Track via telemetry service
    this.telemetry.trackEvent('agent_tool_execution', { 
      agentId, 
      toolId, 
      executionTime: executionTime.toString(),
      success: success.toString()
    });
    
    // Track error if applicable
    if (!success && error) {
      this.trackError(agentId, error);
    }
    
    // Queue completion event if backend enabled
    if (this.backendEnabled) {
      this.queueEvent({
        id: uuidv4(),
        type: 'tool_usage',
        timestamp: endTime,
        source: 'vscode-extension',
        sourceId: agentId,
        metadata: {
          toolId,
          executionId,
          executionTime,
          stage: 'complete',
          success,
          error: error ? error.message : undefined,
          ...metadata
        }
      });
    }
  }

  /**
   * Track an error encountered by an agent
   */
  public trackError(agentId: string, error: Error): void {
    if (!this.enabled) return;
    this.metrics.errorCount++;
    // Convert the error object to a string for the trackError method
    this.telemetry.trackError(error.message || 'Unknown error', agentId);
    
    // Queue error event if backend enabled
    if (this.backendEnabled) {
      this.queueEvent({
        id: uuidv4(),
        type: 'agent_status',
        timestamp: Date.now(),
        source: 'vscode-extension',
        sourceId: agentId,
        metadata: {
          status: AgentStatus.ERROR,
          error: error.message,
          stack: error.stack
        }
      });
    }
  }

  /**
   * Update the list of currently active agents
   */
  public updateActiveAgents(agents: string[]): void {
    if (!this.enabled) return;
    this.metrics.activeAgents = agents;
    this.telemetry.trackEvent('active_agents_updated', { count: agents.length.toString(), agents: agents.join(',') });
    
    // Queue agent status events if backend enabled
    if (this.backendEnabled) {
      for (const agentId of agents) {
        this.queueEvent({
          id: uuidv4(),
          type: 'agent_status',
          timestamp: Date.now(),
          source: 'vscode-extension',
          sourceId: agentId,
          metadata: {
            status: AgentStatus.ACTIVE
          }
        });
      }
    }
  }
  
  /**
   * Update status for a specific agent
   */
  public updateAgentStatus(agentId: string, status: AgentStatus): void {
    if (!this.enabled) return;
    
    // Update active agents list if necessary
    if (status === AgentStatus.ACTIVE) {
      if (!this.metrics.activeAgents.includes(agentId)) {
        this.metrics.activeAgents.push(agentId);
      }
    } else {
      this.metrics.activeAgents = this.metrics.activeAgents.filter(id => id !== agentId);
    }
    
    this.telemetry.trackEvent('agent_status_change', { agentId, status });
    
    // Queue agent status event if backend enabled
    if (this.backendEnabled) {
      this.queueEvent({
        id: uuidv4(),
        type: 'agent_status',
        timestamp: Date.now(),
        source: 'vscode-extension',
        sourceId: agentId,
        metadata: {
          status
        }
      });
    }
  }
  
  /**
   * Add a tool usage to the recent tools list
   */
  private addRecentTool(agentId: string, toolId: string, success: boolean): void {
    this.metrics.mostRecentTools.unshift({
      agentId,
      toolId,
      timestamp: Date.now(),
      success
    });
    
    // Keep only the 50 most recent
    if (this.metrics.mostRecentTools.length > 50) {
      this.metrics.mostRecentTools.pop();
    }
  }
  
  /**
   * Queue an event to be sent to the backend
   */
  private queueEvent(event: any): void {
    this.eventQueue.push(event);
    
    // If queue is getting large, trigger a flush
    if (this.eventQueue.length >= 50) {
      this.flushEvents();
    }
  }

  /**
   * Get the current monitoring metrics for agents
   */
  public getMetrics(): AgentMetrics {
    // return metrics even if disabled
    return this.metrics;
  }
  
  /**
   * Get success rate for a specific tool
   */
  public getToolSuccessRate(toolId: string): { success: number, failure: number, rate: number } {
    const stats = this.metrics.toolSuccessRate.get(toolId) || { success: 0, failure: 0 };
    const total = stats.success + stats.failure;
    const rate = total === 0 ? 0 : stats.success / total;
    return { ...stats, rate };
  }
  
  /**
   * Get average response time for a specific tool
   */
  public getToolAverageResponseTime(toolId: string): number {
    const times = this.metrics.responseTimeByTool.get(toolId) || [];
    if (times.length === 0) return 0;
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }
  
  /**
   * Get the most recent tool usages
   */
  public getRecentToolUsage(limit: number = 10): typeof this.metrics.mostRecentTools {
    return this.metrics.mostRecentTools.slice(0, limit);
  }
}
