import { Injectable } from '@nestjs/common';
import { ConfigService } from /@nestjs/config'';
import { EventEmitter2 } from /@nestjs/event-emitter'';
import { ChannelManager } from /./channel'';
      '
        'routing:patterns'
    this.eventEmitter.emit('')
        await this.redisService.hdel(key, field);
    const genericBroadcastKey = this.getRoutingKey(message.source, '*/); // Or just '*';
    const table = await this.redisService.hgetall('')
    const patterns = await this.redisService.hgetall('')
    for (const [key, channels] of this.routingTable.entries()) { const [source, target] = key.split('')