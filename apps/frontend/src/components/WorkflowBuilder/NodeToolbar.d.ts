import React from 'react';
interface NodeToolbarProps {
    onAddNode: (nodeType: string, position: {
        x: number;
        y: number;
    }) => void;
}
export declare const NodeToolbar: React.FC<NodeToolbarProps>;
export {};
