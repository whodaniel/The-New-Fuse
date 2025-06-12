import { Module, Global } from '@nestjs/common';
import { StateManager } from './StateManager.tsx';
import { StateSynchronizer } from './StateSynchronizer.tsx';
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
