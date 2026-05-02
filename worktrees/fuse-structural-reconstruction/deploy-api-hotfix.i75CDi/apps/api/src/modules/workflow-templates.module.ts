import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '@the-new-fuse/database';
import { WorkflowTemplatesController } from '../controllers/workflow-templates.controller';
import { WorkflowTemplatesService } from '../services/workflow-templates.service';

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be provided and be at least 32 characters long');
  }
  return secret;
};

@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({
      secret: getJwtSecret(),
      signOptions: { expiresIn: '24h' }
    })
  ],
  controllers: [WorkflowTemplatesController],
  providers: [WorkflowTemplatesService],
  exports: [WorkflowTemplatesService],
})
export class WorkflowTemplatesModule {}
