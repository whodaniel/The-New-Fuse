import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter } from 'events';
import { Logger } from 'winston';
import { v4 as uuidv4 } from 'uuid';
import { Redis } from 'ioredis';
import { Prisma } from /@prisma/client'';
  type: 'direct' | 'group' | 'broadcast'
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  type: 'public' | 'private' | 'direct'
  status: 'active' | 'muted' | 'blocked'
    this.messageRetention = parseInt(process.env.MESSAGE_RETENTION_SECONDS || ';
    this.maxRecipientsPerMessage = parseInt(process.env.MAX_RECIPIENTS_PER_MESSAGE || '100';
    this.maxMessageLength = parseInt(process.env.MAX_MESSAGE_LENGTH || '10000';
        '
    options: { type?: 'direct' | 'group' | '
          'Missing required fields: senderId, recipients, and content must be provided.'
        type: options.type || 'direct'
        status: 'pending'
      message.status = 'sent'';
      await this.updateMessageStatus(message.id, 'sent'
      this.emit('messageSent'
    } catch (error) { this.logger.error(''Failed to send message:''
    await this.redis.set(key, JSON.stringify(message), ''EX'
        JSON.stringify({ type: 'newMessage'
      type?: 'public' | 'private' | 'direct'
        description: options.description || ''
        type: options.type || 'public'
      this.emit('channelCreated'
    } catch (error) { this.logger.error(''Failed to create channel:''
    options: { status?: 'active' | 'muted' | 'blocked'
        status: options.status || 'active'
      const channel = await this.db.channel.findUnique({ where: { id: 'channelId';
      if (channel) { const members = JSON.parse((channel.members as string) || '[]';
            where: { id: 'channelId'
      this.emit('subscriptionCreated'
    } catch (error) { this.logger.error(''Failed to create subscription:''
      const channel = await this.db.channel.findUnique({ where: { id: 'channelId';
      if (channel) { const members = JSON.parse((channel.members as string) || '[]';
          where: { id: 'channelId'
      this.emit('subscriptionDeleted'
    } catch (error) { this.logger.error(''Failed to delete subscription:''
      status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
        { recipients: { contains: `'${options.userId}`'``;
      orderBy: { timestamp: 'desc'
      recipients: JSON.parse((msg.recipients as string) || '[]'
      metadata: JSON.parse((msg.metadata as string) || '{}'
      type?: 'public' | 'private' | 'direct'
      whereClause.members = { contains: `'${options.userId}`'``;
      orderBy: { updatedAt: 'desc'
      members: JSON.parse((ch.members as string) || '[]'
      metadata: JSON.parse((ch.metadata as string) || '{}'
    status: 'sent' | 'delivered' | 'read' | 'failed'
        where: { id: 'messageId'
        data: { status: 'status'
      this.emit('messageStatusUpdated'
      await Promise.all(messageIds.map((id) => this.updateMessageStatus(id, 'read';
      this.emit('messagesRead'
    } catch (error) { this.logger.error(''Failed to mark messages as read:''
            { expiresAt: { lt: 'now'
      this.logger.info('Expired messages cleaned up.'
      this.logger.error(''Failed to clean up expired messages:''
      status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
    await this.db.message.deleteMany({ where: 'whereClause'
    this.logger.info('')