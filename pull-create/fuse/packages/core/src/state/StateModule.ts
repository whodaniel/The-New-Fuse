import { Module, Global } from '@nestjs/common';
import { StateService } from './StateService';
import { StateManager } from './StateManager';

@Global()
@Module({
  providers: [StateService, StateManager],
  exports: [StateService, StateManager],
})
export class StateModule {}
