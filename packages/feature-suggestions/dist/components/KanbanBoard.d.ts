import React from 'react';
import { KanbanColumn, DraggableItem } from '../types';
interface KanbanBoardProps {
    columns: KanbanColumn[];
    onDragStart?: (item: DraggableItem, sourceColumnId: string) => void;
    onDragEnd?: (item: DraggableItem, sourceColumnId: string, targetColumnId: string) => void;
    onItemClick?: (item: DraggableItem) => void;
}
declare const KanbanBoard: React.FC<KanbanBoardProps>;
export default KanbanBoard;
//# sourceMappingURL=KanbanBoard.d.ts.map