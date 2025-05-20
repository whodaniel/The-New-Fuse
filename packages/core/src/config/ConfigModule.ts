import { Module, Global } from '@nestjs/common';
import { ConfigManager } from './ConfigManager.js';
import { ConfigValidator } from './ConfigValidator.js';
import { DatabaseModule } from '@the-new-fuse/database';

@Global()
@Module({
  imports: [
    DatabaseModule
  ],
  providers: [
    ConfigManager,
    ConfigValidator
  ],
  exports: [
    ConfigManager,
    ConfigValidator
  ]
})
export class ConfigModule {}
