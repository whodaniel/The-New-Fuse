import React from 'react';
import { NodeTemplate, Category } from '../../../types/workflow';
interface NodeCategoryProps {
    category: Category;
    onDragStart: (event: React.DragEvent<HTMLDivElement>, node: NodeTemplate) => void;
}
export declare const NodeCategory: React.React.FC<NodeCategoryProps>;
export {};
