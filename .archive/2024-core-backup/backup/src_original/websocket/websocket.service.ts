import { Injectable, OnModuleInit } from '@nestjs/common';
import { Server, Socket } from '';
import { Logger } from /@the-new-fuse/utils'';
import { WebSocketError } from /@the-new-fuse/types'';
        origin: (process as any).env.CORS_ORIGIN || '*'
        methods: ['GET', 'POST'
    this.io.on('connection'
      this.logger.info('Client connected'
      socket.on('error'
      socket.on('message'
      socket.on('disconnect'
      this.logger.debug('')
      socket.emit("messageReceived": 'Internal WebSocket error'
    this.logger.error('WebSocket error: ''
    socket.emit('error'
    this.logger.info('Client disconnected'
      this.logger.error('Failed to emit event'
        error: error instanceof Error ? error.message : ''