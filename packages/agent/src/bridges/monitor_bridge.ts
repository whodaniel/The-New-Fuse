/**
 * Monitor Bridge - Agent and system monitoring
 *
 * Provides monitoring capabilities for agents:
 * - Performance tracking
 * - Error monitoring
 * - Resource usage
 * - Activity logging
 * - Alerting
 */

import { BaseBridge, MessageType, Priority } from './index.js';

// ============================================================
// MONITORING TYPES
// ============================================================

export interface AgentMonitorData {
  agentId: string;
  name: string;
  status: 'active' | 'idle' | 'error' | 'offline';
  lastSeen: Date;
  metrics: {
    tasksCompleted: number;
    tasksFailed: number;
    averageLatency: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  activeTask?: string;
}

export interface AlertConfig {
  id: string;
  name: string;
  condition: (data: AgentMonitorData) => boolean;
  severity: 'info' | 'warning' | 'critical';
  cooldownMs: number;
  actions: Array<(alert: Alert) => Promise<void>>;
}

export interface Alert {
  id: string;
  configId: string;
  severity: AlertConfig['severity'];
  agentId: string;
  message: string;
  timestamp: Date;
  data: Record<string, unknown>;
  acknowledged: boolean;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags: Record<string, string>;
}

// ============================================================
// MONITOR BRIDGE
// ============================================================

export class MonitorBridge extends BaseBridge {
  private agents: Map<string, AgentMonitorData> = new Map();
  private alerts: Alert[] = [];
  private alertConfigs: Map<string, AlertConfig> = new Map();
  private alertCooldowns: Map<string, Date> = new Map();
  private metrics: PerformanceMetric[] = [];
  private maxMetricsSize = 10000;
  private monitorInterval: ReturnType<typeof setInterval> | null = null;
  private monitorIntervalMs = 5000;

  constructor() {
    super('monitor-bridge');
    this.registerDefaultAlerts();
  }

  async connect(): Promise<void> {
    this.emit('connecting');
    this.startMonitoring();
    this.isConnected = true;
    this.emit('connected');
  }

  async disconnect(): Promise<void> {
    this.stopMonitoring();
    this.isConnected = false;
    this.emit('disconnected');
  }

  async sendMessage(
    message: Record<string, unknown>,
    messageType: MessageType = MessageType.COMMAND,
    priority: Priority = Priority.MEDIUM
  ): Promise<void> {
    const action = message.action as string;

    switch (action) {
      case 'register-agent':
        this.registerAgent(message.agent as Partial<AgentMonitorData>);
        break;
      case 'update-agent':
        this.updateAgent(message.agentId as string, message.updates as Partial<AgentMonitorData>);
        break;
      case 'get-agents':
        this.emit('agents', this.getAllAgents());
        break;
      case 'get-alerts':
        this.emit('alerts', this.getActiveAlerts());
        break;
      default:
        this.emit('message', { action, message });
    }
  }

  // ============================================================
  // AGENT MONITORING
  // ============================================================

  /**
   * Register an agent for monitoring
   */
  registerAgent(agent: Partial<AgentMonitorData>): void {
    if (!agent.agentId) return;

    const fullAgent: AgentMonitorData = {
      agentId: agent.agentId,
      name: agent.name || agent.agentId,
      status: agent.status || 'idle',
      lastSeen: new Date(),
      metrics: agent.metrics || {
        tasksCompleted: 0,
        tasksFailed: 0,
        averageLatency: 0,
        memoryUsage: 0,
        cpuUsage: 0,
      },
      activeTask: agent.activeTask,
    };

    this.agents.set(agent.agentId, fullAgent);
    this.emit('agent:registered', fullAgent);
  }

  /**
   * Update agent monitoring data
   */
  updateAgent(agentId: string, updates: Partial<AgentMonitorData>): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    const updatedAgent = {
      ...agent,
      ...updates,
      lastSeen: new Date(),
      metrics: updates.metrics ? { ...agent.metrics, ...updates.metrics } : agent.metrics,
    };

    this.agents.set(agentId, updatedAgent);
    this.emit('agent:updated', updatedAgent);

    // Check alerts
    this.checkAlerts(updatedAgent);
  }

