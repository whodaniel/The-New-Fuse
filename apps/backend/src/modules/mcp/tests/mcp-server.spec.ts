import { Test, TestingModule } from '@nestjs/testing';
import { MCPServerService } from '../mcp-server.service';
import { MCPToolRegistry } from '../mcp-tool-registry.service';
import { WorkflowTemplatesService } from '../../workflow-templates/workflow-templates.service';

describe('MCPServerService', () => {
  let service: MCPServerService;
  let toolRegistry: MCPToolRegistry;

  beforeEach(async () => {
    // Create mock WorkflowTemplatesService
    const mockWorkflowService = {
      findAll: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MCPServerService,
        MCPToolRegistry,
        {
          provide: WorkflowTemplatesService,
          useValue: mockWorkflowService,
        },
      ],
    }).compile();

    service = module.get<MCPServerService>(MCPServerService);
    toolRegistry = module.get<MCPToolRegistry>(MCPToolRegistry);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have a tool registry', () => {
    expect(toolRegistry).toBeDefined();
  });

  describe('getServerStatus', () => {
    it('should return server status information', async () => {
      // Initialize the server first
      await service.onModuleInit();

      const status = await service.getServerStatus();

      expect(status).toBeDefined();
      expect(status).toHaveProperty('server');
      expect(status.server).toHaveProperty('name');
      expect(status.server).toHaveProperty('version');
      expect(status.server).toHaveProperty('status');
      expect(status).toHaveProperty('health');
      expect(status).toHaveProperty('tools');
    });
  });

  describe('tool registry', () => {
    it('should register all default tools', () => {
      const tools = toolRegistry.getAllTools();
      expect(tools.length).toBeGreaterThan(0);
    });

    it('should retrieve tools by name', () => {
      const tool = toolRegistry.getTool('system.health');
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('system.health');
    });

    it('should group tools by category', () => {
      const groups = toolRegistry.getToolGroups();
      expect(groups).toContain('system');
      expect(groups).toContain('workflow');
    });

    it('should retrieve tools by group', () => {
      const systemTools = toolRegistry.getToolsByGroup('system');
      expect(systemTools.length).toBeGreaterThan(0);
      expect(systemTools.every(t => t.name.startsWith('system.'))).toBe(true);
    });
  });
});
