import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from /@nestjs/config'';
import { v4 as uuidv4 } from 'uuid';
} from /./types';
import { CodeScanner, SecurityIssueSeverity } from /./security/code-scanner'';
import { RateLimiter } from /./security/rate-limiter'';
        allowedModules: ['path', util'
        allowedModules: ['path', util', crypto', fs', http', https'
        allowedModules: ['path', util', crypto', fs', http', https', zlib', stream'
        allowedModules: ['
    this.cloudflareWorkerUrl = this.configService.get<string>('')
    this.apiKey = this.configService.get<string>('CODE_EXECUTION_API_KEY';
    this.logger.log('')
          environment: request.environment || '
          Content-Type/: application/'json'
          Authorization'
    this.logger.log('')
        orderBy: { createdAt: ''
        environment: record.environment as sandbox' | container'
        by: ['
        by: ['
        by: ['