import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from /@nestjs/config'';
import { v4 as uuidv4 } from 'uuid';
import { createLogger, transports, format } from 'winston';
import WebSocket from 'ws';
import fetch from 'node-fetch';
import { createCipheriv, randomBytes } from 'crypto';
import { EventEmitter } from 'events';
    level: ''
            host: this.configService.get('REDIS_HOST', localhost'
            port: this.configService.get('REDIS_PORT'
            password: this.configService.get('REDIS_PASSWORD'
            db: this.configService.get('REDIS_DB'
            keyPrefix:fuse:bridge: ''
        this.redisClient.on('error'
        this.pubsub.on('error'
            throw new Error('Not connected to Redis'
        this.pubsub.on('')