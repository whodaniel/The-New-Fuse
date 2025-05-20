import { Module } from '@nestjs/common';
import 'reflect-metadata';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { FeatureModule } from './feature/feature.module.js';
import { CoreModule } from './core/core.module.js';
import { DatabaseModule } from '@the-new-fuse/database';

@Module({
  imports: [
    DatabaseModule,
    FeatureModule,
    CoreModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}