var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SSEService_1;
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SseSubscription } from '../entities/sse-subscription.entity';
let SSEService = SSEService_1 = class SSEService {
    sseSubscriptionRepo;
    logger = new Logger(SSEService_1.name);
    clients = new Map();
    heartbeatInterval = 30000; // 30 seconds
    heartbeatTimer;
    constructor(sseSubscriptionRepo) {
        this.sseSubscriptionRepo = sseSubscriptionRepo;
        this.startHeartbeatTimer();
    }
    async addClient(client) {
        try {
            // Store client in memory
            this.clients.set(client.id, client);
            // Store subscription in database
            const subscription = this.sseSubscriptionRepo.create({
                clientId: client.id,
                userId: client.userId,
                organizationId: client.organizationId,
                eventTypes: client.subscriptions.flatMap(sub => sub.eventTypes),
                filters: client.subscriptions.reduce((acc, sub) => ({ ...acc, ...sub.filters }), {}),
            });
            await this.sseSubscriptionRepo.save(subscription);
            this.logger.log(`SSE client connected: ${client.id} (user: ${client.userId})`);
            // Send welcome message
            await this.sendToClient(client.id, {
                type: 'welcome',
                data: {
                    clientId: client.id,
                    timestamp: new Date().toISOString(),
                    subscriptions: client.subscriptions,
                },
            });
        }
        catch (error) {
            this.logger.error(`Failed to add SSE client ${client.id}`, error);
            throw error;
        }
    }
    async removeClient(clientId) {
        try {
            // Remove from memory
            this.clients.delete(clientId);
            // Remove from database
            await this.sseSubscriptionRepo.delete({ clientId });
            this.logger.log(`SSE client disconnected: ${clientId}`);
        }
        catch (error) {
            this.logger.error(`Failed to remove SSE client ${clientId}`, error);
        }
    }
    async broadcastEvent(event) {
        try {
            const eventMessage = {
                type: 'business_event',
                data: {
                    id: event.id,
                    type: event.type,
                    source: event.source,
                    timestamp: event.timestamp,
                    organizationId: event.metadata.organization_id,
                    data: event.data,
                },
            };
            // Get all clients that should receive this event
            const targetClients = Array.from(this.clients.values()).filter(client => this.shouldReceiveEvent(client, event));
            // Send to all matching clients
            const sendPromises = targetClients.map(client => this.sendToClient(client.id, eventMessage));
            await Promise.allSettled(sendPromises);
            this.logger.debug(`Event broadcasted to ${targetClients.length} clients: ${event.id}`);
        }
        catch (error) {
            this.logger.error('Failed to broadcast event', error);
        }
    }
    async sendToClient(clientId, event) {
        try {
            const client = this.clients.get(clientId);
            if (!client) {
                this.logger.warn(`Client not found: ${clientId}`);
                return;
            }
            const eventData = JSON.stringify(event);
            client.response.write(`data: ${eventData}\n\n`);
            // Update last heartbeat
            client.lastHeartbeat = new Date();
        }
        catch (error) {
            this.logger.error(`Failed to send event to client ${clientId}`, error);
            // Remove client if connection is broken
            await this.removeClient(clientId);
        }
    }
    async sendHeartbeat() {
        const heartbeatEvent = {
            type: 'heartbeat',
            data: { timestamp: new Date().toISOString() },
        };
        const clients = Array.from(this.clients.keys());
        const sendPromises = clients.map(clientId => this.sendToClient(clientId, heartbeatEvent));
        await Promise.allSettled(sendPromises);
    }
    async sendCustomEvent(organizationId, eventType, data, filters) {
        try {
            const customEvent = {
                type: eventType,
                data: {
                    ...data,
                    timestamp: new Date().toISOString(),
                    organizationId,
                },
            };
            // Get matching clients
            const targetClients = Array.from(this.clients.values()).filter(client => {
                if (client.organizationId !== organizationId) {
                    return false;
                }
                // Check if client is subscribed to this event type
                const hasSubscription = client.subscriptions.some(sub => sub.eventTypes.includes(eventType) || sub.eventTypes.length === 0);
                if (!hasSubscription) {
                    return false;
                }
                // Check filters if provided
                if (filters && Object.keys(filters).length > 0) {
                    return client.subscriptions.some(sub => this.matchesFilters(filters, sub.filters || {}));
                }
                return true;
            });
            // Send to matching clients
            const sendPromises = targetClients.map(client => this.sendToClient(client.id, customEvent));
            await Promise.allSettled(sendPromises);
            this.logger.debug(`Custom event sent to ${targetClients.length} clients: ${eventType}`);
        }
        catch (error) {
            this.logger.error('Failed to send custom event', error);
        }
    }
    getConnectedClients() {
        const clients = Array.from(this.clients.values());
        const byOrganization = {};
        const byUser = {};
        clients.forEach(client => {
            byOrganization[client.organizationId] = (byOrganization[client.organizationId] || 0) + 1;
            byUser[client.userId] = (byUser[client.userId] || 0) + 1;
        });
        return {
            total: clients.length,
            byOrganization,
            byUser,
        };
    }
    async getSubscriptionStats(organizationId) {
        const activeConnections = Array.from(this.clients.values())
            .filter(client => client.organizationId === organizationId).length;
        const subscriptions = await this.sseSubscriptionRepo.find({
            where: { organizationId },
        });
        const subscriptionsByType = {};
        subscriptions.forEach(sub => {
            sub.eventTypes.forEach(type => {
                subscriptionsByType[type] = (subscriptionsByType[type] || 0) + 1;
            });
        });
        return {
            activeConnections,
            totalSubscriptions: subscriptions.length,
            subscriptionsByType,
        };
    }
    shouldReceiveEvent(client, event) {
        // Check organization match
        if (client.organizationId !== event.metadata.organization_id) {
            return false;
        }
        // Check if client has any subscriptions for this event type
        return client.subscriptions.some(subscription => {
            // If no specific event types, receive all
            if (subscription.eventTypes.length === 0) {
                return true;
            }
            // Check if subscribed to this event type
            if (!subscription.eventTypes.includes(event.type)) {
                return false;
            }
            // Check filters if any
            if (subscription.filters && Object.keys(subscription.filters).length > 0) {
                return this.matchesFilters(event.data, subscription.filters);
            }
            return true;
        });
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
        this.heartbeatTimer = setInterval(async () => {
            try {
                await this.sendHeartbeat();
                await this.cleanupStaleClients();
            }
            catch (error) {
                this.logger.error('Heartbeat timer error', error);
            }
        }, this.heartbeatInterval);
    }
    async cleanupStaleClients() {
        const now = new Date();
        const staleThreshold = 60000; // 1 minute
        const staleClients = Array.from(this.clients.entries()).filter(([_, client]) => {
            const timeSinceLastHeartbeat = now.getTime() - client.lastHeartbeat.getTime();
            return timeSinceLastHeartbeat > staleThreshold;
        });
        for (const [clientId] of staleClients) {
            this.logger.warn(`Removing stale SSE client: ${clientId}`);
            await this.removeClient(clientId);
        }
        if (staleClients.length > 0) {
            this.logger.log(`Cleaned up ${staleClients.length} stale SSE clients`);
        }
    }
    onModuleDestroy() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
        }
        // Close all client connections
        for (const client of this.clients.values()) {
            try {
                client.response.end();
            }
            catch (error) {
                this.logger.error('Error closing SSE client connection', error);
            }
        }
        this.clients.clear();
        this.logger.log('SSE service shutdown complete');
    }
};
SSEService = SSEService_1 = __decorate([
    Injectable(),
    __param(0, InjectRepository(SseSubscription)),
    __metadata("design:paramtypes", [Repository])
], SSEService);
export { SSEService };
//# sourceMappingURL=sse.service.js.map