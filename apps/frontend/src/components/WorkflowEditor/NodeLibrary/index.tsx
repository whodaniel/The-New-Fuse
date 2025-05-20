import React from 'react';
import { DragEvent } from 'react';
import { NodeCategory } from './NodeCategory.js';
import { SearchBar } from './SearchBar.js';
import { useNodeCategories } from '../../../hooks/useNodeCategories.js';
import type { NodeTemplate } from '../../../types/workflow.js';

interface NodeLibraryProps {
  isPanelOpen: boolean;
  onTogglePanel: () => void;
}

export const NodeLibrary: React.React.FC<NodeLibraryProps> = ({ isPanelOpen, onTogglePanel }) => {
  const { categories, searchNodes } = useNodeCategories();
  
  const onDragStart = (event: DragEvent<HTMLDivElement>, nodeType: NodeTemplate) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeType));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className={`node-library ${isPanelOpen ? 'w-80' : 'w-12'} transition-width duration-300 bg-secondary border-r`}>
      <div className="flex items-center justify-between p-4">
        <h3 className={`font-semibold ${!isPanelOpen && 'hidden'}`}>Node Library</h3>
        <button onClick={onTogglePanel} className="p-2 hover:bg-primary/10 rounded">
          {isPanelOpen ? '←' : '→'}
        </button>
      </div>

      {isPanelOpen && (
        <>
          <SearchBar onSearch={searchNodes} />
          <div className="overflow-y-auto h-[calc(100vh-120px)]">
            {categories.map((category) => (
              <NodeCategory
                key={category.id}
                category={category}
                onDragStart={onDragStart}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};