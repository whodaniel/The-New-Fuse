// @ts-ignore
import { io, Socket } from 'socket.io-client';
// @ts-ignore
import { toast } from 'react-hot-toast';
import { EventEmitter } from 'events';

export interface WebSocketMessage {
  type: 'message' | 'file' | 'agent_action' | 'collaboration';
  payload: any;
  sender: {
    type: 'user' | 'agent';
    id: string;
  };
  timestamp: Date;
}

export class WebSocketService extends EventEmitter {
  private socket: any;

  constructor(serverUrl: string = 'http://localhost:3001') {
    super();
    this.socket = io(serverUrl, {
      transports: ['websocket'],
    });
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.socket.on('connect', () => {
      toast.success('Connected to chat server');
      this.emit('connect');
    });

    this.socket.on('disconnect', () => {
      toast.error('Disconnected from chat server');
      this.emit('disconnect');
    });

    this.socket.on('error', (error: any) => {
      console.error('WebSocket error:', error);
      toast.error('WebSocket connection error');
    });

    this.socket.on('message', (message: WebSocketMessage) => {
      this.emit('message', message);
    });

    this.socket.on('agent_joined', (agentId: string) => {
      this.emit('agent_joined', agentId);
    });

    this.socket.on('agent_left', (agentId: string) => {
      this.emit('agent_left', agentId);
    });

    this.socket.on('file_upload_complete', (fileInfo: any) => {
      toast.success('File uploaded successfully');
      this.emit('file_upload_complete', fileInfo);
    });
  }

  public sendMessage(message: Omit<WebSocketMessage, 'timestamp'>): void {
    if (!this.socket.connected) {
      toast.error('Not connected to chat server');
      return;
    }
    this.socket.emit('message', { ...message, timestamp: new Date() });
  }

  public uploadFile(file: File): void {
    if (!this.socket.connected) {
      throw new Error('Not connected to chat server');
    }
    this.socket.emit('upload_file', file);
  }
}
