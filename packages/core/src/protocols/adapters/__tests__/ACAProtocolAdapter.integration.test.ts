import { Test } from '@nestjs/testing';
import { A2AModule } from '../../../modules/A2AModule.js';
import { ProtocolAdapterService } from '../../ProtocolAdapterService.js';
import { ACAProtocolAdapter } from '../ACAProtocolAdapter.js';

describe('ACAProtocolAdapter Integration', () => {
  let protocolAdapterService: ProtocolAdapterService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [A2AModule], // Import the module that provides the adapter and service
    }).compile();

    protocolAdapterService = moduleRef.get<ProtocolAdapterService>(ProtocolAdapterService);
  });

  it('should register ACAProtocolAdapter with ProtocolAdapterService', () => {
    const adapters = protocolAdapterService.getAdapters();
    const acaAdapterExists = adapters.some(adapter => adapter instanceof ACAProtocolAdapter);
    expect(acaAdapterExists).toBe(true);
    // Add more specific checks if needed, e.g., checking if it's the default
  });

  // Add more integration tests as needed, e.g., testing message handling through the service
});
