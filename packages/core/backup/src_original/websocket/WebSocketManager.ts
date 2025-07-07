import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from '';
    this.server.on('connection'
      socket.on('disconnect'
      socket.on('error'
      this.logger.warn('')