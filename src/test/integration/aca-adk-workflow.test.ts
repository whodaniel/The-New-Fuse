import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module.js'; // Assuming a main AppModule exists
import { ADKBridgeService } from '../../services/ADKBridgeService.js';
import { ProtocolAdapterService } from '@the-new-fuse/core'; // Adjust import if needed

// Mock Agent class or handler that uses ADKBridgeService upon receiving an ACA message
class MockAgentHandler {
  constructor(
    private readonly adkBridgeService: ADKBridgeService,
    private readonly protocolAdapterService: ProtocolAdapterService
  ) {
    // Register a mock handler for ACA messages
    this.protocolAdapterService.registerMessageHandler('ACA', this.handleAcaMessage.bind(this));
  }

  async handleAcaMessage(message: { payload: { action: string; toolInput: any; toolName: string } }): Promise<any> {
    console.log('MockAgentHandler received ACA message:', message);
    if (message.payload.action === 'callAdkTool') {
      try {
        const result = await this.adkBridgeService.callTool(message.payload.toolName, message.payload.toolInput);
        return { success: true, result };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
    return { success: false, error: 'Unknown action' };
  }
}

describe('ACA to ADK Workflow Integration Test', () => {
  let adkBridgeService: ADKBridgeService;
  let protocolAdapterService: ProtocolAdapterService;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    // Mock the ADKBridgeService's callTool method
    const mockCallTool = jest.fn().mockResolvedValue({ summary: 'Mock ADK result' });

    moduleRef = await Test.createTestingModule({
      // Import necessary modules. Might need CoreModule or specific modules providing the services.
      // imports: [AppModule], // Use AppModule or more specific modules if possible
      providers: [
        // Provide the real ProtocolAdapterService if possible, or a mock if needed
        ProtocolAdapterService,
        // Provide the mock ADKBridgeService
        { provide: ADKBridgeService, useValue: { callTool: mockCallTool } },
        // Provider for our mock agent handler
        MockAgentHandler,
      ],
    }).compile();

    adkBridgeService = moduleRef.get<ADKBridgeService>(ADKBridgeService);
    protocolAdapterService = moduleRef.get<ProtocolAdapterService>(ProtocolAdapterService);
    // Instantiate the handler to register the ACA message listener
    moduleRef.get<MockAgentHandler>(MockAgentHandler);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('should handle an ACA message and successfully call an ADK tool via ADKBridgeService', async () => {
    const testMessage = {
      targetAgentId: 'mockAgent',
      protocol: 'ACA',
      payload: {
        action: 'callAdkTool',
        toolName: 'summarizer',
        toolInput: { text: 'some long text' },
      },
    };

    // Simulate sending the message through the ProtocolAdapterService
    // The registered MockAgentHandler should pick it up
    const response = await protocolAdapterService.sendMessage(testMessage);

    // Verify ADKBridgeService.callTool was called correctly
    expect(adkBridgeService.callTool).toHaveBeenCalledWith('summarizer', { text: 'some long text' });

    // Verify the response indicates success and contains the mocked result
    expect(response.success).toBe(true);
    expect(response.result).toEqual({ summary: 'Mock ADK result' });
  });
});
