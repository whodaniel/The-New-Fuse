import type { UpdateWorkflowDefinitionDto } from '@the-new-fuse/types';
export declare class UpdateWorkflowDto implements UpdateWorkflowDefinitionDto {
    name?: string;
    description?: string;
    triggerType?: 'manual' | 'event' | 'schedule';
    triggerConfig?: Record<string, any>;
    steps?: any[];
    initialContext?: Record<string, any>;
    tags?: string[];
}
//# sourceMappingURL=update-workflow.dto.d.ts.map