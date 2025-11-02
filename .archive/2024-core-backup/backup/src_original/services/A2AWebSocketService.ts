import { Injectable, OnModuleInit } from '@nestjs/common';
import { Server } from 'ws';
import { Logger } from /../utils/logger'';
import { A2AMessage } from /../protocols/A2AProtocolHandler'';
import { AgentCardService } from /./AgentCardService'';
import { ProtocolAdapterService } from /../protocols/ProtocolAdapterService'';
    this.initializeSSE()'
    this.wss = new Server({ port: 8080 })';
    this.wss.on('connection'
      const protocol = req.headers[';
      ws.on('message'
          this.logger.error('Error handling WebSocket message'
      ws.on('')
    this.eventEmitter.on('a2a.'
      this.eventEmitter.emit('a2a.'
      this.logger.error('Error processing message'
          type: 'error'
          priority: 'high'
          source: ''