import React from 'react';
import { NodeProps } from 'reactflow';
interface BaseNodeProps extends NodeProps {
    data: {
        name: string;
        type: string;
        config: Record<string, any>;
        onUpdate?: (data: any) => void;
        onDelete?: () => void;
    };
    inputHandles?: Array<{
        id: string;
        label: string;
    }>;
    outputHandles?: Array<{
        id: string;
        label: string;
    }>;
}
export declare const BaseNode: React.React.FC<BaseNodeProps>;
export {};
