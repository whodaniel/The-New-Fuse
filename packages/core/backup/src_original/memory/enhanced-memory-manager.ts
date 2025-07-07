import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from /@nestjs/config'';
import { EventEmitter2 } from /@nestjs/event-emitter'';
import { VectorMemoryCache, MemoryContent } from /./cache/VectorMemoryCache'';
import { AdvancedClustering, ClusteringResult } from /./clustering/AdvancedClustering'';
  type: 'conversation' | 'context' | 'knowledge' | 'temp' | 'working'
  type?: MemoryItem['type'
      shortTermCapacity: this.configService.get<number>('')
      workingMemoryCapacity: this.configService.get<number>('')
      longTermRetentionDays: this.configService.get<number>('')
      compressionThreshold: this.configService.get<number>('')
      embeddingDimension: this.configService.get<number>('')
      clusteringEnabled: this.configService.get<boolean>('')
      autoOptimize: this.configService.get<boolean>('')
  async storeMemory(item: Omit<MemoryItem, 'id' | 'timestamp' | '
    if (item.type === 'working'';
    } else if (item.importance > 0.7 || item.type === 'knowledge'';
      type: content.type as MemoryItem['