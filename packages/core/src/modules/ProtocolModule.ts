import { Module } from '@nestjs/common';
import { ProtocolAdapterRegistry } from '../protocols/ProtocolAdapterRegistry.js';
import { ProtocolTranslatorService } from '../services/protocol/protocol-translator.service.js';
import { ACAProtocolAdapter } from '../protocols/adapters/ACAProtocolAdapter.js';
import { GoogleA2AAdapter } from '../protocols/adapters/GoogleA2AAdapter.js';
import { AnthropicXmlAdapter } from '../protocols/adapters/AnthropicXmlAdapter.js';

/**
 * Protocol Module
 * 
 * This module provides protocol-related services and adapters.
 */
@Module({
  providers: [
    ProtocolAdapterRegistry,
    ProtocolTranslatorService,
    ACAProtocolAdapter,
    GoogleA2AAdapter,
    AnthropicXmlAdapter,
  ],
  exports: [
    ProtocolAdapterRegistry,
    ProtocolTranslatorService,
  ],
})
export class ProtocolModule {}
