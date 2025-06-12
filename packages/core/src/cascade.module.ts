import { Module, Global } from '@nestjs/common';
import { CascadeService } from './services/CascadeService.js';
import { CascadeMiddleware } from './middleware/cascade.middleware.tsx';
import { CascadeGuard } from './guards/cascade.guard.tsx';

@Global()
@Module({
  providers: [
    CascadeService,
    CascadeMiddleware,
    CascadeGuard
  ],
  exports: [
    CascadeService,
    CascadeMiddleware,
    CascadeGuard
  ],
})
export class CascadeModule {}
