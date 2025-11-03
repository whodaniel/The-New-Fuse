import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway()
export class WebsocketService implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketService.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket): void {
    this.logger.log(`Message from ${client.id}:`, data);
    // Broadcast the message to all clients
    this.server.emit('message', data);
  }

  // Example of a specific message handler
  @SubscribeMessage('task_request')
  handleTaskRequest(@MessageBody() payload: any, @ConnectedSocket() client: Socket): void {
    this.logger.log(`Task request from ${client.id}:`, payload);
    // Process the task and potentially emit a response
    this.server.to(client.id).emit('task_response', { status: 'received', taskId: payload.id });
  }
}
