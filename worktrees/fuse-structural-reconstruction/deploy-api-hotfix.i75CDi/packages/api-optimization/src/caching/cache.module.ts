import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ResponseCacheService } from './response-cache.service';
import { CacheInterceptor } from './cache.interceptor';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [ResponseCacheService, CacheInterceptor],
  exports: [ResponseCacheService, CacheInterceptor]
})
export class CacheModule {}
