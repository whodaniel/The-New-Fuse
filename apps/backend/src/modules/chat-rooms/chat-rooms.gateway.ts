import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatRoomsService } from './chat-rooms.service';
import { CreateMessageDto, MessageType } from './dto/chat-room.dto';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  agentId?: string;
  isAgent?: boolean;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/chat-rooms',
})
export class ChatRoomsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatRoomsGateway.name);
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds
  private roomParticipants: Map<string, Set<string>> = new Map(); // roomId -> Set of userIds

  constructor(private readonly chatRoomsService: ChatRoomsService) {}

  afterInit(server: Server) {
    this.logger.log('ChatRooms WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract user/agent info from handshake (in real app, verify JWT token)
      const userId = client.handshake.auth?.userId || (client.handshake.query?.userId as string);
      const agentId = client.handshake.auth?.agentId || (client.handshake.query?.agentId as string);
      const isAgent = !!agentId;

      if (!userId && !agentId) {
        this.logger.warn(`Connection rejected: No user/agent ID provided`);
        client.disconnect();
        return;
      }

      client.userId = userId;
      client.agentId = agentId;
      client.isAgent = isAgent;

      const identifier = userId || agentId;

      // Track user socket
      if (!this.userSockets.has(identifier)) {
        this.userSockets.set(identifier, new Set());
      }
      this.userSockets.get(identifier)?.add(client.id);

      this.logger.log(
        `Client connected: ${client.id} (${isAgent ? 'Agent' : 'User'}: ${identifier})`
      );

      // Emit connection success
      client.emit('connected', {
        message: 'Connected to chat rooms',
        userId: identifier,
        isAgent,
      });
    } catch (error) {
      this.logger.error(`Error handling connection: ${(error as any).message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const identifier = client.userId || client.agentId;

    if (identifier) {
      const sockets = this.userSockets.get(identifier);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(identifier);
        }
      }

      // Notify rooms about user disconnect
      this.roomParticipants.forEach((participants, roomId) => {
        if (participants.has(identifier)) {
          this.server.to(roomId).emit('user:left', {
            roomId,
            userId: identifier,
            isAgent: client.isAgent,
          });
        }
      });
    }

    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // =================================================================
  // ROOM MANAGEMENT
  // =================================================================

  @SubscribeMessage('room:join')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string }
  ) {
    try {
      const userId = client.userId || client.agentId;
      const { roomId } = data;

      // Verify user has access to the room
      await this.chatRoomsService.verifyAccess(roomId, userId);

      // Join the socket room
      client.join(roomId);

      // Track room participant
      if (!this.roomParticipants.has(roomId)) {
        this.roomParticipants.set(roomId, new Set());
      }
      this.roomParticipants.get(roomId).add(userId);

      this.logger.log(`User ${userId} joined room ${roomId}`);

      // Notify other participants
      client.to(roomId).emit('user:joined', {
        roomId,
        userId,
        isAgent: client.isAgent,
        timestamp: new Date(),
      });

      // Send confirmation to the user
      client.emit('room:joined', {
        roomId,
        message: 'Successfully joined room',
      });

      return { success: true, roomId };
    } catch (error) {
      this.logger.error(`Error joining room: ${(error as any).message}`);
      client.emit('error', {
        event: 'room:join',
        message: (error as any).message,
      });
      return { success: false, error: (error as any).message };
    }
  }

  @SubscribeMessage('room:leave')
  async handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string }
  ) {
    try {
      const userId = client.userId || client.agentId;
      const { roomId } = data;

      // Leave the socket room
      client.leave(roomId);

      // Remove from room participants
      if (this.roomParticipants.has(roomId)) {
        this.roomParticipants.get(roomId).delete(userId);
      }

      this.logger.log(`User ${userId} left room ${roomId}`);

      // Notify other participants
      client.to(roomId).emit('user:left', {
        roomId,
        userId,
        isAgent: client.isAgent,
        timestamp: new Date(),
      });

      return { success: true, roomId };
    } catch (error) {
      this.logger.error(`Error leaving room: ${(error as any).message}`);
      return { success: false, error: (error as any).message };
    }
  }

  // =================================================================
  // MESSAGING
  // =================================================================

  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; message: CreateMessageDto }
  ) {
    try {
      const userId = client.userId || client.agentId;
      const { roomId, message } = data;

      // Create the message in the database
      const createdMessage = await this.chatRoomsService.createMessage(
        roomId,
        message,
        userId,
        client.isAgent
      );

      // Broadcast the message to all room participants
      this.server.to(roomId).emit('message:new', {
        roomId,
        message: createdMessage,
      });

      this.logger.log(`Message sent in room ${roomId} by ${userId}`);

      return { success: true, message: createdMessage };
    } catch (error) {
      this.logger.error(`Error sending message: ${(error as any).message}`);
      client.emit('error', {
        event: 'message:send',
        message: (error as any).message,
      });
      return { success: false, error: (error as any).message };
    }
  }

  @SubscribeMessage('message:edit')
  async handleEditMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; messageId: string; content: string }
  ) {
    try {
      const userId = client.userId || client.agentId;
      const { roomId, messageId, content } = data;

      // Update the message
      const updatedMessage = await this.chatRoomsService.updateMessage(
        messageId,
        { content },
        userId
      );

      // Broadcast the update to all room participants
      this.server.to(roomId).emit('message:updated', {
        roomId,
        message: updatedMessage,
      });

      return { success: true, message: updatedMessage };
    } catch (error) {
      this.logger.error(`Error editing message: ${(error as any).message}`);
      return { success: false, error: (error as any).message };
    }
  }

  @SubscribeMessage('message:delete')
  async handleDeleteMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; messageId: string }
  ) {
    try {
      const userId = client.userId || client.agentId;
      const { roomId, messageId } = data;

      // Delete the message
      await this.chatRoomsService.deleteMessage(messageId, userId);

      // Broadcast the deletion to all room participants
      this.server.to(roomId).emit('message:deleted', {
        roomId,
        messageId,
      });

      return { success: true, messageId };
    } catch (error) {
      this.logger.error(`Error deleting message: ${(error as any).message}`);
      return { success: false, error: (error as any).message };
    }
  }

  // =================================================================
  // TYPING INDICATORS
  // =================================================================

  @SubscribeMessage('typing:start')
  async handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string }
  ) {
    try {
      const userId = client.userId || client.agentId;
      const { roomId } = data;

      // Update typing indicator in database
      await this.chatRoomsService.setTypingIndicator(roomId, userId, true);

      // Broadcast to other participants
      client.to(roomId).emit('typing:started', {
        roomId,
        userId,
        isAgent: client.isAgent,
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Error setting typing indicator: ${(error as any).message}`);
      return { success: false, error: (error as any).message };
    }
  }

  @SubscribeMessage('typing:stop')
  async handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string }
  ) {
    try {
      const userId = client.userId || client.agentId;
      const { roomId } = data;

      // Update typing indicator in database
      await this.chatRoomsService.setTypingIndicator(roomId, userId, false);

      // Broadcast to other participants
      client.to(roomId).emit('typing:stopped', {
        roomId,
        userId,
        isAgent: client.isAgent,
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Error clearing typing indicator: ${(error as any).message}`);
      return { success: false, error: (error as any).message };
    }
  }

  // =================================================================
  // READ RECEIPTS
  // =================================================================

  @SubscribeMessage('message:read')
  async handleMessageRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; messageId: string }
  ) {
    try {
      const userId = client.userId || client.agentId;
      const { roomId, messageId } = data;

      // Mark message as read
      await this.chatRoomsService.markAsRead(messageId, roomId, userId, client.isAgent);

      // Broadcast read receipt to room
      client.to(roomId).emit('message:read', {
        roomId,
        messageId,
        userId,
        isAgent: client.isAgent,
        timestamp: new Date(),
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Error marking message as read: ${(error as any).message}`);
      return { success: false, error: (error as any).message };
    }
  }

  // =================================================================
  // AGENT-SPECIFIC EVENTS
  // =================================================================

  @SubscribeMessage('agent:execute-command')
  async handleAgentExecuteCommand(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; command: string; params: any }
  ) {
    try {
      if (!client.isAgent) {
        throw new Error('Only agents can execute commands');
      }

      const { roomId, command, params } = data;

      // In a real implementation, this would execute the command
      // For now, just broadcast the execution
      this.server.to(roomId).emit('agent:command-executed', {
        roomId,
        agentId: client.agentId,
        command,
        params,
        timestamp: new Date(),
      });

      // Send a system message about the command execution
      const message = await this.chatRoomsService.createMessage(
        roomId,
        {
          content: `Agent executed command: ${command}`,
          type: MessageType.SYSTEM,
        },
        client.agentId,
        true
      );

      this.server.to(roomId).emit('message:new', {
        roomId,
        message,
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Error executing agent command: ${(error as any).message}`);
      return { success: false, error: (error as any).message };
    }
  }

  @SubscribeMessage('agent:create-task')
  async handleAgentCreateTask(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: {
      roomId: string;
      taskData: {
        title: string;
        description: string;
        assignedTo?: string;
        dueDate?: string;
      };
    }
  ) {
    try {
      if (!client.isAgent) {
        throw new Error('Only agents can create tasks');
      }

      const { roomId, taskData } = data;

      // Create a task assignment message
      const message = await this.chatRoomsService.createMessage(
        roomId,
        {
          content: `Task created: ${taskData.title}`,
          type: MessageType.TASK,
          taskAssignment: taskData,
        },
        client.agentId,
        true
      );

      // Broadcast to room
      this.server.to(roomId).emit('message:new', {
        roomId,
        message,
      });

      this.server.to(roomId).emit('agent:task-created', {
        roomId,
        agentId: client.agentId,
        task: taskData,
        timestamp: new Date(),
      });

      return { success: true, message };
    } catch (error) {
      this.logger.error(`Error creating task: ${(error as any).message}`);
      return { success: false, error: (error as any).message };
    }
  }

  // =================================================================
  // HELPER METHODS
  // =================================================================

  /**
   * Broadcast a message to a specific room
   */
  broadcastToRoom(roomId: string, event: string, data: any) {
    this.server.to(roomId).emit(event, data);
  }

  /**
   * Send a message to a specific user (all their connected sockets)
   */
  sendToUser(userId: string, event: string, data: any) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.forEach((socketId) => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }

  /**
   * Get online users in a room
   */
  getOnlineUsersInRoom(roomId: string): string[] {
    const participants = this.roomParticipants.get(roomId);
    if (!participants) return [];

    return Array.from(participants).filter((userId) => {
      return this.userSockets.has(userId);
    });
  }
}
