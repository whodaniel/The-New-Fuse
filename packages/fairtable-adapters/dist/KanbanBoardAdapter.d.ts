import React from 'react';
interface LegacyKanbanColumn {
    id: string;
    title: string;
    items: LegacyDraggableItem[];
}
interface LegacyDraggableItem {
    id: string;
    title: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    [key: string]: any;
}
interface LegacyKanbanBoardProps {
    columns: LegacyKanbanColumn[];
    onDragStart?: (item: LegacyDraggableItem, sourceColumnId: string) => void;
    onDragEnd?: (item: LegacyDraggableItem, sourceColumnId: string, targetColumnId: string) => void;
    onItemClick?: (item: LegacyDraggableItem) => void;
}
/**
 * KanbanBoardAdapter - Provides backward compatibility for existing KanbanBoard usage
 * while using the new airtable-based KanbanView internally.
 *
 * This adapter:
 * 1. Converts legacy data structures to airtable format
 * 2. Preserves existing component APIs and event handlers
 * 3. Provides deprecation warnings for migration guidance
 * 4. Enables gradual migration without breaking functionality
 */
declare const KanbanBoardAdapter: React.FC<LegacyKanbanBoardProps>;
export default KanbanBoardAdapter;
//# sourceMappingURL=KanbanBoardAdapter.d.ts.map