  /**
   * Record agent heartbeat
   */
  recordHeartbeat(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.lastSeen = new Date();
      agent.status = 'active';
      this.emit('agent:heartbeat', { agentId });
    }
  }

  /**
   * Get all monitored agents
   */
  getAllAgents(): AgentMonitorData[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): AgentMonitorData | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get agents by status
   */
  getAgentsByStatus(status: AgentMonitorData['status']): AgentMonitorData[] {
    return Array.from(this.agents.values()).filter((a) => a.status === status);
  }

  // ============================================================
  // ALERTING
  // ============================================================

  /**
   * Register an alert configuration
   */
  registerAlertConfig(config: AlertConfig): void {
    this.alertConfigs.set(config.id, config);
    this.emit('alert:config:registered', config);
  }

  /**
   * Check alerts for an agent
   */
  private checkAlerts(agent: AgentMonitorData): void {
    for (const [configId, config] of this.alertConfigs) {
      // Check cooldown
      const lastTriggered = this.alertCooldowns.get(`${configId}:${agent.agentId}`);
      if (lastTriggered) {
        const elapsed = Date.now() - lastTriggered.getTime();
        if (elapsed < config.cooldownMs) continue;
      }

      // Check condition
      if (config.condition(agent)) {
        this.triggerAlert(config, agent);
      }
    }
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(config: AlertConfig, agent: AgentMonitorData): Promise<void> {
    const alert: Alert = {
      id: `alert-${Date.now()}-${globalThis.crypto.randomUUID().split('-')[0]}`,
      configId: config.id,
      severity: config.severity,
      agentId: agent.agentId,
      message: `Alert: ${config.name} triggered for agent ${agent.name}`,
      timestamp: new Date(),
      data: { agent },
      acknowledged: false,
    };

    this.alerts.push(alert);
    this.alertCooldowns.set(`${config.id}:${agent.agentId}`, new Date());
    this.emit('alert:triggered', alert);

    // Execute alert actions
    for (const action of config.actions) {
      try {
        await action(alert);
      } catch (error) {
        this.emit('alert:action:error', { alert, error });
      }
    }
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.emit('alert:acknowledged', alert);
    }
  }

  /**
   * Get active (unacknowledged) alerts
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter((a) => !a.acknowledged);
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): Alert[] {
    return [...this.alerts];
  }

  /**
   * Register default alert configurations
   */
  private registerDefaultAlerts(): void {
    // Agent offline alert
    this.registerAlertConfig({
      id: 'agent-offline',
      name: 'Agent Offline',
      condition: (agent) => agent.status === 'offline',
      severity: 'warning',
      cooldownMs: 60000,
      actions: [],
    });

    // High failure rate alert
    this.registerAlertConfig({
      id: 'high-failure-rate',
      name: 'High Failure Rate',
      condition: (agent) => {
        const total = agent.metrics.tasksCompleted + agent.metrics.tasksFailed;
        if (total < 10) return false;
        return agent.metrics.tasksFailed / total > 0.3;
      },
      severity: 'critical',
      cooldownMs: 300000,
      actions: [],
    });

    // High latency alert
    this.registerAlertConfig({
      id: 'high-latency',
      name: 'High Latency',
      condition: (agent) => agent.metrics.averageLatency > 5000,
      severity: 'warning',
      cooldownMs: 120000,
      actions: [],
    });
  }

  // ============================================================
  // METRICS
  // ============================================================

  /**
   * Record a performance metric
   */
  recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: new Date(),
    };

    this.metrics.push(fullMetric);

    // Trim if too large
    if (this.metrics.length > this.maxMetricsSize) {
      this.metrics = this.metrics.slice(-this.maxMetricsSize / 2);
    }

    this.emit('metric:recorded', fullMetric);
  }

  /**
   * Get metrics by name
   */
  getMetrics(name: string, limit = 100): PerformanceMetric[] {
    return this.metrics.filter((m) => m.name === name).slice(-limit);
  }

  // ============================================================
  // MONITORING LOOP
  // ============================================================

  /**
   * Start monitoring
   */
  startMonitoring(): void {
    if (this.monitorInterval) return;

    this.monitorInterval = setInterval(() => {
      this.checkAgentHealth();
    }, this.monitorIntervalMs);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }

  /**
   * Check health of all agents
   */
  private checkAgentHealth(): void {
    const now = new Date();
    const timeout = 60000; // 60 seconds

    for (const [agentId, agent] of this.agents) {
      const elapsed = now.getTime() - agent.lastSeen.getTime();

      if (elapsed > timeout && agent.status !== 'offline') {
        this.updateAgent(agentId, { status: 'offline' });
      }
    }
  }

  // ============================================================
  // STATISTICS
  // ============================================================

  getStatistics(): {
    connected: boolean;
    agents: number;
    activeAgents: number;
    offlineAgents: number;
    alerts: number;
    activeAlerts: number;
    metricsCount: number;
  } {
    const agents = Array.from(this.agents.values());

    return {
      connected: this.isConnected,
      agents: agents.length,
      activeAgents: agents.filter((a) => a.status === 'active').length,
      offlineAgents: agents.filter((a) => a.status === 'offline').length,
      alerts: this.alerts.length,
      activeAlerts: this.getActiveAlerts().length,
      metricsCount: this.metrics.length,
    };
  }
}

export default MonitorBridge;
