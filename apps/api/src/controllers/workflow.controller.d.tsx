import { WorkflowService } from '../services/workflow.service.js';
import { CreateWorkflowDto, UpdateWorkflowDto } from '../dtos/workflow.dto.js';
export declare class WorkflowController {
    private readonly workflowService;
    constructor(workflowService: WorkflowService);
    findAll(): Promise<any>;
    findOne(id: string): Promise<any>;
    create(createWorkflowDto: CreateWorkflowDto): Promise<any>;
    update(id: string, updateWorkflowDto: UpdateWorkflowDto): Promise<any>;
    remove(id: string): Promise<any>;
    execute(id: string): Promise<any>;
    getStatus(id: string): Promise<any>;
}
