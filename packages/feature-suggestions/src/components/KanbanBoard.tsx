import React from 'react';
import { KanbanColumn, DraggableItem, TodoItem, FeatureSuggestion } from '../types.js';

interface KanbanBoardProps {
  columns: KanbanColumn[];
  onDragStart?: (item: DraggableItem, sourceColumnId: string) => void;
  onDragEnd?: (item: DraggableItem, sourceColumnId: string, targetColumnId: string) => void;
  onItemClick?: (item: DraggableItem) => void;
}

// Type guards to determine what kind of item we're dealing with
const isTodoItem = (item: DraggableItem): item is TodoItem => {
  return 'assignedTo' in item || item.status === 'TODO' || item.status === 'IN_PROGRESS' || item.status === 'DONE';
};

const isFeatureSuggestion = (item: DraggableItem): item is FeatureSuggestion => {
  return 'submittedBy' in item && 'votes' in item;
};

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  columns,
  onDragStart,
  onDragEnd,
  onItemClick
}) => {
  const handleDragStart = (item: DraggableItem, columnId: string) => {
    if (onDragStart) onDragStart(item, columnId);
  };

  const handleDragEnd = (item: DraggableItem, sourceColumnId: string, targetColumnId: string) => {
    if (onDragEnd) onDragEnd(item, sourceColumnId, targetColumnId);
  };

  const handleItemClick = (item: DraggableItem) => {
    if (onItemClick) onItemClick(item);
  };

  return (
    <div className="flex space-x-4 overflow-x-auto p-4">
      {columns.map(column => (
        <div
          key={column.id}
          className="flex-shrink-0 w-80 bg-gray-100 rounded-lg p-4"
        >
          <h3 className="font-medium mb-4">{column.title}</h3>
          <div className="space-y-3">
            {column.items.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(item, column.id)}
                onClick={() => handleItemClick(item)}
                className="bg-white p-3 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{item.title}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    item.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                    item.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {item.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                {/* Display tags only if item has them */}
                {isFeatureSuggestion(item) && item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {/* Show assignee only for TodoItems */}
                {isTodoItem(item) && item.assignedTo && (
                  <div className="mt-2 text-sm text-gray-500">
                    Assigned to: {item.assignedTo}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanBoard;
