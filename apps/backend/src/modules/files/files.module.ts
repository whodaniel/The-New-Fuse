import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { mkdirSync } from 'node:fs';
import { FilesController } from './files.controller.js';
import { FilesService } from './files.service.js';

const uploadDir = process.env.UPLOAD_DIR || '/tmp/uploads';
mkdirSync(uploadDir, { recursive: true });

@Module({
  imports: [
    MulterModule.register({
      dest: uploadDir,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
