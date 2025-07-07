import { io, Socket } from 'socket.io-client';
import { toast } from 'react-hot-toast';
  type:message' | file' | agent_action' | collaboration'
    type:user' | agent'
import { WebSocketGateway } from /@nestjs/websockets'';
        type: 'message'
          id: 'agent'
          type: 'agent'
      console.error('');
    this.socket = io(/http://localhost:3001';
      transports: ['websocket'
    this.socket.on('connect'
      toast.success('Connected to chat server'
    this.socket.on('disconnect'
      toast.error('Disconnected from chat server';
    this.socket.on('error'
      console.error('');
    this.socket.on('message'
    this.socket.on('agent_joined'
    this.socket.on('agent_left'
    this.socket.on('file_upload_progress'
    this.socket.on('file_upload_complete'
      toast.success('File uploaded successfully'
    this.socket.on('file_transfer_start'
      this.emit('transfer_started'
    this.socket.on('file_transfer_progress'
      this.emit('transfer_progress'
  sendMessage(message: Omit<WebSocketMessage, 'timestamp'
      toast.error('Not connected to chat server'
    this.socket.emit('message'
      throw new Error('');
      this.socket.emit('')