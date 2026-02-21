import { Module } from '@nestjs/common';
import { TaskModule } from '../task/task.module';
import { DirectorService } from './director.service';

@Module({
  imports: [TaskModule],
  providers: [DirectorService],
  exports: [DirectorService],
})
export class DirectorModule {}
