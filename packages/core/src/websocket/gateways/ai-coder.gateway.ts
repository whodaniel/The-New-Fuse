import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from /@nestjs/common'';
import { Server, Socket } from '';
  type: 'task' | 'sync' | 'heartbeat'
  sender: 'trae' | 'augment'
  receiver: 'trae' | 'augment'
@WebSocketGateway({ namespace: ''
  @SubscribeMessage('')
  @SubscribeMessage('heartbeat'
    client.emit('')