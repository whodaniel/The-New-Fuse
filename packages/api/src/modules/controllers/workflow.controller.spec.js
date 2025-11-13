import { Test } from '@nestjs/testing';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from '../services/workflow.service';
describe('WorkflowController', () => {
    let controller;
    let workflowService;
    const mockWorkflow = {
        id: 'workflow-1',
        name: 'Test Workflow',
        description: 'A test workflow',
        status: 'draft',
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date()
    };
    const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User'
    };
    beforeEach(async () => {
        const mockWorkflowService = {
            getWorkflows: jest.fn(),
            getWorkflowById: jest.fn(),
            createWorkflow: jest.fn(),
            updateWorkflow: jest.fn(),
            deleteWorkflow: jest.fn(),
            executeWorkflow: jest.fn(),
            getWorkflowExecutions: jest.fn(),
            getExecutionById: jest.fn()
        };
        const module = await Test.createTestingModule({
            controllers: [WorkflowController],
            providers: [
                {
                    provide: WorkflowService,
                    useValue: mockWorkflowService
                }
            ]
        }).compile();
        controller = module.get(WorkflowController);
        workflowService = module.get(WorkflowService);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
    describe('getWorkflows', () => {
        it('should return paginated workflows', async () => {
            const expectedResult = {
                success: true,
                data: {
                    workflows: [mockWorkflow],
                    total: 1,
                    page: 1,
                    limit: 20,
                    totalPages: 1
                }
            };
            workflowService.getWorkflows.mockResolvedValue(expectedResult.data);
            const result = await controller.getWorkflows(mockUser);
            expect(result).toEqual(expectedResult);
            expect(workflowService.getWorkflows).toHaveBeenCalledWith(mockUser?.id || 'default-user');
        });
        it('should handle queries with options', async () => {
            const expectedResult = {
                success: true,
                data: {
                    workflows: [mockWorkflow],
                    total: 1,
                    page: 1,
                    limit: 10,
                    totalPages: 1
                }
            };
            workflowService.getWorkflows.mockResolvedValue(expectedResult.data);
            const result = await controller.getWorkflows(mockUser);
            expect(result).toEqual(expectedResult);
            expect(workflowService.getWorkflows).toHaveBeenCalledWith(mockUser?.id || 'default-user');
        });
    });
    describe('getWorkflow', () => {
        it('should return a single workflow', async () => {
            const expectedResult = {
                success: true,
                data: mockWorkflow
            };
            workflowService.getWorkflowById.mockResolvedValue(mockWorkflow);
            const result = await controller.getWorkflow('workflow-1', mockUser);
            expect(result).toEqual(expectedResult);
            expect(workflowService.getWorkflowById).toHaveBeenCalledWith('workflow-1', mockUser?.id || 'default-user');
        });
        it('should handle workflow not found', async () => {
            workflowService.getWorkflowById.mockRejectedValue(new Error('Workflow not found'));
            const result = await controller.getWorkflow('non-existent', mockUser);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Failed to get workflow');
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
        it('should create a new workflow', async () => {
            const expectedResult = {
                success: true,
                data: mockWorkflow
            };
            workflowService.createWorkflow.mockResolvedValue(mockWorkflow);
            const result = await controller.createWorkflow(createWorkflowDto, mockUser);
            expect(result).toEqual(expectedResult);
            expect(workflowService.createWorkflow).toHaveBeenCalledWith(createWorkflowDto, mockUser?.id || 'default-user');
        });
        it('should handle validation errors', async () => {
            const invalidDto = { ...createWorkflowDto, name: '' };
            workflowService.createWorkflow.mockRejectedValue(new Error('Invalid workflow data'));
            const result = await controller.createWorkflow(invalidDto, mockUser);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Failed to create workflow');
        });
    });
    describe('updateWorkflow', () => {
        const updateWorkflowDto = {
            name: 'Updated Workflow',
            description: 'Updated description'
        };
        it('should update an existing workflow', async () => {
            const updatedWorkflow = { ...mockWorkflow, ...updateWorkflowDto };
            const expectedResult = {
                success: true,
                data: updatedWorkflow
            };
            workflowService.updateWorkflow.mockResolvedValue(updatedWorkflow);
            const result = await controller.updateWorkflow('workflow-1', updateWorkflowDto, mockUser);
            expect(result).toEqual(expectedResult);
            expect(workflowService.updateWorkflow).toHaveBeenCalledWith('workflow-1', updateWorkflowDto, mockUser.id);
        });
        it('should handle update errors', async () => {
            workflowService.updateWorkflow.mockRejectedValue(new Error('Workflow not found'));
            const result = await controller.updateWorkflow('non-existent', updateWorkflowDto, mockUser);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Failed to update workflow');
        });
    });
    describe('deleteWorkflow', () => {
        it('should delete a workflow', async () => {
            const expectedResult = {
                success: true,
                data: null
            };
            workflowService.deleteWorkflow.mockResolvedValue(undefined);
            const result = await controller.deleteWorkflow('workflow-1', mockUser);
            expect(result).toEqual(expectedResult);
            expect(workflowService.deleteWorkflow).toHaveBeenCalledWith('workflow-1', mockUser.id);
        });
        it('should handle delete errors', async () => {
            workflowService.deleteWorkflow.mockRejectedValue(new Error('Workflow not found'));
            const result = await controller.deleteWorkflow('non-existent', mockUser);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Failed to delete workflow');
        });
    });
    describe('executeWorkflow', () => {
        const inputs = { test: 'value' };
        const mockExecution = {
            id: 'execution-1',
            status: 'completed',
            workflowId: 'workflow-1',
            input: inputs,
            output: {},
            startedAt: new Date(),
            completedAt: new Date()
        };
        it('should execute a workflow', async () => {
            const expectedResult = {
                success: true,
                data: mockExecution
            };
            workflowService.executeWorkflow.mockResolvedValue(mockExecution);
            const result = await controller.executeWorkflow('workflow-1', inputs, mockUser);
            expect(result).toEqual(expectedResult);
            expect(workflowService.executeWorkflow).toHaveBeenCalledWith('workflow-1', mockUser?.id || 'default-user', inputs);
        });
        it('should handle execution errors', async () => {
            workflowService.executeWorkflow.mockRejectedValue(new Error('Execution failed'));
            const result = await controller.executeWorkflow('workflow-1', inputs, mockUser);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Failed to execute workflow');
        });
    });
    describe('getWorkflowExecutions', () => {
        const mockExecutions = [mockExecution];
        it('should return workflow executions', async () => {
            const expectedResult = {
                success: true,
                data: mockExecutions
            };
            workflowService.getWorkflowExecutions.mockResolvedValue(mockExecutions);
            const result = await controller.getWorkflowExecutions('workflow-1', mockUser);
            expect(result).toEqual(expectedResult);
            expect(workflowService.getWorkflowExecutions).toHaveBeenCalledWith('workflow-1', mockUser.id);
        });
        it('should handle execution retrieval errors', async () => {
            workflowService.getWorkflowExecutions.mockRejectedValue(new Error('Workflow not found'));
            const result = await controller.getWorkflowExecutions('non-existent', mockUser);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Failed to get workflow executions');
        });
    });
    describe('getExecution', () => {
        it('should return a specific execution', async () => {
            const expectedResult = {
                success: true,
                data: mockExecution
            };
            workflowService.getExecutionById.mockResolvedValue(mockExecution);
            const result = await controller.getExecution('workflow-1', 'execution-1', mockUser);
            expect(result).toEqual(expectedResult);
            expect(workflowService.getExecutionById).toHaveBeenCalledWith('execution-1', mockUser.id);
        });
        it('should handle execution not found', async () => {
            workflowService.getExecutionById.mockRejectedValue(new Error('Execution not found'));
            const result = await controller.getExecution('workflow-1', 'non-existent', mockUser);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Failed to get workflow execution');
        });
    });
    describe('error handling', () => {
        it('should handle service errors consistently', async () => {
            const errorMessage = 'Service error';
            workflowService.getWorkflows.mockRejectedValue(new Error(errorMessage));
            const result = await controller.getWorkflows(mockUser);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Failed to get workflows');
        });
        it('should handle missing user gracefully', async () => {
            workflowService.getWorkflows.mockResolvedValue({
                workflows: [],
                total: 0,
                page: 1,
                limit: 20,
                totalPages: 0
            });
            const result = await controller.getWorkflows(null);
            expect(result.success).toBe(true);
            expect(workflowService.getWorkflows).toHaveBeenCalledWith('default-user');
        });
    });
});
//# sourceMappingURL=workflow.controller.spec.js.map