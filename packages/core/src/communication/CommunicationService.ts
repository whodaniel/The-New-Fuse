import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter } from '';
  LOW = 'low'';
  NORMAL = 'normal'';
  HIGH = 'high'';
  URGENT = 'urgent'';
  COMMAND = 'command'';
  EVENT = 'event'';
  REQUEST = 'request'';
  RESPONSE = 'response'';
  ERROR = '';
      pattern: ''
    this.logger.log('CommunicationService initialized and subscribed to responses.'
      this.logger.error('Error sending message: ''
        throw new Error('Message ID is undefined after creation.'
      this.logger.error('Error sending request: ''
        channel: 'broadcast'
      this.logger.error('Error broadcasting message: ''
      this.logger.warn('Received response without a clear correlationId or id'
      const errorPayload = (message as any).payload?.error || (message as any).error || { message: 'Unknown error in response';
      const error = new Error(typeof errorPayload === 'string' ? errorPayload : errorPayload.message || 'Unknown error';
      if (typeof errorPayload === 'object'';
      const responseData = message.content !== undefined ? message : (message as any).payload?.data !== undefined ? (message as any).payload : 'message';
      this.emit('messageFailed', { messageId: message.id, error: ''
      this.emit('')