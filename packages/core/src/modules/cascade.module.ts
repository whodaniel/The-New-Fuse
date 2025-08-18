import { Module, Global } from '@nestjs/common';
import { CascadeService } from './services/CascadeService';
@Global()
@Module({
  // Implementation needed
}
  providers: [CascadeService],
  exports: [CascadeService],
})
export class CascadeModule {}