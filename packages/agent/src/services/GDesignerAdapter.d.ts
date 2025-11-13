import { BaseService } from '../core/BaseService';
import { WorkflowDefinition } from '@the-new-fuse/types';
interface GDesignerWorkflow {
    id: string;
    name: string;
    nodes: Array<{
        id: string;
        type: string;
        data: any;
        position: {
            x: number;
            y: number;
        };
    }>;
    edges: Array<{
        id: string;
        source: string;
        target: string;
        type?: string;
    }>;
}
/**
 * Adapts workflows designed in a graphical tool (like GDesigner)
 * to the internal workflow/task representation.
 */
export declare class GDesignerAdapter extends BaseService {
    private logger;
    private nodeMapping;
    constructor();
    /**
     * Converts a GDesigner workflow structure into an internal WorkflowDefinition.
     * @param gdesignerWorkflow The workflow data from GDesigner.
     * @returns A WorkflowDefinition object.
     */
    adaptWorkflow(gdesignerWorkflow: GDesignerWorkflow): Partial<WorkflowDefinition>;
    steps: any;
    push(step: any): any;
}
export {};
//# sourceMappingURL=GDesignerAdapter.d.ts.map