/**
 * Basic integration test for GitHub Copilot VS Code Integration
 * Verifies that the controller and service work together correctly
 */

import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CopilotIntegrationController } from '../controllers/CopilotIntegrationController';
import { CopilotIntegrationService } from '../services/CopilotIntegrationService';
import { WebSocketService } from '@the-new-fuse/core/websocket/websocket.service';

describe('CopilotIntegrationController', () => {
  let controller: CopilotIntegrationController;
  let service: CopilotIntegrationService;

  beforeEach(async () => {
    const mockWebSocketService = {
      on: jest.fn(),
      emit: jest.fn(),
    };

    const mockConfig = {
      enabled: true,
      maxParticipants: 10,
      defaultCapabilities: ['general_assistance']
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CopilotIntegrationController],
      providers: [
        {
          provide: CopilotIntegrationService,
          useValue: new CopilotIntegrationService(mockWebSocketService as any, mockConfig)
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CopilotIntegrationController>(CopilotIntegrationController);
    service = module.get<CopilotIntegrationService>(CopilotIntegrationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('createChatParticipant', () => {
    it('should create a chat participant successfully', async () => {
      const participantDto = {
        id: 'test-participant',
        name: 'test-participant',
        description: 'A test participant',
        fullName: 'Test Participant'
      };

      const tenantId = 'test-tenant';
      
      const result = await controller.createChatParticipant(participantDto, tenantId);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain(tenantId);
    });
  });

  describe('getChatParticipants', () => {
    it('should return an empty array initially', async () => {
      const tenantId = 'test-tenant';
      
      const participants = await controller.getChatParticipants(tenantId);
      
      expect(Array.isArray(participants)).toBe(true);
      expect(participants.length).toBe(0);
    });

    it('should return participants after creation', async () => {
      const participantDto = {
        id: 'test-participant',
        name: 'test-participant',
        description: 'A test participant',
        fullName: 'Test Participant'
      };

      const tenantId = 'test-tenant';
      
      // Create participant
      await controller.createChatParticipant(participantDto, tenantId);
      
      // Get participants
      const participants = await controller.getChatParticipants(tenantId);
      
      expect(participants.length).toBe(1);
      expect(participants[0].name).toBe(participantDto.name);
    });
  });

  describe('getStatus', () => {
    it('should return service status', async () => {
      const tenantId = 'test-tenant';
      
      const status = await controller.getStatus(tenantId);
      
      expect(status).toBeDefined();
      expect(status).toHaveProperty('initialized');
      expect(status).toHaveProperty('participantsCount');
      expect(status).toHaveProperty('activeSessionsCount');
    });
  });

  describe('getAgentTemplates', () => {
    it('should return available agent templates', async () => {
      const templates = await controller.getAgentTemplates();
      
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
      expect(templates[0]).toHaveProperty('id');
      expect(templates[0]).toHaveProperty('name');
      expect(templates[0]).toHaveProperty('capabilities');
    });
  });
});
