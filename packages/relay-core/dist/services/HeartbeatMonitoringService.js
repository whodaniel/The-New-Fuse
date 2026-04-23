"use strict";
/**
 * Heartbeat Monitoring and Anti-Stagnation Service
 *
 * Implements robust monitoring of agent communications and workflow progress
 * Provides fallback mechanisms for stalled communications and automatic recovery
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeartbeatMonitoringService = void 0;
const events_1 = require("events");
const StubServices_js_1 = require("./shared/StubServices.js");
class HeartbeatMonitoringService extends events_1.EventEmitter {
    constructor(config, logger) {
        super();
        this.agentHeartbeats = new Map();
        this.stagnationAlerts = new Map();
        this.fallbackActions = new Map();
        this.humanNotificationQueue = [];
        this.config = config;
        this.logger = logger;
        this.handoffTemplateService = new StubServices_js_1.AgentHandoffTemplateService();
    }
    /**
     * Start heartbeat monitoring
     */
    start() {
        this.logger.info('Starting heartbeat monitoring service');
        this.monitoringInterval = setInterval(() => {
            this.performHealthCheck();
        }, this.config.intervalMs);
        this.emit('monitoring_started');
    }
    /**
     * Stop heartbeat monitoring
     */
    stop() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = undefined;
        }
        this.logger.info('Heartbeat monitoring service stopped');
        this.emit('monitoring_stopped');
    }
    /**
     * Register agent for monitoring
     */
    registerAgent(agentId, expectedResponseTime) {
        const heartbeat = {
            agentId,
            lastHeartbeat: new Date(),
            lastActivity: new Date(),
            status: 'active',
            consecutiveFailures: 0,
            expectedResponseTime
        };
        this.agentHeartbeats.set(agentId, heartbeat);
        this.logger.info(`Registered agent for heartbeat monitoring: ${agentId}`);
        this.emit('agent_registered', agentId);
    }
    /**
     * Unregister agent from monitoring
     */
    unregisterAgent(agentId) {
        if (this.agentHeartbeats.has(agentId)) {
            this.agentHeartbeats.delete(agentId);
            this.stagnationAlerts.delete(agentId);
            this.fallbackActions.delete(agentId);
            this.logger.info(`Unregistered agent from heartbeat monitoring: ${agentId}`);
            this.emit('agent_unregistered', agentId);
        }
    }
    /**
     * Record heartbeat from agent
     */
    recordHeartbeat(agentId, taskId) {
        const heartbeat = this.agentHeartbeats.get(agentId);
        if (!heartbeat) {
            this.logger.warn(`Received heartbeat from unregistered agent: ${agentId}`);
            return;
        }
        heartbeat.lastHeartbeat = new Date();
        heartbeat.lastActivity = new Date();
        heartbeat.status = 'active';
        heartbeat.consecutiveFailures = 0;
        if (taskId) {
            heartbeat.currentTask = taskId;
        }
        // Clear any existing stagnation alerts for this agent
        this.clearStagnationAlert(agentId);
        this.logger.debug(`Heartbeat recorded for agent: ${agentId}`);
        this.emit('heartbeat_received', { agentId, taskId });
    }
    /**
     * Record agent activity (task progress)
     */
    recordActivity(agentId, activityType, metadata) {
        const heartbeat = this.agentHeartbeats.get(agentId);
        if (!heartbeat) {
            this.registerAgent(agentId); // Auto-register if not found
            return this.recordActivity(agentId, activityType, metadata);
        }
        heartbeat.lastActivity = new Date();
        heartbeat.status = 'active';
        this.logger.debug(`Activity recorded for agent ${agentId}: ${activityType}`);
        this.emit('activity_recorded', { agentId, activityType, metadata });
    }
    /**
     * Perform comprehensive health check
     */
    performHealthCheck() {
        const now = new Date();
        const stagnationThreshold = this.config.stagnationThresholdMs;
        const PRUNE_THRESHOLD = 60 * 60 * 1000; // 1 hour inactivity = prune
        for (const [agentId, heartbeat] of this.agentHeartbeats.entries()) {
            const timeSinceLastHeartbeat = now.getTime() - heartbeat.lastHeartbeat.getTime();
            const timeSinceLastActivity = now.getTime() - heartbeat.lastActivity.getTime();
            // AUTO-PRUNE: If agent has been inactive for a long time, remove it to prevent memory leak
            if (timeSinceLastHeartbeat > PRUNE_THRESHOLD) {
                this.logger.info(`🧹 Auto-pruning long-inactive agent from heartbeat monitoring: ${agentId}`);
                this.unregisterAgent(agentId);
                continue;
            }
            // Check for heartbeat timeout
            if (timeSinceLastHeartbeat > this.config.timeoutMs) {
                this.handleHeartbeatTimeout(agentId, heartbeat, timeSinceLastHeartbeat);
            }
            // Check for activity stagnation
            if (timeSinceLastActivity > stagnationThreshold) {
                this.handleActivityStagnation(agentId, heartbeat, timeSinceLastActivity);
            }
            // Update status based on thresholds
            this.updateAgentStatus(agentId, heartbeat, timeSinceLastHeartbeat, timeSinceLastActivity);
        }
        // Process pending human notifications
        this.processHumanNotifications();
    }
    /**
     * Handle heartbeat timeout
     */
    handleHeartbeatTimeout(agentId, heartbeat, duration) {
        heartbeat.consecutiveFailures++;
        const alert = {
            agentId,
            taskId: heartbeat.currentTask || 'unknown',
            stagnationType: 'no_heartbeat',
            detectedAt: new Date(),
            duration,
            severity: this.calculateSeverity(duration, heartbeat.consecutiveFailures)
        };
        this.createStagnationAlert(agentId, alert);
        this.triggerFallbackMechanism(agentId, alert);
    }
    /**
     * Handle activity stagnation
     */
    handleActivityStagnation(agentId, heartbeat, duration) {
        const alert = {
            agentId,
            taskId: heartbeat.currentTask || 'unknown',
            stagnationType: 'no_progress',
            detectedAt: new Date(),
            duration,
            severity: this.calculateSeverity(duration, 0)
        };
        this.createStagnationAlert(agentId, alert);
        this.triggerFallbackMechanism(agentId, alert);
    }
    /**
     * Create stagnation alert
     */
    createStagnationAlert(agentId, alert) {
        this.stagnationAlerts.set(agentId, alert);
        this.logger.warn(`Stagnation detected: ${alert.stagnationType} for agent ${agentId} (${alert.duration}ms)`);
        this.emit('stagnation_detected', alert);
    }
    /**
     * Clear stagnation alert
     */
    clearStagnationAlert(agentId) {
        if (this.stagnationAlerts.has(agentId)) {
            this.stagnationAlerts.delete(agentId);
            this.logger.info(`Stagnation cleared for agent: ${agentId}`);
            this.emit('stagnation_cleared', agentId);
        }
    }
    /**
     * Trigger fallback mechanism based on severity
     */
    async triggerFallbackMechanism(agentId, alert) {
        const existingActions = this.fallbackActions.get(agentId) || [];
        let actionType;
        switch (alert.severity) {
            case 'warning':
                actionType = existingActions.length === 0 ? 'retry' : 'escalate';
                break;
            case 'critical':
                actionType = existingActions.length < 2 ? 'escalate' : 'reassign';
                break;
            case 'emergency':
                actionType = 'notify_human';
                break;
        }
        const action = {
            type: actionType,
            retryCount: existingActions.filter(a => a.type === actionType).length + 1,
            executedAt: new Date()
        };
        await this.executeFallbackAction(agentId, alert, action);
        existingActions.push(action);
        this.fallbackActions.set(agentId, existingActions);
    }
    /**
     * Execute specific fallback action
     */
    async executeFallbackAction(agentId, alert, action) {
        this.logger.warn(`Executing fallback action: ${action.type} for agent ${agentId}`);
        switch (action.type) {
            case 'retry':
                await this.executeRetryAction(agentId, alert);
                break;
            case 'escalate':
                await this.executeEscalationAction(agentId, alert);
                break;
            case 'reassign':
                await this.executeReassignAction(agentId, alert);
                break;
            case 'notify_human':
                await this.executeHumanNotificationAction(agentId, alert);
                break;
            case 'emergency_stop':
                await this.executeEmergencyStopAction(agentId, alert);
                break;
        }
        this.emit('fallback_action_executed', { agentId, alert, action });
    }
    /**
     * Execute retry action
     */
    async executeRetryAction(agentId, alert) {
        // Send ping/wake-up message to agent
        this.emit('agent_ping_required', {
            agentId,
            taskId: alert.taskId,
            reason: 'heartbeat_timeout_retry'
        });
        // Create reprompt using handoff template system
        const repromptData = {
            agentId,
            alertType: alert.stagnationType,
            taskId: alert.taskId,
            stagnationDuration: alert.duration,
            retryAttempt: this.fallbackActions.get(agentId)?.filter(a => a.type === 'retry').length || 1
        };
        this.emit('agent_reprompt_required', repromptData);
    }
    /**
     * Execute escalation action
     */
    async executeEscalationAction(agentId, alert) {
        // Escalate to director/broker agent
        this.emit('escalation_required', {
            originalAgent: agentId,
            taskId: alert.taskId,
            escalationReason: alert.stagnationType,
            severity: alert.severity,
            requiresDirectorIntervention: true
        });
        // Generate escalation handoff using template system
        // const escalationHandoff = await this.handoffTemplateService.createHandoffPrompt(
        //   'escalation-handoff',
        //   {
        //     originalAgentId: agentId,
        //     escalationReason: alert.stagnationType,
        //     taskId: alert.taskId,
        //     stagnationDuration: alert.duration
        //   }
        // );
        const escalationHandoff = `Escalation for agent ${agentId} due to ${alert.stagnationType}`;
        this.emit('escalation_handoff_created', {
            agentId,
            handoffPrompt: escalationHandoff
        });
    }
    /**
     * Execute reassign action
     */
    async executeReassignAction(agentId, alert) {
        // Find alternative agent for task reassignment
        this.emit('task_reassignment_required', {
            originalAgent: agentId,
            taskId: alert.taskId,
            reassignmentReason: 'stagnation_timeout',
            preserveContext: true
        });
    }
    /**
     * Execute human notification action
     */
    async executeHumanNotificationAction(agentId, alert) {
        this.humanNotificationQueue.push(alert);
        // Emit immediate notification
        this.emit('human_intervention_required', {
            agentId,
            alert,
            urgency: 'high',
            message: `Agent ${agentId} has been stalled for ${Math.round(alert.duration / 60000)} minutes`
        });
    }
    /**
     * Execute emergency stop action
     */
    async executeEmergencyStopAction(agentId, alert) {
        // Stop all activities for this agent
        this.emit('emergency_stop_required', {
            agentId,
            taskId: alert.taskId,
            reason: 'critical_stagnation',
            preserveState: true
        });
    }
    /**
     * Process queued human notifications
     */
    processHumanNotifications() {
        if (this.humanNotificationQueue.length === 0)
            return;
        // Group notifications by severity and send batch notifications
        const criticalAlerts = this.humanNotificationQueue.filter(a => a.severity === 'critical' || a.severity === 'emergency');
        if (criticalAlerts.length > 0) {
            this.emit('batch_human_notification', {
                alerts: criticalAlerts,
                priority: 'critical',
                consolidatedMessage: this.createConsolidatedNotification(criticalAlerts)
            });
        }
        // Clear processed notifications
        this.humanNotificationQueue = [];
    }
    /**
     * Create consolidated notification message
     */
    createConsolidatedNotification(alerts) {
        const agentList = alerts.map(a => a.agentId).join(', ');
        const avgDuration = Math.round(alerts.reduce((sum, a) => sum + a.duration, 0) / alerts.length / 60000);
        return `Multiple agents require intervention: ${agentList}. Average stagnation: ${avgDuration} minutes. Immediate attention needed.`;
    }
    /**
     * Update agent status based on timing thresholds
     */
    updateAgentStatus(agentId, heartbeat, timeSinceHeartbeat, timeSinceActivity) {
        let newStatus = 'active';
        if (timeSinceHeartbeat > this.config.timeoutMs * 2) {
            newStatus = 'failed';
        }
        else if (timeSinceActivity > this.config.stagnationThresholdMs) {
            newStatus = 'stalled';
        }
        else if (timeSinceActivity > this.config.timeoutMs) {
            newStatus = 'idle';
        }
        if (heartbeat.status !== newStatus) {
            heartbeat.status = newStatus;
            this.emit('agent_status_changed', { agentId, oldStatus: heartbeat.status, newStatus });
        }
    }
    /**
     * Calculate severity based on duration and failure count
     */
    calculateSeverity(duration, consecutiveFailures) {
        const minutes = duration / 60000;
        if (minutes > 30 || consecutiveFailures > 5) {
            return 'emergency';
        }
        else if (minutes > 15 || consecutiveFailures > 3) {
            return 'critical';
        }
        else {
            return 'warning';
        }
    }
    /**
     * Get monitoring status
     */
    getMonitoringStatus() {
        const agents = Array.from(this.agentHeartbeats.values());
        return {
            activeAgents: agents.filter(a => a.status === 'active').length,
            stalledAgents: agents.filter(a => a.status === 'stalled').length,
            failedAgents: agents.filter(a => a.status === 'failed').length,
            activeAlerts: this.stagnationAlerts.size,
            humanNotificationsPending: this.humanNotificationQueue.length
        };
    }
    /**
     * Get agent heartbeat details
     */
    getAgentHeartbeat(agentId) {
        return this.agentHeartbeats.get(agentId);
    }
    /**
     * Get all stagnation alerts
     */
    getStagnationAlerts() {
        return Array.from(this.stagnationAlerts.values());
    }
    /**
     * Get agent health status
     */
    async getAgentHealth(agentId) {
        const heartbeat = this.agentHeartbeats.get(agentId);
        if (!heartbeat) {
            return null;
        }
        const now = new Date();
        const timeSinceLastHeartbeat = now.getTime() - heartbeat.lastHeartbeat.getTime();
        const timeSinceLastActivity = now.getTime() - heartbeat.lastActivity.getTime();
        return {
            agentId,
            status: heartbeat.status,
            lastHeartbeat: heartbeat.lastHeartbeat,
            lastActivity: heartbeat.lastActivity,
            consecutiveFailures: heartbeat.consecutiveFailures,
            isHealthy: heartbeat.status === 'active' && timeSinceLastHeartbeat < this.config.timeoutMs,
            timeSinceLastHeartbeat,
            timeSinceLastActivity
        };
    }
    /**
     * Get overall stagnation status
     */
    async getStagnationStatus() {
        const agents = Array.from(this.agentHeartbeats.values());
        const alerts = Array.from(this.stagnationAlerts.values());
        const now = new Date();
        const responseTimes = agents
            .filter(a => a.status === 'active')
            .map(a => now.getTime() - a.lastHeartbeat.getTime());
        const averageResponseTime = responseTimes.length > 0
            ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
            : 0;
        return {
            totalAgents: agents.length,
            activeAgents: agents.filter(a => a.status === 'active').length,
            stalledAgents: agents.filter(a => a.status === 'stalled').length,
            failedAgents: agents.filter(a => a.status === 'failed').length,
            activeAlerts: alerts,
            criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
            emergencyAlerts: alerts.filter(a => a.severity === 'emergency').length,
            averageResponseTime
        };
    }
}
exports.HeartbeatMonitoringService = HeartbeatMonitoringService;
//# sourceMappingURL=HeartbeatMonitoringService.js.map