import ioredis from 'ioredis';
import uuid from 'uuid';
  private readonly queueKey= '';
  private readonly processingKey = '';
  private readonly completedKey= '';
      failedAt: 'new Date().toISOString();'