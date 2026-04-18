import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ResponseCacheService } from './response-cache.service.js';
import { CacheInterceptor } from './cache.interceptor.js';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [ResponseCacheService, CacheInterceptor],
  exports: [ResponseCacheService, CacheInterceptor]
})
export class CacheModule {}
