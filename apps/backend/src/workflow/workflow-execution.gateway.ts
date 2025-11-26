/**
 * WebSocket Gateway for Real-Time Workflow Execution Monitoring
 * Provides live updates during workflow execution
 */

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';

interface ExecutionUpdate {
  type: 'status' | 'node_started' | 'node_completed' | 'node_failed' | 'workflow_completed' | 'workflow_failed' | 'log';
  executionId: string;
  workflowId?: string;
  nodeId?: string;
  data: any;
  timestamp: Date;
}

interface ExecutionSubscription {
  executionId: string;
  clientId: string;
}

@WebSocketGateway({
  cors: {
    origin: '*', // Configure based on your environment
    credentials: true
  },
  namespace: '/workflow-execution'
})
export class WorkflowExecutionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(WorkflowExecutionGateway.name);
  private activeSubscriptions: Map<string, Set<string>> = new Map(); // executionId -> Set of clientIds
  private clientSubscriptions: Map<string, Set<string>> = new Map(); // clientId -> Set of executionIds

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.clientSubscriptions.set(client.id, new Set());
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Clean up subscriptions
    const subscriptions = this.clientSubscriptions.get(client.id);
    if (subscriptions) {
      subscriptions.forEach(executionId => {
        const subscribers = this.activeSubscriptions.get(executionId);
        if (subscribers) {
          subscribers.delete(client.id);
          if (subscribers.size === 0) {
            this.activeSubscriptions.delete(executionId);
          }
        }
      });
      this.clientSubscriptions.delete(client.id);
    }
  }

  /**
   * Subscribe to workflow execution updates
   */
  @SubscribeMessage('subscribe_execution')
  handleSubscribeExecution(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { executionId: string }
  ) {
    const { executionId } = data;

    // Add subscription
    if (!this.activeSubscriptions.has(executionId)) {
      this.activeSubscriptions.set(executionId, new Set());
    }
    this.activeSubscriptions.get(executionId)!.add(client.id);

    // Track client subscription
    this.clientSubscriptions.get(client.id)!.add(executionId);

    this.logger.log(`Client ${client.id} subscribed to execution ${executionId}`);

    client.emit('subscription_confirmed', {
      executionId,
      timestamp: new Date()
    });
  }

  /**
   * Unsubscribe from workflow execution updates
   */
  @SubscribeMessage('unsubscribe_execution')
  handleUnsubscribeExecution(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { executionId: string }
  ) {
    const { executionId } = data;

    // Remove subscription
    const subscribers = this.activeSubscriptions.get(executionId);
    if (subscribers) {
      subscribers.delete(client.id);
      if (subscribers.size === 0) {
        this.activeSubscriptions.delete(executionId);
      }
    }

    // Remove from client tracking
    this.clientSubscriptions.get(client.id)?.delete(executionId);

    this.logger.log(`Client ${client.id} unsubscribed from execution ${executionId}`);

    client.emit('unsubscription_confirmed', {
      executionId,
      timestamp: new Date()
    });
  }

  /**
   * Pause workflow execution
   */
  @SubscribeMessage('pause_execution')
  async handlePauseExecution(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { executionId: string }
  ) {
    const { executionId } = data;

    this.logger.log(`Client ${client.id} requesting pause for execution ${executionId}`);

    // Emit pause event to workflow engine
    this.broadcastToExecution(executionId, {
      type: 'status',
      executionId,
      data: { status: 'pausing', requestedBy: client.id },
      timestamp: new Date()
    });

    return { success: true, executionId };
  }

  /**
   * Resume workflow execution
   */
  @SubscribeMessage('resume_execution')
  async handleResumeExecution(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { executionId: string }
  ) {
    const { executionId } = data;

    this.logger.log(`Client ${client.id} requesting resume for execution ${executionId}`);

    // Emit resume event to workflow engine
    this.broadcastToExecution(executionId, {
      type: 'status',
      executionId,
      data: { status: 'resuming', requestedBy: client.id },
      timestamp: new Date()
    });

    return { success: true, executionId };
  }

  /**
   * Cancel workflow execution
   */
  @SubscribeMessage('cancel_execution')
  async handleCancelExecution(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { executionId: string; reason?: string }
  ) {
    const { executionId, reason } = data;

    this.logger.log(`Client ${client.id} requesting cancellation for execution ${executionId}`);

    // Emit cancel event to workflow engine
    this.broadcastToExecution(executionId, {
      type: 'status',
      executionId,
      data: {
        status: 'cancelling',
        reason: reason || 'Cancelled by user',
        requestedBy: client.id
      },
      timestamp: new Date()
    });

    return { success: true, executionId };
  }

  /**
   * Broadcast execution update to all subscribed clients
   */
  broadcastToExecution(executionId: string, update: ExecutionUpdate) {
    const subscribers = this.activeSubscriptions.get(executionId);

    if (!subscribers || subscribers.size === 0) {
      this.logger.debug(`No subscribers for execution ${executionId}`);
      return;
    }

    this.logger.debug(
      `Broadcasting ${update.type} to ${subscribers.size} clients for execution ${executionId}`
    );

    subscribers.forEach(clientId => {
      this.server.to(clientId).emit('execution_update', update);
    });
  }

  /**
   * Send execution update to all subscribers
   */
  sendExecutionUpdate(executionId: string, update: Partial<ExecutionUpdate>) {
    this.broadcastToExecution(executionId, {
      executionId,
      timestamp: new Date(),
      ...update
    } as ExecutionUpdate);
  }

  /**
   * Send node started event
   */
  sendNodeStarted(executionId: string, nodeId: string, nodeData: any) {
    this.sendExecutionUpdate(executionId, {
      type: 'node_started',
      nodeId,
      data: nodeData
    });
  }

  /**
   * Send node completed event
   */
  sendNodeCompleted(executionId: string, nodeId: string, output: any, duration: number) {
    this.sendExecutionUpdate(executionId, {
      type: 'node_completed',
      nodeId,
      data: { output, duration }
    });
  }

  /**
   * Send node failed event
   */
  sendNodeFailed(executionId: string, nodeId: string, error: any) {
    this.sendExecutionUpdate(executionId, {
      type: 'node_failed',
      nodeId,
      data: { error }
    });
  }

  /**
   * Send workflow completed event
   */
  sendWorkflowCompleted(executionId: string, workflowId: string, output: any, statistics: any) {
    this.sendExecutionUpdate(executionId, {
      type: 'workflow_completed',
      workflowId,
      data: { output, statistics }
    });
  }

  /**
   * Send workflow failed event
   */
  sendWorkflowFailed(executionId: string, workflowId: string, error: any) {
    this.sendExecutionUpdate(executionId, {
      type: 'workflow_failed',
      workflowId,
      data: { error }
    });
  }

  /**
   * Send execution log
   */
  sendLog(executionId: string, level: 'debug' | 'info' | 'warn' | 'error', message: string, metadata?: any) {
    this.sendExecutionUpdate(executionId, {
      type: 'log',
      data: {
        level,
        message,
        metadata,
        timestamp: new Date()
      }
    });
  }

  /**
   * Get active subscription count
   */
  getActiveSubscriptionCount(): number {
    return this.activeSubscriptions.size;
  }

  /**
   * Get subscribers for an execution
   */
  getSubscribers(executionId: string): string[] {
    const subscribers = this.activeSubscriptions.get(executionId);
    return subscribers ? Array.from(subscribers) : [];
  }
}
