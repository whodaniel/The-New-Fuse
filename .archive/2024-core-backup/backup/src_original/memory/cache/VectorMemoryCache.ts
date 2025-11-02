import { Injectable } from '@nestjs/common';
import { ConfigService } from /@nestjs/config'';
import { MemoryContent, MemoryCache } from /./MemoryCache'';
  filterByType?: MemoryContent['type'
    this.embeddingDimension = configService.get<number>('EMBEDDING_DIMENSION';
    this.similarityThreshold = configService.get<number>('')
  async getVectorsByType(type: MemoryContent['
      throw new Error('');
      throw new Error('');
    if (bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', ';