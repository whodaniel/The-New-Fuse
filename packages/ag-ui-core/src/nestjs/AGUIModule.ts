/**
 * NestJS Module for AG-UI Integration
 */

import { Global, Module } from '@nestjs/common';
import { AGUIService } from './AGUIService.js';

@Global()
@Module({
  providers: [AGUIService],
  exports: [AGUIService],
})
export class AGUIModule {}
