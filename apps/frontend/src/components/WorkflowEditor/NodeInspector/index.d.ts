import React from 'react';
import type { Node } from '../../../types/workflow';
interface NodeInspectorProps {
    node: Node;
    onUpdate: (changes: any) => void;
}
export declare const NodeInspector: React.React.FC<NodeInspectorProps>;
export {};
