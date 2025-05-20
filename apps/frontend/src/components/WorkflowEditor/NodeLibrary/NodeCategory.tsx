import React, { useState } from 'react';
import { NodeTemplate, Category } from '../../../types/workflow.js';

interface NodeCategoryProps {
  category: Category;
  onDragStart: (event: React.DragEvent<HTMLDivElement>, node: NodeTemplate) => void;
}

export const NodeCategory: React.React.FC<NodeCategoryProps> = ({ category, onDragStart }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="mb-2">
      <button
        className="w-full flex items-center justify-between p-2 hover:bg-primary/5"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="font-medium">{category.name}</span>
        <span>{isExpanded ? '−' : '+'}</span>
      </button>

      {isExpanded && (
        <div className="pl-2">
          {category.nodes.map((node) => (
            <div
              key={node.type}
              className="flex items-center p-2 hover:bg-primary/5 cursor-move"
              draggable
              onDragStart={(e) => onDragStart(e, node)}
            >
              <div className="w-8 h-8 mr-2 flex items-center justify-center rounded bg-primary/10">
                {node.icon}
              </div>
              <div>
                <div className="font-medium">{node.label}</div>
                <div className="text-sm text-gray-500">{node.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};