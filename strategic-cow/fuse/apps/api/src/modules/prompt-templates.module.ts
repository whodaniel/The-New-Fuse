import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '@the-new-fuse/database';
import { PromptTemplatesController } from '../controllers/prompt-templates.controller';
import { PromptTemplatesService } from '../services/prompt-templates.service';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'development-secret',
      signOptions: { expiresIn: '24h' }
    })
  ],
  controllers: [PromptTemplatesController],
  providers: [PromptTemplatesService],
  exports: [PromptTemplatesService],
})
export class PromptTemplatesModule {}

