"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SSEService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSEService = void 0;
/**
 * SSE Service - Migrated to Drizzle ORM
 * Handles Server-Sent Events for real-time event streaming
 */
const common_1 = require("@nestjs/common");
const database_1 = require("@the-new-fuse/database");
let SSEService = SSEService_1 = class SSEService {
    constructor(db) {
        this.db = db;
        this.logger = new common_1.Logger(SSEService_1.name);
        this.clients = new Map();
        this.heartbeatInterval = 30000;
        this.startHeartbeatTimer();
    }
    async addClient(client) {
        this.clients.set(client.id, client);
        // Store subscription in database
        try {
            await this.db.webhooks.createSseSubscription({
                organizationId: client.organizationId,
                userId: client.userId,
                eventTypes: client.eventTypes,
                filters: client.filters,
                isActive: true,
            });
        }
        catch (error) {
            this.logger.error(`Failed to save SSE subscription: ${error}`);
        }
        // Setup connection headers
        client.response.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no',
        });
        // Send initial connection message
        this.sendEvent(client.response, {
            type: 'connected',
            data: { clientId: client.id, timestamp: new Date().toISOString() },
        });
        this.logger.log(`SSE client connected: ${client.id} (org: ${client.organizationId})`);
    }
    async removeClient(clientId) {
        const client = this.clients.get(clientId);
        if (client) {
            this.clients.delete(clientId);
            this.logger.log(`SSE client disconnected: ${clientId}`);
        }
    }
    async broadcastEvent(organizationId, event) {
        const sseEvent = {
            type: event.type,
            data: event.payload,
            id: Date.now().toString(),
        };
        let sentCount = 0;
        for (const [clientId, client] of this.clients) {
            if (client.organizationId !== organizationId)
                continue;
            // Check if client should receive this event
            if (client.eventTypes.length > 0 && !client.eventTypes.includes(event.type)) {
                continue;
            }
            try {
                this.sendEvent(client.response, sseEvent);
                sentCount++;
            }
            catch (error) {
                this.logger.error(`Failed to send event to client ${clientId}:`, error);
                this.clients.delete(clientId);
            }
        }
        if (sentCount > 0) {
            this.logger.debug(`Broadcast event "${event.type}" to ${sentCount} clients in org ${organizationId}`);
        }
    }
    async sendToClient(clientId, event) {
        const client = this.clients.get(clientId);
        if (!client) {
            throw new Error(`Client not found: ${clientId}`);
        }
        try {
            this.sendEvent(client.response, event);
        }
        catch (error) {
            this.logger.error(`Failed to send event to client ${clientId}:`, error);
            this.clients.delete(clientId);
            throw error;
        }
    }
    async sendHeartbeat() {
        const heartbeatEvent = {
            type: 'heartbeat',
            data: { timestamp: new Date().toISOString() },
        };
        for (const [clientId, client] of this.clients) {
            try {
                this.sendEvent(client.response, heartbeatEvent);
            }
            catch (error) {
                this.logger.error(`Heartbeat failed for client ${clientId}, removing`);
                this.clients.delete(clientId);
            }
        }
    }
    async sendCustomEvent(organizationId, eventType, data, filters) {
        const sseEvent = {
            type: eventType,
            data,
            id: Date.now().toString(),
        };
        for (const [clientId, client] of this.clients) {
            if (client.organizationId !== organizationId)
                continue;
            // Check event type filter
            if (client.eventTypes.length > 0 && !client.eventTypes.includes(eventType)) {
                continue;
            }
            // Check custom filters
            if (filters && Object.keys(client.filters).length > 0) {
                if (!this.matchesFilters(data, client.filters)) {
                    continue;
                }
            }
            try {
                this.sendEvent(client.response, sseEvent);
            }
            catch (error) {
                this.logger.error(`Failed to send custom event to client ${clientId}:`, error);
                this.clients.delete(clientId);
            }
        }
    }
    getConnectedClients() {
        const byOrganization = {};
        const byUser = {};
        for (const [, client] of this.clients) {
            byOrganization[client.organizationId] = (byOrganization[client.organizationId] || 0) + 1;
            if (client.userId) {
                byUser[client.userId] = (byUser[client.userId] || 0) + 1;
            }
        }
        return {
            total: this.clients.size,
            byOrganization,
            byUser,
        };
    }
    async getSubscriptionStats(organizationId) {
        let activeConnections = 0;
        const subscriptionsByType = {};
        for (const [, client] of this.clients) {
            if (client.organizationId === organizationId) {
                activeConnections++;
                for (const eventType of client.eventTypes) {
                    subscriptionsByType[eventType] = (subscriptionsByType[eventType] || 0) + 1;
                }
            }
        }
        // Get total subscriptions from database
        const subscriptions = await this.db.webhooks.findSseSubscriptionsByOrganization(organizationId);
        return {
            activeConnections,
            totalSubscriptions: subscriptions.length,
            subscriptionsByType,
        };
    }
    sendEvent(response, event) {
        const lines = [];
        if (event.id) {
            lines.push(`id: ${event.id}`);
        }
        if (event.type) {
            lines.push(`event: ${event.type}`);
        }
        if (event.retry) {
            lines.push(`retry: ${event.retry}`);
        }
        lines.push(`data: ${JSON.stringify(event.data)}`);
        lines.push('');
        lines.push('');
        response.write(lines.join('\n'));
    }
    matchesFilters(eventData, filters) {
        for (const [key, value] of Object.entries(filters)) {
            if (eventData[key] !== value) {
                return false;
            }
        }
        return true;
    }
    startHeartbeatTimer() {
        this.heartbeatTimer = setInterval(() => {
            this.sendHeartbeat().catch((error) => {
                this.logger.error('Heartbeat error:', error);
            });
            this.cleanupStaleClients().catch((error) => {
                this.logger.error('Cleanup error:', error);
            });
        }, this.heartbeatInterval);
    }
    async cleanupStaleClients() {
        const staleThreshold = 5 * 60 * 1000; // 5 minutes
        const now = Date.now();
        for (const [clientId, client] of this.clients) {
            if (now - client.connectedAt.getTime() > staleThreshold) {
                try {
                    // Try to send a test event
                    this.sendEvent(client.response, { type: 'ping', data: {} });
                }
                catch {
                    this.logger.log(`Removing stale client: ${clientId}`);
                    this.clients.delete(clientId);
                }
            }
        }
    }
    onModuleDestroy() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
        }
        // Close all connections
        for (const [clientId, client] of this.clients) {
            try {
                this.sendEvent(client.response, {
                    type: 'disconnect',
                    data: { reason: 'Server shutting down' },
                });
                client.response.end();
            }
            catch {
                // Ignore errors during shutdown
            }
        }
        this.clients.clear();
        this.logger.log('SSE service destroyed');
    }
};
exports.SSEService = SSEService;
exports.SSEService = SSEService = SSEService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.DatabaseService])
], SSEService);
//# sourceMappingURL=sse.service.js.map