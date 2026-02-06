import React from 'react';

interface DraggableProps {
  id: string;
  children: React.ReactNode;
  onDragEnd?: (id: string, newStatus: string) => void;
}

/**
 * Placeholder Draggable component.
 * This was restored to fix build issues after file corruption.
 * Full drag-and-drop functionality requires a library like dnd-kit or react-beautiful-dnd,
 * which is not currently implemented here.
 */
export const Draggable: React.FC<DraggableProps> = ({ children }) => {
  return <div className="draggable-item">{children}</div>;
};
