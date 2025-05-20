import { Module, Global } from '@nestjs/common';
import { StateManager } from './StateManager.js';
import { StateSynchronizer } from './StateSynchronizer.js';
import { DatabaseModule } from '@the-new-fuse/database';

@Global()
@Module({
  imports: [
    DatabaseModule
  ],
  providers: [
    StateManager,
    StateSynchronizer
  ],
  exports: [
    StateManager,
    StateSynchronizer
  ]
})
export class StateModule {}
