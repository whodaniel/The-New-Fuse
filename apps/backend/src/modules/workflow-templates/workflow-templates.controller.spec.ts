import { Test, TestingModule } from '@nestjs/testing';
import { CreateWorkflowTemplateDto, UpdateWorkflowTemplateDto } from './dto/workflow-template.dto';
import { WorkflowTemplatesController } from './workflow-templates.controller';
import { WorkflowTemplatesService } from './workflow-templates.service';

describe('WorkflowTemplatesController', () => {
  let controller: WorkflowTemplatesController;
  let service: WorkflowTemplatesService;

  const mockWorkflowTemplatesService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkflowTemplatesController],
      providers: [
        {
          provide: WorkflowTemplatesService,
          useValue: mockWorkflowTemplatesService,
        },
      ],
    }).compile();

    controller = module.get<WorkflowTemplatesController>(WorkflowTemplatesController);
    service = module.get<WorkflowTemplatesService>(WorkflowTemplatesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all workflow templates', async () => {
      const mockTemplates = [
        {
          id: 'tmpl_001',
          name: 'Test Template',
          description: 'Test description',
          template: { nodes: [], edges: [] },
          createdBy: 'usr_123',
          isPublic: true,
          usageCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockWorkflowTemplatesService.findAll.mockResolvedValue(mockTemplates);

      const result = await controller.findAll();

      expect(result).toEqual(mockTemplates);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a template by ID', async () => {
      const templateId = 'tmpl_001';
      const mockTemplate = {
        id: templateId,
        name: 'Test Template',
        description: 'Test description',
        template: { nodes: [], edges: [] },
        createdBy: 'usr_123',
        isPublic: true,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockWorkflowTemplatesService.findOne.mockResolvedValue(mockTemplate);

      const result = await controller.findOne(templateId);

      expect(result).toEqual(mockTemplate);
      expect(service.findOne).toHaveBeenCalledWith(templateId);
    });
  });

  describe('create', () => {
    it('should create a new workflow template', async () => {
      const createDto: CreateWorkflowTemplateDto = {
        name: 'New Template',
        description: 'New description',
        template: { nodes: [], edges: [] },
        isPublic: false,
      };

      const mockTemplate = {
        id: 'tmpl_002',
        ...createDto,
        createdBy: 'usr_123',
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockWorkflowTemplatesService.create.mockResolvedValue(mockTemplate);

      const req = { user: { id: 'usr_123' } };
      const result = await controller.create(createDto, req);

      expect(result).toEqual(mockTemplate);
      expect(service.create).toHaveBeenCalledWith(createDto, 'usr_123');
    });
  });

  describe('update', () => {
    it('should update a workflow template', async () => {
      const templateId = 'tmpl_001';
      const updateDto: UpdateWorkflowTemplateDto = {
        name: 'Updated Template',
        description: 'Updated description',
      };

      const mockUpdatedTemplate = {
        id: templateId,
        name: updateDto.name,
        description: updateDto.description,
        template: { nodes: [], edges: [] },
        createdBy: 'usr_123',
        isPublic: true,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockWorkflowTemplatesService.update.mockResolvedValue(mockUpdatedTemplate);

      const result = await controller.update(templateId, updateDto);

      expect(result).toEqual(mockUpdatedTemplate);
      expect(service.update).toHaveBeenCalledWith(templateId, updateDto);
    });
  });

  describe('delete', () => {
    it('should delete a workflow template', async () => {
      const templateId = 'tmpl_001';

      mockWorkflowTemplatesService.delete.mockResolvedValue(undefined);

      await controller.delete(templateId);

      expect(service.delete).toHaveBeenCalledWith(templateId);
      expect(service.delete).toHaveBeenCalledTimes(1);
    });
  });
});
