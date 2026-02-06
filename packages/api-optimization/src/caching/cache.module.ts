import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheInterceptor } from './cache.interceptor';
import { ResponseCacheService } from './response-cache.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [ResponseCacheService, CacheInterceptor],
  exports: [ResponseCacheService, CacheInterceptor],
})
export class CacheModule {}
