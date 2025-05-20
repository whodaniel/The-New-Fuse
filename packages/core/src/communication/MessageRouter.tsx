import { Injectable } from '@nestjs/common';
import { Message, Channel, ChannelType, MessageType, ChannelMetadata, PrismaChannel } from './types.js'; // Adjusted import, added PrismaChannel
import { Logger } from '@the-new-fuse/utils';
import { DatabaseService } from '@the-new-fuse/database';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MessageRouter extends EventEmitter {
  private logger: Logger;
  private channels: Map<string, Channel>; // Key: channelId
  // Routing table might be simplified if channel creation/discovery is robust
  // private routingTable: Map<string, Set<string>>; 
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    super();
    this.db = db;
    this.logger = new Logger(MessageRouter.name);
    this.channels = new Map<string, Channel>();
    // this.routingTable = new Map<string, Set<string>>();
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing message router...');
      const storedChannels: PrismaChannel[] = await this.db.channel.findMany();
      for (const dbChannel of storedChannels) {
        let metadata: ChannelMetadata;
        if (typeof dbChannel.metadata === 'string') {
          try {
            metadata = JSON.parse(dbChannel.metadata) as ChannelMetadata;
          } catch (e) {
            this.logger.warn(`Failed to parse metadata for channel ${dbChannel.id}`, e);
            metadata = this.createDefaultMetadata(dbChannel.type as ChannelType);
          }
        } else if (typeof dbChannel.metadata === 'object' && dbChannel.metadata !== null) {
          metadata = dbChannel.metadata as ChannelMetadata;
        } else {
          this.logger.warn(`Metadata for channel ${dbChannel.id} is null or not a string/object, using default.`);
          metadata = this.createDefaultMetadata(dbChannel.type as ChannelType);
        }
        
        // Ensure all required fields from Channel are present
        const channel: Channel = {
          id: dbChannel.id,
          name: dbChannel.name,
          type: dbChannel.type as ChannelType,
          // pattern: dbChannel.pattern, // Add if pattern is part of PrismaChannel and Channel
          metadata: metadata,
          // participants: dbChannel.participants, // Add if participants is part of PrismaChannel and Channel
          // Add other fields from PrismaChannel that are part of Channel interface
        };
        this.channels.set(channel.id, channel);
      }
      this.logger.info(`Initialized message router with ${this.channels.size} channels.`);
    } catch (error: unknown) {
      this.logger.error('Failed to initialize message router:', error);
      throw error;
    }
  }

  private createDefaultMetadata(type: ChannelType): ChannelMetadata {
    const now = new Date().toISOString();
    return {
      created: now,
      lastActive: now,
      messageCount: 0,
      type: type,
      // Ensure other potentially required fields from ChannelMetadata are initialized
      // e.g., participants: [], subscribers: 0, etc. based on types.d.tsx
      description: '',
      tags: [],
      participants: [], // Assuming participants is part of ChannelMetadata
      subscribers: 0,  // Assuming subscribers is part of ChannelMetadata
    };
  }

  async routeMessage(message: Message): Promise<Channel> {
    try {
      if (!message.target) {
        this.logger.error('Message target is required for routing.', { messageId: message.id });
        throw new Error('Message target is required for routing.');
      }

      this.logger.debug(`Routing message ${message.id} to target: ${message.target}`);

      const channel = await this.findOrCreateChannel(message.target, message.source, message.type, message.metadata?.participants);

      // Update channel metadata
      channel.metadata.lastActive = new Date().toISOString();
      channel.metadata.messageCount = (channel.metadata.messageCount || 0) + 1;
      // Potentially update participants if message implies new ones for certain channel types
      await this.saveChannel(channel);

      this.emit('messageRouted', {
        messageId: message.id,
        source: message.source,
        target: message.target,
        channelId: channel.id,
        timestamp: new Date().toISOString(),
      });
      this.logger.info(`Message ${message.id} routed to channel ${channel.id}`);
      return channel;
    } catch (error: unknown) {
      this.logger.error(`Error routing message ${message.id}:`, error);
      throw error;
    }
  }

  async findOrCreateChannel(target: string, source?: string, messageType?: MessageType, messageParticipants?: string[]): Promise<Channel> {
    this.logger.debug(`Find or create channel for target: ${target}, source: ${source}, type: ${messageType}`);
    // 1. If target is a known channel ID
    let channel = this.channels.get(target);
    if (channel) {
      this.logger.debug(`Found existing channel by ID: ${target}`);
      return channel;
    }

    // 2. If target is a name, try to find by name
    // This requires iterating, could be slow for many channels. Consider DB lookup if performance critical.
    for (const existingChannel of this.channels.values()) {
        if (existingChannel.name === target) {
            // Optional: check if type matches if messageType is provided
            if (messageType && existingChannel.type !== this.mapMessageTypeToChannelType(messageType)) {
                this.logger.warn(`Found channel by name ${target} but type mismatch: ${existingChannel.type} vs ${messageType}`);
                // Decide if this is an error or if you should create a new one.
                // For now, let's assume type match is important if messageType is given.
                continue;
            }
            this.logger.debug(`Found existing channel by name: ${target}`);
            return existingChannel;
        }
    }
    
    // 3. Specific logic for DIRECT messages if source and target are user IDs
    if (messageType === MessageType.DIRECT && source && target) {
      const userIds = [source, target].sort();
      const directChannelName = `dm-${userIds[0]}-${userIds[1]}`;
      
      for (const existingChannel of this.channels.values()) {
        if (existingChannel.name === directChannelName && existingChannel.type === ChannelType.DIRECT) {
          this.logger.debug(`Found existing direct channel: ${directChannelName}`);
          return existingChannel;
        }
      }
      this.logger.info(`Creating new direct channel: ${directChannelName}`);
      const newDirectChannel: Channel = {
        id: uuidv4(),
        name: directChannelName,
        type: ChannelType.DIRECT,
        metadata: {
          ...this.createDefaultMetadata(ChannelType.DIRECT),
          participants: userIds,
        },
      };
      await this.saveChannel(newDirectChannel);
      return newDirectChannel;
    }

    // 4. Fallback: Create a new channel if not found by ID or specific logic.
    // Determine channel type based on messageType or default.
    const newChannelType = messageType ? this.mapMessageTypeToChannelType(messageType) : ChannelType.GROUP;
    const newChannelName = target; // Use target as name, could be a topic or group name
    
    this.logger.info(`Creating new ${newChannelType} channel with name/target: ${newChannelName}`);
    const newChannel: Channel = {
      id: uuidv4(),
      name: newChannelName,
      type: newChannelType,
      metadata: {
        ...this.createDefaultMetadata(newChannelType),
        participants: messageParticipants || (source ? [source] : []), // Initialize with source or provided participants
      },
      // pattern: newChannelType === ChannelType.TOPIC ? newChannelName : undefined, // Set pattern for topic channels
    };

    await this.saveChannel(newChannel);
    return newChannel;
  }

  // Helper to map message type to a sensible channel type for creation
  private mapMessageTypeToChannelType(messageType: MessageType): ChannelType {
    switch (messageType) {
      case MessageType.DIRECT:
        return ChannelType.DIRECT;
      case MessageType.EVENT: // Events might go to TOPIC or BROADCAST
      case MessageType.STATE_UPDATE:
        return ChannelType.TOPIC; 
      case MessageType.COMMAND:
      case MessageType.QUERY:
      case MessageType.RESPONSE:
      case MessageType.ERROR:
      default:
        return ChannelType.GROUP; // Default, or could be more specific
    }
  }
  
  // addRoute and getRoutesForSource might be less relevant if channel discovery is robust
  // public addRoute(sourceId: string, channelId: string, pattern?: string): void {
  //   // ... (implementation if needed, consider if pattern-based routing is stored here)
  //   this.logger.debug(`Route added/updated for source ${sourceId} to channel ${channelId} (pattern: ${pattern})`);
  // }

  async getChannel(channelId: string): Promise<Channel | null> {
    const channel = this.channels.get(channelId);
    if (channel) return channel;
    
    // Optional: Fallback to DB if not in memory (e.g., if another instance created it)
    this.logger.warn(`Channel ${channelId} not found in memory, attempting DB lookup.`);
    const dbChannel = await this.db.channel.findUnique({ where: { id: channelId } });
    if (dbChannel) {
        let metadata: ChannelMetadata;
        if (typeof dbChannel.metadata === 'string') {
          metadata = JSON.parse(dbChannel.metadata) as ChannelMetadata;
        } else {
          metadata = dbChannel.metadata as ChannelMetadata;
        }
        const inMemoryChannel: Channel = { ...dbChannel, type: dbChannel.type as ChannelType, metadata };
        this.channels.set(inMemoryChannel.id, inMemoryChannel); // Cache it
        return inMemoryChannel;
    }
    return null;
  }
  
  async getAllChannels(): Promise<Channel[]> {
    return Array.from(this.channels.values());
  }

  async saveChannel(channel: Channel): Promise<void> {
    const metadataToSave = typeof channel.metadata === 'object' ? JSON.stringify(channel.metadata) : channel.metadata;

    const dataToUpsert: PrismaChannel = {
        id: channel.id,
        name: channel.name,
        type: channel.type,
        metadata: metadataToSave,
        // pattern: channel.pattern, // include if part of your Channel and PrismaChannel types
        // participants: channel.metadata.participants, // If participants are stored at top level of PrismaChannel
        // Ensure all fields expected by Prisma model are here
    };
    
    // If your Prisma model for Channel has specific fields for participants, ensure they are mapped correctly
    // For example, if PrismaChannel has a `participants: string[]` field:
    // dataToUpsert.participants = channel.metadata.participants || [];

    await this.db.channel.upsert({
      where: { id: channel.id },
      create: dataToUpsert,
      update: dataToUpsert, // Only send fields that can be updated
    });
    
    // Ensure in-memory channel has metadata as an object
    const inMemoryMetadata = typeof channel.metadata === 'string' 
        ? JSON.parse(channel.metadata) as ChannelMetadata 
        : channel.metadata;

    this.channels.set(channel.id, { ...channel, metadata: inMemoryMetadata });
    this.logger.debug(`Saved channel ${channel.id}`);
  }

  async deleteChannel(channelId: string): Promise<void> {
    if (this.channels.has(channelId)) {
      this.channels.delete(channelId);
      await this.db.channel.delete({
        where: { id: channelId },
      });
      this.logger.info(`Deleted channel ${channelId}`);
    } else {
        this.logger.warn(`Attempted to delete non-existent channel (in-memory): ${channelId}`);
        // Optionally, still try to delete from DB in case it exists there
        try {
            await this.db.channel.delete({ where: { id: channelId } });
            this.logger.info(`Deleted channel ${channelId} from DB (was not in memory).`);
        } catch (e) {
            // this.logger.error(`Failed to delete channel ${channelId} from DB:`, e);
             this.logger.warn(`Channel ${channelId} not found in DB for deletion either.`);
        }
    }

    // Clean up routing table if it was used:
    // for (const sourceId of this.routingTable.keys()) {
    //   const routes = this.routingTable.get(sourceId);
    //   if (routes && routes.has(channelId)) {
    //     routes.delete(channelId);
    //     if (routes.size === 0) {
    //       this.routingTable.delete(sourceId);
    //     }
    //   }
    // }
  }

  async getChannelStats(channelId: string): Promise<Partial<ChannelMetadata> | null> {
    const channel = await this.getChannel(channelId); // Use getChannel to ensure DB fallback
    if (!channel) {
      this.logger.warn(`Channel ${channelId} not found for stats.`);
      return null;
    }
    return {
      messageCount: channel.metadata.messageCount,
      lastActive: channel.metadata.lastActive,
      subscribers: channel.metadata.subscribers,
      participants: channel.metadata.participants,
      type: channel.metadata.type, // This is channel.type, metadata.type is redundant if same
      created: channel.metadata.created,
      // description: channel.metadata.description, // if needed
      // tags: channel.metadata.tags, // if needed
    };
  }
  
  // Method to add a participant to a channel's metadata
  async addParticipantToChannel(channelId: string, participantId: string): Promise<Channel | null> {
    const channel = await this.getChannel(channelId);
    if (!channel) {
      this.logger.warn(`Channel ${channelId} not found, cannot add participant ${participantId}.`);
      return null;
    }
    if (!channel.metadata.participants) {
      channel.metadata.participants = [];
    }
    if (!channel.metadata.participants.includes(participantId)) {
      channel.metadata.participants.push(participantId);
      channel.metadata.lastActive = new Date().toISOString(); // Update activity
      await this.saveChannel(channel);
      this.logger.info(`Added participant ${participantId} to channel ${channelId}.`);
    }
    return channel;
  }

  // Method to remove a participant from a channel's metadata
  async removeParticipantFromChannel(channelId: string, participantId: string): Promise<Channel | null> {
    const channel = await this.getChannel(channelId);
    if (!channel) {
      this.logger.warn(`Channel ${channelId} not found, cannot remove participant ${participantId}.`);
      return null;
    }
    if (channel.metadata.participants) {
      const index = channel.metadata.participants.indexOf(participantId);
      if (index > -1) {
        channel.metadata.participants.splice(index, 1);
        channel.metadata.lastActive = new Date().toISOString(); // Update activity
        await this.saveChannel(channel);
        this.logger.info(`Removed participant ${participantId} from channel ${channelId}.`);
      }
    }
    return channel;
  }
}

// Define PrismaChannel at the end or import from a central types location if used across services
// For now, defining it here based on assumptions.
// Ensure this aligns with your actual Prisma schema for the 'channel' table.
// export interface PrismaChannel {
//   id: string;
//   name: string;
//   type: string; // In DB, enums are often strings
//   metadata: string | Prisma.JsonObject; // Prisma can handle JSON type or stringified JSON
//   pattern?: string | null;
//   participants?: string[]; // Example: if participants are stored directly on the channel model
//   createdAt: Date;
//   updatedAt: Date;
// }
// It's better to import PrismaChannel if it's generated by Prisma or defined in @the-new-fuse/database types
