import { io, Socket } from 'socket.io-client';
// First install react-hot-toast: npm install react-hot-toast
// @ts-ignore
import { toast } from 'react-hot-toast';

interface WebSocketMessage {
  type: 'message' | 'file' | 'agent_action' | 'collaboration';
  payload: unknown;
  sender: {
    id: string;
    type: 'user' | 'agent';
    name: string;
  };
  timestamp: string;
}

import { Injectable } from '@nestjs/common';
// First install @nestjs/websockets: npm install @nestjs/websockets
import { WebSocketGateway } from '@nestjs/websockets';

@Injectable()
export class AgentWebSocketService {
  constructor(private readonly webSocketService: WebSocketService) {}

  async sendMessage(message: string): Promise<any> {
    try {
      await this.webSocketService.sendMessage({
        type: 'message',
        payload: { content: message },
        sender: {
          id: 'agent',
          type: 'agent',
          name: 'Agent'
        }
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }
}

class WebSocketService {
  private socket: Socket | null = null;
  private messageHandlers: ((message: WebSocketMessage) => void)[] = [];
  private statusHandlers: ((status: boolean) => void)[] = [];

  connect(userId: string) {
    this.socket = io('http://localhost:3001', {
      auth: { userId },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.notifyStatusHandlers(true);
      toast.success('Connected to chat server');
    });

    this.socket.on('disconnect', () => {
      this.notifyStatusHandlers(false);
      toast.error('Disconnected from chat server');
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    this.socket.on('message', (message: WebSocketMessage) => {
      this.notifyMessageHandlers(message);
    });

    this.socket.on('agent_joined', (data) => {
      toast.success(`Agent ${data.name} joined the conversation`);
    });

    this.socket.on('agent_left', (data) => {
      toast.info(`Agent ${data.name} left the conversation`);
    });

    this.socket.on('file_upload_progress', (data) => {
      toast.loading(`Uploading: ${data.progress}%`, {
        id: `file-upload-${data.fileId}`,
      });
    });

    this.socket.on('file_upload_complete', (data) => {
      toast.success('File uploaded successfully', {
        id: `file-upload-${data.fileId}`,
      });
    });

    this.socket.on('file_transfer_start', (data) => {
      this.emit('transfer_started', data);
      this.initializeFileTransfer(data);
    });

    this.socket.on('file_transfer_progress', (data) => {
      this.emit('transfer_progress', data);
      this.updateTransferProgress(data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  sendMessage(message: Omit<WebSocketMessage, 'timestamp'>) {
    if (!this.socket?.connected) {
      toast.error('Not connected to chat server');
      return;
    }

    this.socket.emit('message', {
      ...message,
      timestamp: new Date(),
    });
  }

  async sendFile(file: File, metadata: Record<string, unknown> = {}) {
    if (!this.socket?.connected) {
      throw new Error('Not connected to chat server');
    }

    const fileId = `${file.name}-${Date.now()}`;
    const totalChunks = Math.ceil(file.size / 1024 / 16);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * 1024 * 16;
      const end = Math.min(start + 1024 * 16, file.size);
      const chunk = file.slice(start, end);

      const buffer = await chunk.arrayBuffer();
      const base64Chunk = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      this.socket.emit('file_chunk', {
        fileId,
        fileName: file.name,
        mimeType: file.type,
        chunk: base64Chunk,
        chunkIndex: i,
        totalChunks,
        metadata,
      });

      // Wait for server acknowledgment before sending next chunk
      await new Promise((resolve) => {
        this.socket?.once(`chunk_received_${fileId}_${i}`, resolve);
      });
    }

    // Wait for final confirmation
    return new Promise((resolve, reject) => {
      this.socket?.once(`file_upload_complete_${fileId}`, resolve);
      this.socket?.once(`file_upload_error_${fileId}`, reject);
    });
  }

  onMessage(handler: (message: WebSocketMessage) => void): void {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  onStatusChange(handler: (status: boolean) => void) {
    this.statusHandlers.push(handler);
    return () => {
      this.statusHandlers = this.statusHandlers.filter(h => h !== handler);
    };
  }

  private notifyMessageHandlers(message: WebSocketMessage) {
    this.messageHandlers.forEach(handler => handler(message));
  }

  private notifyStatusHandlers(status: boolean) {
    this.statusHandlers.forEach(handler => handler(status));
  }
}

export const wsService = new WebSocketService();
export default wsService;
