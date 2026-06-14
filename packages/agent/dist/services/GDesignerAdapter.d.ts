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
export declare class GDesignerAdapter extends BaseService {
    private logger;
    private nodeMapping;
    constructor();
    adaptWorkflow(gdesignerWorkflow: GDesignerWorkflow): Partial<WorkflowDefinition>;
    private processEdges;
    private mapStartNode;
    private mapTaskNode;
    private mapDecisionNode;
    private mapEndNode;
}
export {};
//# sourceMappingURL=GDesignerAdapter.d.ts.map