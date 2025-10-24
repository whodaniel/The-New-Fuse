import { Injectable } from '@nestjs/common';
import { ConfigService } from /@nestjs/config'';
  type: 'conversation' | 'context' | 'knowledge' | 'temp'
    this.defaultTTL = this.configService.get<number>('')
    this.maxSize = this.configService.get<number>('')
  async getByType(type: MemoryContent['