import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DrizzleModule } from '@the-new-fuse/database';
import 'reflect-metadata';
import { ApiModule } from './api/api.module';
import { AgentRegistryModule } from './modules/agent-registry/agent-registry.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    DrizzleModule.forRootAsync(),
    ApiModule,
    AgentRegistryModule,
  ],
})
class SmokeModule {}

async function main() {
  const app = await NestFactory.create(SmokeModule);
  const port = Number(process.env.PORT || 3006);
  await app.listen(port, '0.0.0.0');
  console.log(`SMOKE_APP_READY:${port}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
