import type { CreateWorkflowDefinitionDto } from '@the-new-fuse/types';
export declare class CreateWorkflowDto implements CreateWorkflowDefinitionDto {
    name: string;
    description?: string;
    triggerType: 'manual' | 'event' | 'schedule';
    triggerConfig?: Record<string, any>;
    steps: any[];
    initialContext?: Record<string, any>;
    tags?: string[];
}
//# sourceMappingURL=create-workflow.dto.d.ts.map