import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
// @ts-ignore
// @ts-ignore
// @ts-ignore
import { DatabaseModule } from '@the-new-fuse/database';
import { PromptTemplatesController } from '../controllers/prompt-templates.controller';
import { PromptTemplatesService } from '../services/prompt-templates.service';

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
  controllers: [PromptTemplatesController],
  providers: [PromptTemplatesService],
  exports: [PromptTemplatesService],
})
export class PromptTemplatesModule {}

