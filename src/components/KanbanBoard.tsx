import React, { useMemo, useCallback, useEffect } from 'react';
import { KanbanBoardAdapter } from '@the-new-fuse/airtable-adapters';

interface KanbanColumn {
    id: string;
    title: string;
    items: Array<{
        id: string;
        title: string;
        [key: string]: any;
    }>;
}

interface KanbanBoardProps {
    columns: KanbanColumn[];
    onDragEnd: (result: any) => void;
}

/**
 * Generic KanbanBoard component - now using airtable-based implementation
 *
 * This component maintains the original API while leveraging the new
 * airtable KanbanView for improved performance and features.
 *
 * @deprecated Consider migrating to @the-new-fuse/airtable-components/KanbanView directly
 */
const KanbanBoard: React.FC<KanbanBoardProps> = ({ columns, onDragEnd }) => {
    // Show deprecation warning in development
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.warn(
                '🔄 [MIGRATION] Generic KanbanBoard is deprecated. ' +
                'Consider migrating to @the-new-fuse/airtable-components/KanbanView for better performance and features. ' +
                'See migration guide: docs/migration/kanban-board.md'
            );
        }
    }, []);

    // Convert columns to legacy format expected by KanbanBoardAdapter
    const legacyColumns = useMemo(() => {
        return columns.map(column => ({
            id: column.id,
            title: column.title,
            items: column.items.map(item => ({
                id: item.id,
                title: item.title,
                description: item.description || '',
                priority: item.priority || 'MEDIUM',
                ...item
            }))
        }));
    }, [columns]);

    // Convert drag end handler to legacy format
    const handleDragEnd = useCallback((item: any, sourceColumnId: string, targetColumnId: string) => {
        // Convert back to react-beautiful-dnd format for backward compatibility
        const dragResult = {
            draggableId: item.id,
            type: 'DEFAULT',
            source: {
                droppableId: sourceColumnId,
                index: 0 // Simplified for compatibility
            },
            destination: {
                droppableId: targetColumnId,
                index: 0 // Simplified for compatibility
            }
        };
        onDragEnd(dragResult);
    }, [onDragEnd]);

    return (
        <div className="kanban-board">
            <KanbanBoardAdapter
                columns={legacyColumns}
                onDragEnd={handleDragEnd}
            />
        </div>
    );
};

export default KanbanBoard;