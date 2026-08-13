import { Module, Global } from '@nestjs/common';
import { StateService } from './StateService.js';
import { StateManager } from './StateManager.js';

@Global()
@Module({
  providers: [StateService, StateManager],
  exports: [StateService, StateManager],
})
export class StateModule {}
