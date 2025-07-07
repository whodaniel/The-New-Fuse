import { Module, Global } from '@nestjs/common';
import { CascadeService } from './services/CascadeService';

@Global()
@Module({
  providers: [CascadeService],
  exports: [CascadeService],
})
export class CascadeModule {}