import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DashboardUpdate, SyncDashboardService } from './SyncDashboardService';

/**
 * Dashboard client metadata
 */
interface DashboardClientMetadata {
  userId?: string;
  tenantId?: string;
  sessionId: string;
  capabilities: string[];
  connectedAt: Date;
}

/**
 * Dashboard request payload
 */
interface DashboardRequest {
  tenantId?: string;
  userId?: string;
  type?: string;
}

/**
 * WebSocket integration for dashboard updates
 * Extends existing AgentWebSocketService functionality for dashboard clients
 */
@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  namespace: '/dashboard',
})
@Injectable()
export class DashboardWebSocketIntegration implements OnModuleInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(DashboardWebSocketIntegration.name);
  private dashboardClients = new Map<string, Socket>();
  private clientMetadata = new Map<string, DashboardClientMetadata>();
  private userSessions = new Map<string, Set<string>>(); // userId -> Set of socketIds

  constructor(private readonly dashboardService: SyncDashboardService) {}

  async onModuleInit(): Promise<void> {
    // Listen for dashboard updates from the service
    this.dashboardService.on('dashboard_update', (update: DashboardUpdate) => {
      this.broadcastDashboardUpdate(update);
    });

    this.logger.log('DashboardWebSocketIntegration initialized');
  }

  /**
   * Handle dashboard client connection
   */
  async handleConnection(@ConnectedSocket() client: Socket): Promise<void> {
    try {
      const metadata = this.extractClientMetadata(client);

      // Store client and metadata
      this.dashboardClients.set(client.id, client);
      this.clientMetadata.set(client.id, metadata);

      // Track user sessions for multi-session sync
      if (metadata.userId) {
        if (!this.userSessions.has(metadata.userId)) {
          this.userSessions.set(metadata.userId, new Set());
        }
        this.userSessions.get(metadata.userId)!.add(client.id);
      }

      // Send initial dashboard data
      const dashboardData = await this.dashboardService.getDashboardData(metadata.tenantId);
      client.emit('dashboard_data', dashboardData);

      this.logger.log(
        `Dashboard client connected: ${client.id} (user: ${metadata.userId}, tenant: ${metadata.tenantId})`
      );
    } catch (error) {
      this.logger.error('Error handling dashboard connection:', error);
      client.disconnect(true);
    }
  }

  /**
   * Handle dashboard client disconnection
   */
  async handleDisconnect(@ConnectedSocket() client: Socket): Promise<void> {
    try {
      const metadata = this.clientMetadata.get(client.id);

      // Remove from tracking
      this.dashboardClients.delete(client.id);
      this.clientMetadata.delete(client.id);

      // Remove from user sessions
      if (metadata?.userId) {
        const userSessions = this.userSessions.get(metadata.userId);
        if (userSessions) {
          userSessions.delete(client.id);
          if (userSessions.size === 0) {
            this.userSessions.delete(metadata.userId);
          }
        }
      }

      this.logger.log(`Dashboard client disconnected: ${client.id}`);
    } catch (error) {
      this.logger.error('Error handling dashboard disconnect:', error);
    }
  }

  /**
   * Handle request for dashboard data
   */
  @SubscribeMessage('get_dashboard_data')
  async handleGetDashboardData(
    @ConnectedSocket() client: Socket,
    @MessageBody() request: DashboardRequest
  ): Promise<void> {
    try {
      const metadata = this.clientMetadata.get(client.id);
      if (!metadata) {
        client.emit('error', { error: 'Client not properly registered' });
        return;
      }

      // Use tenant from request or client metadata
      const tenantId = request.tenantId || metadata.tenantId;

      const dashboardData = await this.dashboardService.getDashboardData(tenantId);
      client.emit('dashboard_data', dashboardData);
    } catch (error) {
      this.logger.error('Error getting dashboard data:', error);
      client.emit('error', { error: 'Failed to get dashboard data' });
    }
  }

  /**
   * Handle dashboard refresh request
   */
  @SubscribeMessage('refresh_dashboard')
  async handleRefreshDashboard(
    @ConnectedSocket() client: Socket,
    @MessageBody() request: DashboardRequest
  ): Promise<void> {
    try {
      const metadata = this.clientMetadata.get(client.id);
      if (!metadata) {
        client.emit('error', { error: 'Client not properly registered' });
        return;
      }

      const tenantId = request.tenantId || metadata.tenantId;
      await this.dashboardService.refreshDashboard(tenantId);

      // Send updated data
      const dashboardData = await this.dashboardService.getDashboardData(tenantId);
      client.emit('dashboard_data', dashboardData);
    } catch (error) {
      this.logger.error('Error refreshing dashboard:', error);
      client.emit('error', { error: 'Failed to refresh dashboard' });
    }
  }

  /**
   * Handle alert acknowledgment
   */
  @SubscribeMessage('acknowledge_alert')
  async handleAcknowledgeAlert(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { alertId: string }
  ): Promise<void> {
    try {
      // For now, just acknowledge locally
      // In a full implementation, this would update the alert in the database
      client.emit('alert_acknowledged', { alertId: data.alertId });

      this.logger.log(`Alert acknowledged: ${data.alertId} by client ${client.id}`);
    } catch (error) {
      this.logger.error('Error acknowledging alert:', error);
      client.emit('error', { error: 'Failed to acknowledge alert' });
    }
  }

  /**
   * Broadcast dashboard update to appropriate clients
   */
  private async broadcastDashboardUpdate(update: DashboardUpdate): Promise<void> {
    const message = {
      type: 'sync_dashboard_update',
      payload: update,
    };

    if (update.userId) {
      // Send to all sessions of specific user
      await this.sendToUserSessions(update.userId, message);
    } else if (update.tenantId) {
      // Send to all clients in tenant
      await this.broadcastToTenant(update.tenantId, message);
    } else {
      // Send to all dashboard clients
      await this.broadcastToAll(message);
    }
  }

  /**
   * Send message to all sessions of a specific user
   */
  private async sendToUserSessions(userId: string, message: any): Promise<number> {
    const userSessions = this.userSessions.get(userId);
    if (!userSessions) return 0;

    let sentCount = 0;
    for (const socketId of userSessions) {
      const client = this.dashboardClients.get(socketId);
      if (client) {
        client.emit('sync_dashboard_update', message.payload);
        sentCount++;
      }
    }

    return sentCount;
  }

  /**
   * Broadcast message to all clients in a tenant
   */
  private async broadcastToTenant(tenantId: string, message: any): Promise<number> {
    let sentCount = 0;

    for (const [socketId, metadata] of this.clientMetadata) {
      if (metadata.tenantId === tenantId) {
        const client = this.dashboardClients.get(socketId);
        if (client) {
          client.emit('sync_dashboard_update', message.payload);
          sentCount++;
        }
      }
    }

    return sentCount;
  }

  /**
   * Broadcast message to all dashboard clients
   */
  private async broadcastToAll(message: any): Promise<number> {
    let sentCount = 0;

    for (const client of this.dashboardClients.values()) {
      client.emit('sync_dashboard_update', message.payload);
      sentCount++;
    }

    return sentCount;
  }

  /**
   * Extract client metadata from socket handshake
   */
  private extractClientMetadata(client: Socket): DashboardClientMetadata {
    const query = client.handshake.query;

    return {
      userId: typeof query.userId === 'string' ? query.userId : undefined,
      tenantId: typeof query.tenantId === 'string' ? query.tenantId : undefined,
      sessionId: client.id,
      capabilities: query.capabilities
        ? typeof query.capabilities === 'string'
          ? JSON.parse(query.capabilities)
          : []
        : ['dashboard'],
      connectedAt: new Date(),
    };
  }

  /**
   * Get connected dashboard clients count
   */
  getConnectedClientsCount(): number {
    return this.dashboardClients.size;
  }

  /**
   * Get connected clients by tenant
   */
  getClientsByTenant(tenantId: string): number {
    let count = 0;
    for (const metadata of this.clientMetadata.values()) {
      if (metadata.tenantId === tenantId) {
        count++;
      }
    }
    return count;
  }

  /**
   * Get user session count
   */
  getUserSessionCount(userId: string): number {
    const sessions = this.userSessions.get(userId);
    return sessions ? sessions.size : 0;
  }

  /**
   * Force disconnect all clients for a tenant (for maintenance)
   */
  async disconnectTenantClients(tenantId: string, reason?: string): Promise<number> {
    let disconnectedCount = 0;

    for (const [socketId, metadata] of this.clientMetadata) {
      if (metadata.tenantId === tenantId) {
        const client = this.dashboardClients.get(socketId);
        if (client) {
          if (reason) {
            client.emit('maintenance_disconnect', { reason });
          }
          client.disconnect(true);
          disconnectedCount++;
        }
      }
    }

    return disconnectedCount;
  }

  /**
   * Send maintenance notification to all clients
   */
  async sendMaintenanceNotification(message: string, tenantId?: string): Promise<number> {
    const notification = {
      type: 'maintenance_notification',
      message,
      timestamp: new Date(),
    };

    if (tenantId) {
      return await this.broadcastToTenant(tenantId, notification);
    } else {
      return await this.broadcastToAll(notification);
    }
  }
}
