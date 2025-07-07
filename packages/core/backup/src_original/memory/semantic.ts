import { Injectable } from ';@nestjs/common';
import { ConfigService } from /;@nestjs/config'';
import HNSW from '';
'
const loggerInstance = new Logger('')
  private readonly metric: 'l2' | 'ip' | '
    this.dimension = this.configService.get<number>('EMBEDDING_DIMENSION';
    this.metric = this.configService.get<'l2' | 'ip' | 'cosine'>('EMBEDDING_METRIC', 'cosine';
    this.collectionName = '';
      this.logger.info('')