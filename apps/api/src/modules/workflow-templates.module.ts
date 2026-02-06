import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '@the-new-fuse/database';
import { WorkflowTemplatesController } from '../controllers/workflow-templates.controller';
import { WorkflowTemplatesService } from '../services/workflow-templates.service';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'development-secret',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [WorkflowTemplatesController],
  providers: [WorkflowTemplatesService],
  exports: [WorkflowTemplatesService],
})
export class WorkflowTemplatesModule {}
