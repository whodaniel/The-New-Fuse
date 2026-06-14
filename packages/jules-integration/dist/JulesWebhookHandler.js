"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JulesWebhookHandler = void 0;
const relay_core_1 = require("@the-new-fuse/relay-core");
// Placeholder for the JulesUsageTracker
class JulesUsageTracker {
    logUsageStart(julesSessionId, taskId) {
        console.log(`Usage tracking started for session ${julesSessionId} and task ${taskId}`);
    }
    logUsageEnd(julesSessionId) {
        console.log(`Usage tracking ended for session ${julesSessionId}`);
    }
}
class JulesWebhookHandler {
    constructor(db, redisService, julesUsageTracker) {
        this.db = db;
        this.redisService = redisService;
        this.julesUsageTracker = julesUsageTracker;
    }
    async handleWebhook(payload, encodedContext) {
        const context = this.decodeContext(encodedContext);
        if (!context) {
            console.error('Invalid encoded context');
            // In a real scenario, you might throw an error to be caught by the controller
            return;
        }
        const { tenantId, taskId, conversationId } = context;
        const julesSession = await this.db.jules.findSessionByJulesSessionId(payload.sessionId);
        if (!julesSession) {
            console.warn(`Jules session not found for id: ${payload.sessionId}`);
            return;
        }
        const task = await this.db.tasks.findTaskById(taskId);
        if (!task) {
            console.error(`Task not found for id: ${taskId}`);
            return;
        }
        const newStatus = this.mapJulesStatusToSessionStatus(payload.state);
        await this.updateSessionStatus(julesSession.julesSessionId, newStatus);
        // Log usage start if it's the first webhook for the session
        if (julesSession.status === 'PENDING') {
            // Assuming a PENDING status initially
            this.julesUsageTracker.logUsageStart(payload.sessionId, task.id);
        }
        switch (payload.state) {
            case 'NEEDS_APPROVAL':
            case 'USER_INPUT_REQUIRED': {
                const message = this.buildApprovalMessage(payload, task);
                const envelope = this.createTnfEnvelope(payload, task, julesSession, message, tenantId, conversationId, true);
                await this.publishToRelay(envelope);
                break;
            }
            case 'COMPLETED': {
                this.julesUsageTracker.logUsageEnd(payload.sessionId);
                const message = this.buildCompletionMessage(payload, task);
                const envelope = this.createTnfEnvelope(payload, task, julesSession, message, tenantId, conversationId, false);
                await this.publishToRelay(envelope);
                break;
            }
            case 'FAILED': {
                this.julesUsageTracker.logUsageEnd(payload.sessionId);
                const message = this.buildFailureMessage(payload, task);
                const envelope = this.createTnfEnvelope(payload, task, julesSession, message, tenantId, conversationId, false);
                await this.publishToRelay(envelope);
                break;
            }
            case 'IN_PROGRESS':
                // Optional: Send a status update
                break;
        }
    }
    decodeContext(encodedContext) {
        try {
            const decoded = Buffer.from(encodedContext, 'base64url').toString('utf-8');
            return JSON.parse(decoded);
        }
        catch (error) {
            console.error('Failed to decode context:', error);
            return null;
        }
    }
    async updateSessionStatus(julesSessionId, status) {
        await this.db.jules.updateSessionByJulesSessionId(julesSessionId, { status });
    }
    async publishToRelay(envelope) {
        const channel = 'tnf:bus:ingress';
        try {
            await this.redisService.publish(channel, JSON.stringify(envelope));
        }
        catch (error) {
            console.error('Failed to publish to Redis:', error);
            // Implement retry logic here if necessary
        }
    }
    buildApprovalMessage(payload, task) {
        if (payload.state === 'NEEDS_APPROVAL') {
            return `🔔 Jules Session Needs Your Approval

Task: ${task.title}
Jules has created an execution plan and needs your review.

Session: https://jules.google.com/session/${payload.sessionId}

Please review and approve to continue.`;
        }
        return `⚠️ Jules Needs Clarification

Task: ${task.title}
Jules needs your input: ${payload.message}

Session: https://jules.google.com/session/${payload.sessionId}`;
    }
    buildCompletionMessage(payload, task) {
        return `✅ Jules Task Completed

Task: ${task.title}
Jules has successfully completed the work.

Session: https://jules.google.com/session/${payload.sessionId}`;
    }
    buildFailureMessage(payload, task) {
        return `❌ Jules Task Failed

Task: ${task.title}
Error: ${payload.message}

Session: https://jules.google.com/session/${payload.sessionId}`;
    }
    mapJulesStatusToSessionStatus(julesStatus) {
        const JULES_STATUS_MAP = {
            IN_PROGRESS: 'IN_PROGRESS',
            NEEDS_APPROVAL: 'NEEDS_APPROVAL',
            USER_INPUT_REQUIRED: 'USER_INPUT_REQUIRED',
            COMPLETED: 'COMPLETED',
            FAILED: 'FAILED',
        };
        return JULES_STATUS_MAP[julesStatus];
    }
    createTnfEnvelope(payload, task, julesSession, message, tenantId, conversationId, requiresAction) {
        return new relay_core_1.TNFMessageBuilder()
            .type('event')
            .from({
            agentId: `jules-agent-${tenantId}`,
            role: 'worker',
            platform: 'jules',
        })
            .to({
            agentId: julesSession.delegatedByAgentId,
        })
            .payload({ content: message })
            .context({
            sessionId: conversationId,
        })
            .metadata({
            priority: 'high',
            julesSessionUrl: `https://jules.google.com/session/${payload.sessionId}`,
            julesSessionId: payload.sessionId,
            taskId: task.id,
            requiresAction: requiresAction,
        })
            .build();
    }
}
exports.JulesWebhookHandler = JulesWebhookHandler;
