import { Droppable } from '@hello-pangea/dnd';
import { PromptBlock } from '@the-new-fuse/prompt-templating';
import { Plus } from 'lucide-react';
import React from 'react';
import { PromptBlockItem } from './PromptBlockItem';

interface BuilderCanvasProps {
  blocks: PromptBlock[];
  onUpdateBlock: (id: string, updates: Partial<PromptBlock>) => void;
  onDeleteBlock: (id: string) => void;
}

export const BuilderCanvas: React.FC<BuilderCanvasProps> = ({
  blocks,
  onUpdateBlock,
  onDeleteBlock,
}) => {
  return (
    <div className="flex-1 bg-gray-50 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
        <h2 className="font-semibold text-gray-800">Prompt Canvas</h2>
        <div className="text-sm text-gray-500">{blocks.length} blocks</div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          <Droppable droppableId="builder-canvas">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`min-h-[400px] p-4 rounded-xl border-2 transition-colors ${
                  snapshot.isDraggingOver
                    ? 'border-blue-400 bg-blue-50/50'
                    : 'border-dashed border-gray-300'
                }`}
              >
                {blocks.length === 0 && !snapshot.isDraggingOver && (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 py-20">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Plus className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-lg font-medium">Drag blocks here</p>
                    <p className="text-sm">Start building your prompt template</p>
                  </div>
                )}

                {blocks.map((block, index) => (
                  <PromptBlockItem
                    key={block.id}
                    block={block}
                    index={index}
                    onUpdate={onUpdateBlock}
                    onDelete={onDeleteBlock}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </div>
    </div>
  );
};
