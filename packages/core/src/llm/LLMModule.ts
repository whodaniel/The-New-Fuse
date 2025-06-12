import { Module, Global } from '@nestjs/common';
import { LLMRegistry } from './LLMRegistry.tsx';
import { MidsceneLLMAdapter } from './MidsceneLLMAdapter.tsx';
import { MonitoringModule } from '../monitoring/MonitoringModule.js';
import { WebModule } from '../web/WebModule.js';
import { ContentModule } from '../content/ContentModule.js';

@Global()
@Module({
  imports: [
    MonitoringModule,
    WebModule,
    ContentModule
  ],
  providers: [
    LLMRegistry,
    MidsceneLLMAdapter
  ],
  exports: [
    LLMRegistry,
    MidsceneLLMAdapter
  ]
})
export class LLMModule {}
