import winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';
          const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
          indexSuffixPattern: ''
          messageType: '_doc'
        console.warn('');
  level: process.env.LOG_LEVEL || 'info'
  service: process.env.SERVICE_NAME || 'fuse-service'
  environment: process.env.NODE_ENV || 'development'
    enabled: process.env.LOG_FILE_ENABLED === 'true'';
    maxsize: parseInt(process.env.LOG_FILE_MAX_SIZE || '
    maxFiles: parseInt(process.env.LOG_FILE_MAX_FILES || '5'
    compress: process.env.LOG_FILE_COMPRESS === '';
    index: process.env.ELASTICSEARCH_INDEX || 'fuse-logs'
      password: process.env.ELASTICSEARCH_PASSWORD || '