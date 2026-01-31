import { Draggable } from '@hello-pangea/dnd';
import { PromptBlock } from '@the-new-fuse/prompt-templating';
import { ChevronDown, ChevronRight, GripVertical, Lock, Settings, X } from 'lucide-react';
import React from 'react';

interface PromptBlockItemProps {
  block: PromptBlock;
  index: number;
  onUpdate: (id: string, updates: Partial<PromptBlock>) => void;
  onDelete: (id: string) => void;
  isDragDisabled?: boolean;
}

export const PromptBlockItem: React.FC<PromptBlockItemProps> = ({
  block,
  index,
  onUpdate,
  onDelete,
  isDragDisabled = false,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(!block.collapsed);

  const getTypeColor = (type: PromptBlock['type']) => {
    switch (type) {
      case 'system':
        return 'bg-purple-50 border-purple-200';
      case 'user':
        return 'bg-blue-50 border-blue-200';
      case 'assistant':
        return 'bg-green-50 border-green-200';
      case 'variable':
        return 'bg-orange-50 border-orange-200';
      case 'condition':
        return 'bg-yellow-50 border-yellow-200';
      case 'group':
        return 'bg-gray-100 border-gray-300';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const getLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <Draggable draggableId={block.id} index={index} isDragDisabled={isDragDisabled || block.locked}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`mb-3 rounded-lg border shadow-sm transition-all ${getTypeColor(block.type)} ${
            snapshot.isDragging ? 'shadow-lg rotate-1 scale-102 ring-2 ring-blue-400' : ''
          }`}
          style={provided.draggableProps.style}
        >
          {/* Header */}
          <div className="flex items-center p-3 border-b border-black/5 bg-white/50 backdrop-blur-sm rounded-t-lg">
            {!block.locked && (
              <div
                {...provided.dragHandleProps}
                className="mr-2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
              >
                <GripVertical size={16} />
              </div>
            )}

            <button
              onClick={() => {
                setIsExpanded(!isExpanded);
                onUpdate(block.id, { collapsed: !block.collapsed });
              }}
              className="mr-2 text-gray-400 hover:text-gray-600"
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 mr-2">
              {getLabel(block.type)}
            </span>

            {block.metadata?.name && (
              <span className="text-sm font-medium text-gray-700 mr-auto truncate">
                {block.metadata.name}
              </span>
            )}

            <div className="ml-auto flex items-center space-x-1">
              {block.locked && <Lock size={14} className="text-gray-400 mx-2" />}
              <button className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors">
                <Settings size={14} />
              </button>
              {!block.locked && (
                <button
                  onClick={() => onDelete(block.id)}
                  className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Content Body */}
          {isExpanded && (
            <div className="p-3">
              {block.type === 'variable' ? (
                <div className="flex flex-col space-y-2">
                  <label className="text-xs text-gray-500">Variable Name</label>
                  <input
                    type="text"
                    value={block.content}
                    onChange={(e) => onUpdate(block.id, { content: e.target.value })}
                    className="w-full text-sm p-2 rounded border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                    placeholder="e.g., user_name"
                  />
                  {block.metadata?.description && (
                    <p className="text-xs text-gray-400">{block.metadata.description}</p>
                  )}
                </div>
              ) : block.type === 'group' ? (
                <div className="min-h-[50px] border-2 border-dashed border-gray-300 rounded p-4 flex items-center justify-center text-gray-400 text-sm">
                  {/* Nested droppable logic would go here, currently simplifying flattened list for v1 or handling recursively */}
                  Group Container (Nested Drag/Drop coming in v2)
                </div>
              ) : (
                <textarea
                  value={block.content}
                  onChange={(e) => onUpdate(block.id, { content: e.target.value })}
                  className="w-full text-sm p-2 rounded border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white min-h-[80px]"
                  placeholder="Enter prompt content..."
                />
              )}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};
