import { Module } from '@nestjs/common';
import 'reflect-metadata';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FeatureModule } from './feature/feature.module';
import { CoreModule } from './core/core.module';
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