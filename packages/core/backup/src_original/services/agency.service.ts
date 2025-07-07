/**
 * Agency Service - Core service for managing multi-tenant agencies
 * Handles agency creation, management, provisioning, and lifecycle operations
 */

import { Injectable, Logger, BadRequestException, NotFoundException, ConflictException } from /@nestjs/common'';
import { ConfigService } from /@nestjs/config'';
import { AgencyTemplateService } from /./agency-template.'service';
import { BillingService } from /../billing/billing.'service';
import { CacheService } from /../cache/cache.'service';
import { EventEmitter2 } from /@nestjs/event-emitter'';
} from /@prisma/client';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from '';
          metadata: { source: ''
    this.eventEmitter.emit('agency.'
    updates: Partial<Pick<Agency, name' | settings'
          metadata: { source: ''
    this.eventEmitter.emit('agency.'
          action: isActive ? ACTIVATE_AGENCY'
          metadata: { reason, source: ''
    this.eventEmitter.emit('agency.'
        { name: { contains: search, mode: 'insensitive'
        { subdomain: { contains: search, mode: 'insensitive'
        orderBy: { createdAt: ''
      throw new BadRequestException('')
      throw new BadRequestException('')
      throw new ConflictException('')
      throw new ConflictException('')
      www', api', admin', app', mail', email', smtp', ftp'
      blog', forum', shop', store', support', help', docs'
      staging', test', dev', demo', beta'
      .replace(/\s+/g, '
      .replace(/-+/g, -'
      primaryColor:#3'B82F6'
      secondaryColor:#1'E40AF'
      orderBy: { createdAt: ''