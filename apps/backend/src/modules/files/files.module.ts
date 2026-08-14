import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { mkdirSync } from 'node:fs';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { TNF_DIRECT_UPLOAD_MAX_BYTES } from './storage-policy';

const uploadDir = process.env.UPLOAD_DIR || '/tmp/uploads';
mkdirSync(uploadDir, { recursive: true });

@Module({
  imports: [
    MulterModule.register({
      dest: uploadDir,
      limits: {
        fileSize: TNF_DIRECT_UPLOAD_MAX_BYTES,
      },
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
