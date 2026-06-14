"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitorBridge = void 0;
const index_js_1 = require("./index.js");
// ============================================================
// MONITOR BRIDGE
// ============================================================
class MonitorBridge extends index_js_1.BaseBridge {
    constructor() {
        super('monitor-bridge');
        this.agents = new Map();
        this.alerts = [];
        this.alertConfigs = new Map();
        this.alertCooldowns = new Map();
        this.metrics = [];
        this.maxMetricsSize = 10000;
        this.monitorInterval = null;
        this.monitorIntervalMs = 5000;
        this.registerDefaultAlerts();
    }
    async connect() {
        this.emit('connecting');
        this.startMonitoring();
        this.isConnected = true;
        this.emit('connected');
    }
    async disconnect() {
        this.stopMonitoring();
        this.isConnected = false;
        this.emit('disconnected');
    }
    async sendMessage(message, messageType = index_js_1.MessageType.COMMAND, priority = index_js_1.Priority.MEDIUM) {
        const action = message.action;
        switch (action) {
            case 'register-agent':
                this.registerAgent(message.agent);
                break;
            case 'update-agent':
                this.updateAgent(message.agentId, message.updates);
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
    registerAgent(agent) {
        if (!agent.agentId)
            return;
        const fullAgent = {
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
    updateAgent(agentId, updates) {
        const agent = this.agents.get(agentId);
        if (!agent)
            return;
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
    recordHeartbeat(agentId) {
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
    getAllAgents() {
        return Array.from(this.agents.values());
    }
    /**
     * Get agent by ID
     */
    getAgent(agentId) {
        return this.agents.get(agentId);
    }
    /**
     * Get agents by status
     */
    getAgentsByStatus(status) {
        return Array.from(this.agents.values()).filter((a) => a.status === status);
    }
    // ============================================================
    // ALERTING
    // ============================================================
    /**
     * Register an alert configuration
     */
    registerAlertConfig(config) {
        this.alertConfigs.set(config.id, config);
        this.emit('alert:config:registered', config);
    }
    /**
     * Check alerts for an agent
     */
    checkAlerts(agent) {
        for (const [configId, config] of this.alertConfigs) {
            // Check cooldown
            const lastTriggered = this.alertCooldowns.get(`${configId}:${agent.agentId}`);
            if (lastTriggered) {
                const elapsed = Date.now() - lastTriggered.getTime();
                if (elapsed < config.cooldownMs)
                    continue;
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
    async triggerAlert(config, agent) {
        const alert = {
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
            }
            catch (error) {
                this.emit('alert:action:error', { alert, error });
            }
        }
    }
    /**
     * Acknowledge an alert
     */
    acknowledgeAlert(alertId) {
        const alert = this.alerts.find((a) => a.id === alertId);
        if (alert) {
            alert.acknowledged = true;
            this.emit('alert:acknowledged', alert);
        }
    }
    /**
     * Get active (unacknowledged) alerts
     */
    getActiveAlerts() {
        return this.alerts.filter((a) => !a.acknowledged);
    }
    /**
     * Get all alerts
     */
    getAllAlerts() {
        return [...this.alerts];
    }
    /**
     * Register default alert configurations
     */
    registerDefaultAlerts() {
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
                if (total < 10)
                    return false;
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
    recordMetric(metric) {
        const fullMetric = {
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
    getMetrics(name, limit = 100) {
        return this.metrics.filter((m) => m.name === name).slice(-limit);
    }
    // ============================================================
    // MONITORING LOOP
    // ============================================================
    /**
     * Start monitoring
     */
    startMonitoring() {
        if (this.monitorInterval)
            return;
        this.monitorInterval = setInterval(() => {
            this.checkAgentHealth();
        }, this.monitorIntervalMs);
    }
    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
        }
    }
    /**
     * Check health of all agents
     */
    checkAgentHealth() {
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
    getStatistics() {
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
exports.MonitorBridge = MonitorBridge;
exports.default = MonitorBridge;
//# sourceMappingURL=monitor_bridge.js.map