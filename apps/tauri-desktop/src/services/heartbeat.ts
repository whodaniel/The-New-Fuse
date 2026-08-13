/**
 * Heartbeat Service for Tauri Desktop
 * Connects to the Cloud Sandbox and monitors agent health via WebSocket
 */

import { EventEmitter } from 'events';
import { safeStorage } from '../lib/safeStorage';

export interface AgentHealth {
  agentId: string;
  status: 'active' | 'idle' | 'stalled' | 'failed';
  lastHeartbeat: Date;
  lastActivity: Date;
  isHealthy: boolean;
  currentTask?: string;
}

export interface StagnationAlert {
  agentId: string;
  taskId: string;
  stagnationType: 'no_heartbeat' | 'no_progress' | 'circular_communication' | 'timeout';
  detectedAt: Date;
  duration: number;
  severity: 'warning' | 'critical' | 'emergency';
}

export interface SystemHealth {
  totalAgents: number;
  activeAgents: number;
  stalledAgents: number;
  failedAgents: number;
  activeAlerts: number;
  criticalAlerts: number;
  emergencyAlerts: number;
  averageResponseTime: number;
  lastUpdate: Date;
}

export class HeartbeatClientService extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private systemHealth: SystemHealth = {
    totalAgents: 0,
    activeAgents: 0,
    stalledAgents: 0,
    failedAgents: 0,
    activeAlerts: 0,
    criticalAlerts: 0,
    emergencyAlerts: 0,
    averageResponseTime: 0,
    lastUpdate: new Date(),
  };
  private agents: Map<string, AgentHealth> = new Map();
  private alerts: StagnationAlert[] = [];

  constructor(private cloudSandboxUrl: string = '') {
    super();
  }

  /**
   * Connect to the Cloud Sandbox WebSocket for heartbeat monitoring
   */
  async connect(url?: string): Promise<void> {
    const wsUrl = url || this.cloudSandboxUrl || this.detectCloudSandboxUrl();

    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('[HeartbeatClient] Already connected');
      return;
    }

    console.log(`[HeartbeatClient] Connecting to ${wsUrl}...`);

    try {
      this.ws = new WebSocket(wsUrl);
      this.setupEventHandlers();
    } catch (error) {
      console.error('[HeartbeatClient] Connection failed:', error);
      this.handleReconnect();
    }
  }

  /**
   * Detect the Cloud Sandbox URL based on environment
   */
  private detectCloudSandboxUrl(): string {
    // Check for stored URL first
    const storedUrl = safeStorage.getItem('cloudSandboxUrl');
    if (storedUrl) {
      // Ensure the heartbeat path is appended
      if (!storedUrl.includes('/ws/heartbeat')) {
        return storedUrl.replace(/\/?$/, '/ws/heartbeat');
      }
      return storedUrl;
    }

    // Default to CloudRuntime production URL
    return 'wss://api-gateway-241337102384.us-central1.run.app/ws/heartbeat';
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('[HeartbeatClient] Connected to Cloud Sandbox');
      this.reconnectAttempts = 0;
      this.emit('connected');

      // Request initial status
      this.requestSystemHealth();

      // Start periodic health checks
      this.startPeriodicHealthCheck();
    };

    this.ws.onclose = (event) => {
      console.log('[HeartbeatClient] Connection closed', event.code, event.reason);
      this.cleanup();
      this.emit('disconnected', { code: event.code, reason: event.reason });

      if (!event.wasClean) {
        this.handleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('[HeartbeatClient] WebSocket error:', error);
      this.emit('error', error);
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('[HeartbeatClient] Failed to parse message:', error);
      }
    };
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: { type: string; payload: any }): void {
    switch (message.type) {
      case 'system_health':
        this.updateSystemHealth(message.payload);
        break;

      case 'agent_registered':
        this.handleAgentRegistered(message.payload);
        break;

      case 'heartbeat_received':
        this.handleHeartbeatReceived(message.payload);
        break;

      case 'stagnation_detected':
        this.handleStagnationDetected(message.payload);
        break;

      case 'stagnation_cleared':
        this.handleStagnationCleared(message.payload);
        break;

      case 'agent_status_changed':
        this.handleAgentStatusChanged(message.payload);
        break;

      case 'human_intervention_required':
        this.handleHumanInterventionRequired(message.payload);
        break;

      default:
        console.log('[HeartbeatClient] Unknown message type:', message.type);
    }
  }

  /**
   * Update system health status
   */
  private updateSystemHealth(health: Partial<SystemHealth>): void {
    this.systemHealth = {
      ...this.systemHealth,
      ...health,
      lastUpdate: new Date(),
    };
    this.emit('system_health_updated', this.systemHealth);
  }

  /**
   * Handle agent registration
   */
  private handleAgentRegistered(data: { agentId: string }): void {
    const agent: AgentHealth = {
      agentId: data.agentId,
      status: 'active',
      lastHeartbeat: new Date(),
      lastActivity: new Date(),
      isHealthy: true,
    };
    this.agents.set(data.agentId, agent);
    this.emit('agent_registered', agent);
  }

  /**
   * Handle heartbeat received
   */
  private handleHeartbeatReceived(data: { agentId: string; taskId?: string }): void {
    const agent = this.agents.get(data.agentId);
    if (agent) {
      agent.lastHeartbeat = new Date();
      agent.lastActivity = new Date();
      agent.status = 'active';
      agent.isHealthy = true;
      if (data.taskId) {
        agent.currentTask = data.taskId;
      }
      this.emit('heartbeat', agent);
    }
  }

  /**
   * Handle stagnation detection
   */
  private handleStagnationDetected(alert: StagnationAlert): void {
    this.alerts.push(alert);

    const agent = this.agents.get(alert.agentId);
    if (agent) {
      agent.status = 'stalled';
      agent.isHealthy = false;
    }

    this.emit('stagnation_detected', alert);

    // Emit visual alert for critical/emergency
    if (alert.severity === 'critical' || alert.severity === 'emergency') {
      this.emit('critical_alert', alert);
    }
  }

  /**
   * Handle stagnation cleared
   */
  private handleStagnationCleared(data: { agentId: string }): void {
    this.alerts = this.alerts.filter((a) => a.agentId !== data.agentId);

    const agent = this.agents.get(data.agentId);
    if (agent) {
      agent.status = 'active';
      agent.isHealthy = true;
    }

    this.emit('stagnation_cleared', data.agentId);
  }

  /**
   * Handle agent status change
   */
  private handleAgentStatusChanged(data: {
    agentId: string;
    newStatus: AgentHealth['status'];
  }): void {
    const agent = this.agents.get(data.agentId);
    if (agent) {
      agent.status = data.newStatus;
      agent.isHealthy = data.newStatus === 'active';
      this.emit('agent_status_changed', agent);
    }
  }

  /**
   * Handle human intervention required
   */
  private handleHumanInterventionRequired(data: {
    agentId: string;
    alert: StagnationAlert;
    message: string;
  }): void {
    this.emit('human_intervention_required', data);

    // Show desktop notification if available
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🚨 Agent Requires Attention', {
        body: data.message,
        icon: '/favicon.ico',
      });
    }
  }

  /**
   * Request current system health
   */
  requestSystemHealth(): void {
    this.send('get_system_health');
  }

  /**
   * Request health for specific agent
   */
  requestAgentHealth(agentId: string): void {
    this.send('get_agent_health', { agentId });
  }

  /**
   * Start periodic health check requests
   */
  private startPeriodicHealthCheck(): void {
    this.stopPeriodicHealthCheck();

    this.heartbeatInterval = setInterval(() => {
      this.requestSystemHealth();
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop periodic health checks
   */
  private stopPeriodicHealthCheck(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Send message to server
   */
  private send(type: string, payload?: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  /**
   * Handle reconnection
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[HeartbeatClient] Max reconnection attempts reached');
      this.emit('max_reconnect_attempts');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    console.log(
      `[HeartbeatClient] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`
    );

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    this.stopPeriodicHealthCheck();

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  /**
   * Disconnect from the server
   */
  disconnect(): void {
    this.cleanup();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempts = 0;
  }

  /**
   * Get current system health
   */
  getSystemHealth(): SystemHealth {
    return { ...this.systemHealth };
  }

  /**
   * Get all agents
   */
  getAgents(): AgentHealth[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get active alerts
   */
  getAlerts(): StagnationAlert[] {
    return [...this.alerts];
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Create singleton instance
export const heartbeatClient = new HeartbeatClientService();
