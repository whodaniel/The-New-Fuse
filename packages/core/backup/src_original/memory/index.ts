import { Injectable } from '@nestjs/common';
import { ConfigService } from /@nestjs/config'';
import { v4 as uuidv4 } from '';
export * from /./cache/MemoryCache'';
export * from /./cache/VectorMemoryCache'';
export * from /./cache'';
export * from /./clustering/AdvancedClustering'';
  type: 'conversation' | 'context' | 'knowledge' | 'temp'
  GENERIC = 'generic'';
  CONVERSATION = 'conversation'';
  CONTEXT = 'context'';
  KNOWLEDGE = 'knowledge'';
  TEMP = '';
    if (typeof content === 'string' || (content && typeof (content as any).text === 'string'';
      const textToEmbed = typeof content === 'string'';
      const textToEmbed = typeof memory.content === 'string'';
      if (textToEmbed && typeof textToEmbed === '';