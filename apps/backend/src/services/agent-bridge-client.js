import { io } from 'socket.io-client';
export class AgentBridgeClient {
    constructor(serverUrl = 'http://localhost:3000') {
        this.socket = io(serverUrl);
        this.messageHandlers = new Map();
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.socket.on('connect', () => {
        });
        this.socket.on('disconnect', () => {
        });
        this.socket.on('agent_message', (data) => {
            const handler = this.messageHandlers.get(data.channel);
            if (handler) {
                handler(data.message);
            }
        });
    }
    async joinChannel(channel) {
        return new Promise((resolve) => {
            this.socket.emit('join_agent_channel', channel, () => {
                resolve();
            });
        });
    }
    async leaveChannel(channel) {
        return new Promise((resolve) => {
            this.socket.emit('leave_agent_channel', channel, () => {
                resolve();
            });
        });
    }
    onMessage(channel, handler) {
        this.messageHandlers.set(channel, handler);
    }
    async sendMessage(channel, message) {
        return new Promise((resolve) => {
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
