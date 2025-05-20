import { io, Socket } from 'socket.io-client';

export class AgentBridgeClient {
  private socket: Socket;
  private messageHandlers: Map<string, (message: any) => void>;

  constructor(serverUrl = 'http://localhost:3000') {
    this.socket = io(serverUrl);
    this.messageHandlers = new Map();
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.socket.on('connect', () => {
      
    });

    this.socket.on('disconnect', () => {
      
    });

    this.socket.on('agent_message', (data: { channel: string; message: any }) => {
      const handler = this.messageHandlers.get(data.channel);
      if (handler) {
        handler(data.message);
      }
    });
  }

  async joinChannel(channel: string) {
    return new Promise<void>((resolve) => {
      this.socket.emit('join_agent_channel', channel, () => {
        
        resolve();
      });
    });
  }

  async leaveChannel(channel: string) {
    return new Promise<void>((resolve) => {
      this.socket.emit('leave_agent_channel', channel, () => {
        
        resolve();
      });
    });
  }

  onMessage(channel: string, handler: (message: any) => void) {
    this.messageHandlers.set(channel, handler);
  }

  async sendMessage(channel: string, message: any) {
    return new Promise<void>((resolve) => {
      this.socket.emit('agent_message', { channel, message }, () => {
        
        resolve();
      });
    });
  }

  disconnect() {
    this.socket.disconnect();
  }
}

// Example usage for Roo Coder:
/*
const client = new AgentBridgeClient();

// Connect to Composer's channel
await client.joinChannel('agent:composer');

// Listen for messages from Composer
client.onMessage('agent:roo-coder', (message) => {
  // Handle message from Composer

  // Example: Update UI with message
  updateRooCoderUI(message);
});

// Send message to Composer
await client.sendMessage('agent:composer', {
  type: 'task_request',
  taskId: 'task-123',
  details: {
    // Task details
  }
});
*/ 