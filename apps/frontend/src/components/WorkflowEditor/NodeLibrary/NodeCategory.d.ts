import React from 'react';
import { Category, NodeTemplate } from '../../../types/workflow';
interface NodeCategoryProps {
  category: Category;
  onDragStart: (event: React.DragEvent<HTMLDivElement>, node: NodeTemplate) => void;
}
export declare const NodeCategory: React.FC<NodeCategoryProps>;
export {};
