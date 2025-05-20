import React from 'react';
import { NodeProps } from 'reactflow';
interface DynamicNodeData {
    type: string;
    parameters: Record<string, any>;
    credentials?: Record<string, any>;
}
export declare const DynamicNode: React.React.FC<NodeProps<DynamicNodeData>>;
export {};
