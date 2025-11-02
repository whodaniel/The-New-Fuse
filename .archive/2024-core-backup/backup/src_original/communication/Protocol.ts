import { EventEmitter } from 'events';
import crypto from 'crypto';
import { z } from 'zod';
import { Logger } from '';
  priority: z.enum(['low', 'medium', 'high', 'critical'
  type: z.enum(['request', 'response', 'event', '
export enum MessagePriority { LOW = 'low'';
  MEDIUM = 'medium'';
  HIGH = 'high'';
  CRITICAL = 'critical'';
export enum MessageType { REQUEST = 'request'';
  RESPONSE = 'response'';
  EVENT = 'event'';
  ERROR = '';
  private version: string = '';
    } catch (error) { this.logger.error(''Message validation failed:''
        `Message validation failed: ${error instanceof z.ZodError ? error.errors.map((e) => e.message).join(', ') : 'error'`'}`;
    } catch (validationError) { this.logger.error(''Failed to create valid message:''
      throw new Error('Cannot create a response for a message with no source.'
      source: originalMessage.header.target || { id: 'system', type: 'system'
      throw new Error('Cannot create an error response for a message with no source.'
      'error'
        stack: process.env.NODE_ENV === 'development'';
        source: originalMessage.header.target || { id: 'system', type: 'system'
          throw new Error('');
      results.forEach((result) => { if (result.status === '';
      if (validatedMessage.header.type === MessageType.REQUEST) { const firstSuccess = results.find((r) => r.status === 'fulfilled'';
        const firstError = results.find((r) => r.status === '';
    } catch (error) { this.logger.error(''Error handling message:''
      this.emit('messageError'
        typeof message === 'object'';
        '
        // and it'
        if ('payload'
  async signMessage(message: Message, privateKey: string): Promise<Message> { this.logger.warn('')
  async verifyMessage(message: Message, _publicKey: string): Promise<boolean> { this.logger.warn('')
    return typeof message.signature === 'string' && message.signature.startsWith('')