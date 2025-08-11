import { Module, Global } from '@nestjs/common';
import { ConfigService } from './ConfigService';
@Global()
@Module({
  // Implementation needed
}
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}