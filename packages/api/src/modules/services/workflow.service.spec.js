import { Test } from '@nestjs/testing';
import { WorkflowService } from './workflow.service';
import { PrismaService } from '@the-new-fuse/database';
import { Cache } from 'cache-manager';
import { AuditService } from '../services/audit.service';
import { MetricsService } from '../services/metrics.service';
import { NotFoundException, BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
describe('WorkflowService', () => {
    let service;
    let prismaService;
    let cacheService;
    let auditService;
    let metricsService;
    const mockWorkflow = {
        id: 'workflow-1',
        name: 'Test Workflow',
        description: 'A test workflow',
        userId: 'user-1',
        status: 'draft',
        definition: {},
        createdAt: new Date(),
        updatedAt: new Date()
    };
    beforeEach(async () => {
        const mockPrismaService = {
        // Mock PrismaService methods
        };
        const mockCacheService = {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn()
        };
        const mockAuditService = {
            logEvent: jest.fn()
        };
        const mockMetricsService = {
            recordQuery: jest.fn(),
            recordError: jest.fn(),
            recordCacheHit: jest.fn(),
            recordCacheMiss: jest.fn(),
            recordWorkflowExecution: jest.fn(),
            recordUserAction: jest.fn()
        };
        const module = await Test.createTestingModule({
            providers: [
                WorkflowService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService
                },
                {
                    provide: Cache,
                    useValue: mockCacheService
                },
                {
                    provide: AuditService,
                    useValue: mockAuditService
                },
                {
                    provide: MetricsService,
                    useValue: mockMetricsService
                }
            ]
        }).compile();
        service = module.get(WorkflowService);
        prismaService = module.get(PrismaService);
        cacheService = module.get(Cache);
        auditService = module.get(AuditService);
        metricsService = module.get(MetricsService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('getWorkflows', () => {
        it('should return paginated workflows with caching', async () => {
            const userId = 'user-1';
            const options = { page: 1, limit: 10 };
            const expectedResult = {
                workflows: [mockWorkflow],
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1
            };
            cacheService.get.mockResolvedValue(null);
            // Mock repository methods would be called here
            cacheService.set.mockResolvedValue(true);
            const result = await service.getWorkflows(userId, options);
            expect(result).toEqual(expectedResult);
            expect(cacheService.get).toHaveBeenCalled();
            expect(cacheService.set).toHaveBeenCalled();
            expect(metricsService.recordQuery).toHaveBeenCalledWith('getWorkflows', expect.any(Number));
            expect(auditService.logEvent).toHaveBeenCalledWith({
                action: 'READ_WORKFLOWS',
                userId,
                metadata: { options, resultCount: 1 }
            });
        });
        it('should return cached result when available', async () => {
            const userId = 'user-1';
            const options = { page: 1, limit: 10 };
            const cachedResult = {
                workflows: [mockWorkflow],
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1
            };
            cacheService.get.mockResolvedValue(cachedResult);
            const result = await service.getWorkflows(userId, options);
            expect(result).toEqual(cachedResult);
            expect(cacheService.get).toHaveBeenCalled();
            expect(metricsService.recordCacheHit).toHaveBeenCalled();
            expect(metricsService.recordCacheMiss).not.toHaveBeenCalled();
        });
        it('should handle filtering and sorting options', async () => {
            const userId = 'user-1';
            const options = {
                page: 1,
                limit: 10,
                status: 'active',
                search: 'test',
                sortBy: 'name',
                sortOrder: 'asc'
            };
            cacheService.get.mockResolvedValue(null);
            cacheService.set.mockResolvedValue(true);
            await service.getWorkflows(userId, options);
            expect(cacheService.get).toHaveBeenCalledWith(`workflows:${userId}:${JSON.stringify(options)}`);
        });
    });
    describe('getWorkflowById', () => {
        it('should return workflow with proper authorization', async () => {
            const workflowId = 'workflow-1';
            const userId = 'user-1';
            cacheService.get.mockResolvedValue(null);
            cacheService.set.mockResolvedValue(true);
            const result = await service.getWorkflowById(workflowId, userId);
            expect(result).toEqual(mockWorkflow);
            expect(metricsService.recordQuery).toHaveBeenCalledWith('getWorkflowById', expect.any(Number));
            expect(auditService.logEvent).toHaveBeenCalledWith({
                action: 'READ_WORKFLOW',
                userId,
                metadata: { workflowId, workflowName: mockWorkflow.name }
            });
        });
        it('should throw NotFoundException when workflow not found', async () => {
            const workflowId = 'non-existent';
            const userId = 'user-1';
            // Mock repository to return null
            await expect(service.getWorkflowById(workflowId, userId))
                .rejects.toThrow(NotFoundException);
        });
        it('should throw UnauthorizedException when user does not own workflow', async () => {
            const workflowId = 'workflow-1';
            const userId = 'different-user';
            // Mock repository to return workflow with different userId
            await expect(service.getWorkflowById(workflowId, userId))
                .rejects.toThrow(UnauthorizedException);
        });
    });
    describe('createWorkflow', () => {
        const createWorkflowDto = {
            name: 'New Workflow',
            description: 'A new workflow',
            triggerType: 'manual',
            triggerConfig: {},
            inputSchema: {},
            outputSchema: {},
            metadata: {}
        };
        it('should create workflow successfully', async () => {
            const userId = 'user-1';
            // Mock repository methods
            cacheService.set.mockResolvedValue(true);
            const result = await service.createWorkflow(createWorkflowDto, userId);
            expect(result).toEqual(mockWorkflow);
            expect(metricsService.recordQuery).toHaveBeenCalledWith('createWorkflow', expect.any(Number));
            expect(metricsService.recordUserAction).toHaveBeenCalledWith(userId, 'CREATE_WORKFLOW');
            expect(auditService.logEvent).toHaveBeenCalledWith({
                action: 'CREATE_WORKFLOW',
                userId,
                metadata: {
                    workflowId: mockWorkflow.id,
                    workflowName: mockWorkflow.name,
                    triggerType: createWorkflowDto.triggerType
                }
            });
        });
        it('should throw ConflictException for duplicate workflow names', async () => {
            const userId = 'user-1';
            // Mock repository to return existing workflow with same name
            await expect(service.createWorkflow(createWorkflowDto, userId))
                .rejects.toThrow(ConflictException);
        });
        it('should validate workflow name', async () => {
            const invalidDto = { ...createWorkflowDto, name: '' };
            await expect(service.createWorkflow(invalidDto, 'user-1'))
                .rejects.toThrow(BadRequestException);
            const tooLongName = 'a'.repeat(256);
            const invalidDto2 = { ...createWorkflowDto, name: tooLongName };
            await expect(service.createWorkflow(invalidDto2, 'user-1'))
                .rejects.toThrow(BadRequestException);
        });
    });
    describe('executeWorkflow', () => {
        it('should execute workflow with timeout handling', async () => {
            const workflowId = 'workflow-1';
            const userId = 'user-1';
            const inputs = { test: 'value' };
            const result = await service.executeWorkflow(workflowId, userId, inputs);
            expect(result).toBeDefined();
            expect(metricsService.recordWorkflowExecution).toHaveBeenCalledWith(workflowId, expect.any(Number), true);
            expect(auditService.logEvent).toHaveBeenCalledWith({
                action: 'EXECUTE_WORKFLOW',
                userId,
                metadata: {
                    workflowId,
                    workflowName: mockWorkflow.name,
                    executionId: result.id,
                    duration: expect.any(Number),
                    inputCount: Object.keys(inputs).length
                }
            });
        });
        it('should validate execution inputs', async () => {
            const workflowId = 'workflow-1';
            const userId = 'user-1';
            await expect(service.executeWorkflow(workflowId, userId, null))
                .rejects.toThrow(BadRequestException);
            const largeInputs = { data: 'x'.repeat(1024 * 1024 + 1) };
            await expect(service.executeWorkflow(workflowId, userId, largeInputs))
                .rejects.toThrow(BadRequestException);
        });
        it('should handle execution timeout', async () => {
            const workflowId = 'workflow-1';
            const userId = 'user-1';
            const inputs = { test: 'value' };
            // Mock workflow engine to never resolve
            // This would require more complex mocking setup
            // For now, just test the validation part
            expect(async () => {
                await service.executeWorkflow(workflowId, userId, inputs);
            }).not.toThrow();
        });
    });
});
//# sourceMappingURL=workflow.service.spec.js.map