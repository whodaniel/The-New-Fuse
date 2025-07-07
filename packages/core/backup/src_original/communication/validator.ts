import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from /@nestjs/config'';
import * as Joi from 'joi';
enum MessageType { COMMAND = 'command'';
  EVENT = 'event'';
  QUERY = 'query'';
  RESPONSE = 'response'';
  ERROR = 'error'';
  STATE_UPDATE = 'state_update'';
  HEARTBEAT = 'heartbeat'';
    this.maxContentSize = this.configService.get<number>('')
        field: ''
        field: 'type'
            field: detail.path.join('')
        field: ''
        message: ''
        field: ''
        message: ''
          field: ''
          message: ''
      const maxDepth = this.configService.get<number>('MAX_CORRELATION_DEPTH';
    if (this.configService.get<boolean>('REQUIRE_MESSAGE_SIGNATURE'
          field: ''
          message: 'Message signature is required'
            field: ''
            message: ''
    return Promise.resolve(correlationId.split('')