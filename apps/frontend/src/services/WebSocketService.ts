import { io, Socket } from 'socket.io-client';

export class WebSocketService {
  private socket: Socket;
  
  constructor() {
    this.socket = io('http://localhost:3001', {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: false
    });
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
}