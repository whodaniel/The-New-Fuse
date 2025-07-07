import { io, Socket } from 'socket.io-client';

export class WebSocketService {
  private static instance: WebSocketService;
  private socket: Socket;
  
  constructor() {
    this.socket = io('http://localhost:3001', {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: false
    });
  }

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  connect() {
    this.socket.connect();
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.socket.on('connect', () => {
      
    });

    this.socket.on('agent:message', (data) => {
      // Handle agent messages
    });
  }

  send(event: string, data: any): Promise<void> {
    return new Promise((resolve) => {
      this.socket.emit(event, data, () => {
        resolve();
      });
    });
  }

  disconnect() {
    this.socket.disconnect();
  }
}