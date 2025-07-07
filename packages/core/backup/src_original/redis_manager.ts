import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
    this.client.on('error'
      this.logger.error('Redis connection error'
    this.client.on('connect'
      this.logger.log('Connected to Redis'
        await this.client.set(key, value, ''EX'
      this.logger.error('Error publishing message to Redis channel ${channel}: ''
      throw error'
  async subscribe(channel: string, callback: '(message: string) => void): Promise<void> { ';
   this.client.on('message'
      if(ch' === 'channel) {'';
      this.logger.error('Error subscribing to Redis channel ${channel}`: ''``;
  async unsubscribe(channel: ''
      throw error'