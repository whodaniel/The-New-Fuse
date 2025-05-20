import { Module, Global } from '@nestjs/common';
import { CacheService } from './CacheService.js';

@Global()
@Module({
  providers: [
    CacheService
  ],
  exports: [
    CacheService
  ]
})
export class CacheModule {}
