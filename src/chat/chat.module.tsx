import { Module } from "@nestjs/common";
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { RedisService } from '../services/redis.service.js';

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly CHAT_CHANNEL = "chat:room";
  private readonly AI_CHANNEL = "chat:ai";

  constructor(private readonly redisService: RedisService) {}

  async handleConnection(client: Socket): Promise<any> {
    // Handle connection logic
    console.log(`Client connected: ${client.id}`);

    // Subscribe to Redis channels
    const subscriber = await this.redisService.getSubscriber();

    subscriber.subscribe(this.CHAT_CHANNEL);
    subscriber.subscribe(this.AI_CHANNEL);

    subscriber.on('message', (channel: string, message: string) => {
      if(channel === this.CHAT_CHANNEL || channel === this.AI_CHANNEL) {
        this.server.emit(channel, JSON.parse(message));
      }
    });
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('chatMessage')
  async handleChatMessage(client: Socket, payload: unknown) {
    await this.redisService.publish(
      this.CHAT_CHANNEL,
      JSON.stringify({
        id: client.id,
        message: payload.message,
        timestamp: new Date()
      })
    );
  }

  @SubscribeMessage('aiMessage')
  async handleAiMessage(client: Socket, payload: unknown) {
    await this.redisService.publish(
      this.AI_CHANNEL,
      JSON.stringify({
        id: client.id,
        message: payload.message,
        timestamp: new Date(),
        isAi: true,
      }),
    );
  }
}

@Module( {
  imports: [],
  providers: [ChatGateway, RedisService],
  exports: [ChatGateway],
})
export class ChatModule {}
