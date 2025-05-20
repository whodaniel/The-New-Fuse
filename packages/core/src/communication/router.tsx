import { Injectable } from '@nestjs/common';
import { Message, Channel } from './types.js';
import { ChannelManager } from './channel.js';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../services/redis.service.js';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class MessageRouter {
  private readonly routingTable: Map<string, Set<string>>;
  private readonly routingPatterns: Map<string, RegExp>;

  constructor(
    private readonly channelManager: ChannelManager,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.routingTable = new Map();
    this.routingPatterns = new Map();
  }

  async routeMessage(message: Message): Promise<Channel> {
    // Try direct routing first
    const directChannel = await this.routeDirect(message);
    if (directChannel) {
      return directChannel;
    }

    // Try pattern-based routing
    const patternChannel = await this.routePattern(message);
    if (patternChannel) {
      return patternChannel;
    }

    // Try broadcast as last resort
    const broadcastChannel = await this.routeBroadcast(message);
    if (broadcastChannel) {
      return broadcastChannel;
    }

    throw new Error('No suitable channel found for message');
  }

  async addRoute(
    source: string,
    target: string,
    channelId: string,
    pattern?: string,
  ): Promise<void> {
    const key = this.getRoutingKey(source, target);
    let channels = this.routingTable.get(key);
    if (!channels) {
      channels = new Set();
      this.routingTable.set(key, channels);
    }
    channels.add(channelId);

    // Persist to Redis
    await this.redisService.hset(
      'routing:table',
      key,
      JSON.stringify(Array.from(channels)),
    );

    if (pattern) {
      this.routingPatterns.set(channelId, new RegExp(pattern));
      await this.redisService.hset(
        'routing:patterns',
        channelId,
        pattern,
      );
    }

    this.eventEmitter.emit('route.added', {
      source,
      target,
      channelId,
      pattern,
    });
  }

  async removeRoute(source: string, target: string, channelId: string): Promise<void> {
    const key = this.getRoutingKey(source, target);
    const channels = this.routingTable.get(key);

    if (channels) {
      channels.delete(channelId);
      if (channels.size === 0) {
        this.routingTable.delete(key);
        await this.redisService.hdel('routing:table', key);
      } else {
        await this.redisService.hset(
          'routing:table',
          key,
          JSON.stringify(Array.from(channels)),
        );
      }
    }

    if (this.routingPatterns.has(channelId)) {
      this.routingPatterns.delete(channelId);
      await this.redisService.hdel('routing:patterns', channelId);
    }

    this.eventEmitter.emit('route.removed', {
      source,
      target,
      channelId,
    });
  }

  private async routeDirect(message: Message): Promise<Channel | null> {
    const key = this.getRoutingKey(message.source, message.target);
    const channels = this.routingTable.get(key);

    if (!channels) {
      return null;
    }

    // Get the first available channel
    for (const channelId of channels) {
      const channel = await this.channelManager.getChannel(channelId);
      if (channel) {
        return channel;
      }
    }
    return null;
  }

  private async routePattern(message: Message): Promise<Channel | null> {
    for (const [channelId, pattern] of this.routingPatterns.entries()) {
      if (
        pattern.test(message.target) ||
        (message.source && pattern.test(`${message.source}:${message.target}`))
      ) {
        const channel = await this.channelManager.getChannel(channelId);
        if (channel) {
          return channel;
        }
      }
    }
    return null;
  }

  private async routeBroadcast(message: Message): Promise<Channel | null> {
    // Look for a broadcast channel that matches the message type
    // This implementation assumes broadcast channels are registered with a specific key format,
    // e.g., 'broadcast:messageType'. This needs to be defined by how broadcast routes are added.
    // For now, let's assume a generic broadcast or a more specific lookup if available.
    // The original code had `this.redisService.get(`broadcast:${message.type}`)`
    // which implies a specific channel ID is stored under that key.

    // Simplified: Iterate all channels if no specific broadcast routing logic is in routingTable/Patterns
    // This is a placeholder and likely needs refinement based on actual broadcast strategy.
    // A more robust way would be to have a dedicated 'broadcast' entry in routingTable or a specific pattern.
    
    // Attempting to retrieve a specific broadcast channel ID from Redis as hinted in original logic
    const broadcastChannelId = await this.redisService.get(`broadcast:${message.type}`);
    if (broadcastChannelId) {
        const channel = await this.channelManager.getChannel(broadcastChannelId);
        if (channel) {
            return channel;
        }
    }
    
    // Fallback: Check for a generic broadcast channel if one was registered with a known ID or pattern
    // This part is speculative without knowing how broadcast channels are registered.
    // Example: if a channel was added with target '*'
    const genericBroadcastKey = this.getRoutingKey(message.source, '*'); // Or just '*' if source is irrelevant
    const broadcastChannels = this.routingTable.get(genericBroadcastKey);
    if (broadcastChannels) {
        for (const channelId of broadcastChannels) {
            const channel = await this.channelManager.getChannel(channelId);
            if (channel) {
                return channel; // Return first available broadcast channel
            }
        }
    }

    return null;
  }

  private getRoutingKey(source: string, target: string): string {
    return `${source}:${target}`;
  }

  async loadRoutes(): Promise<void> {
    // Load routing table from Redis
    const table = await this.redisService.hgetall('routing:table');
    if (table) {
      for (const [key, value] of Object.entries(table)) {
        if (value) { // Ensure value is not null or undefined
            const channels = new Set<string>(JSON.parse(value as string));
            this.routingTable.set(key, channels);
        }
      }
    }

    // Load routing patterns from Redis
    const patterns = await this.redisService.hgetall('routing:patterns');
    if (patterns) {
      for (const [channelId, pattern] of Object.entries(patterns)) {
         if (pattern) { // Ensure pattern is not null or undefined
            this.routingPatterns.set(channelId, new RegExp(pattern as string));
        }
      }
    }
  }

  async getAllRoutes(): Promise<
    Array<{
      source: string;
      target: string;
      channelId: string;
      pattern?: string;
    }>
  > {
    const routes: Array<{
      source: string;
      target: string;
      channelId: string;
      pattern?: string;
    }> = [];

    for (const [key, channels] of this.routingTable.entries()) {
      const [source, target] = key.split(':');
      for (const channelId of channels) {
        routes.push({
          source,
          target,
          channelId,
          pattern: this.getPatternForChannel(channelId),
        });
      }
    }
    return routes;
  }
  
  private getPatternForChannel(channelId: string): string | undefined {
    const pattern = this.routingPatterns.get(channelId);
    return pattern?.source;
  }
}
