import { FlowNode } from '../types/workflow.js';
export declare function useFlowRouter(): any {
    navigateToNode: (nodeId: string) => void;
    registerNode: (node: FlowNode) => any;
    updateNode: (node: FlowNode) => any;
    removeNode: (nodeId: string) => void;
    getRoutes: () => any;
};
