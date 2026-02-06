import { KanbanView } from '@the-new-fuse/fairtable-components';
import {
  AppState,
  CellValue,
  Column,
  DataType,
  KanbanViewOptions,
  Row,
  Table,
  View,
  ViewType,
} from '@the-new-fuse/fairtable-core';
import React, { useCallback, useMemo } from 'react';

// Legacy interfaces from feature-suggestions
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
  [key: string]: any; // Allow additional properties
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
const KanbanBoardAdapter: React.FC<LegacyKanbanBoardProps> = ({
  columns,
  onDragStart,
  onDragEnd,
  onItemClick,
}) => {
  // Show deprecation warning in development
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '🔄 [MIGRATION] KanbanBoardAdapter is being used. ' +
          'Consider migrating to @the-new-fuse/airtable-components/KanbanView for better performance and features. ' +
          'See migration guide: docs/migration/kanban-board.md'
      );
    }
  }, []);

  // Convert legacy data to airtable format
  const { table, view, appState, columnsToDisplay, rowsToDisplay } = useMemo(() => {
    // Create columns for the airtable
    const titleColumn: Column = {
      id: 'title',
      name: 'Title',
      type: DataType.TEXT,
      width: 200,
    };

    const descriptionColumn: Column = {
      id: 'description',
      name: 'Description',
      type: DataType.LONG_TEXT,
      width: 300,
    };

    const priorityColumn: Column = {
      id: 'priority',
      name: 'Priority',
      type: DataType.SINGLE_SELECT,
      width: 120,
      options: [
        { id: 'LOW', name: 'Low', colorClass: 'bg-blue-100 text-blue-800' },
        { id: 'MEDIUM', name: 'Medium', colorClass: 'bg-yellow-100 text-yellow-800' },
        { id: 'HIGH', name: 'High', colorClass: 'bg-orange-100 text-orange-800' },
        { id: 'CRITICAL', name: 'Critical', colorClass: 'bg-red-100 text-red-800' },
      ],
    };

    const statusColumn: Column = {
      id: 'status',
      name: 'Status',
      type: DataType.SINGLE_SELECT,
      width: 150,
      options: columns.map((col) => ({
        id: col.id,
        name: col.title,
        colorClass: 'bg-gray-100 text-gray-800',
      })),
    };

    const tableColumns = [titleColumn, descriptionColumn, priorityColumn, statusColumn];

    // Convert legacy items to rows
    const rows: Row[] = [];
    columns.forEach((column) => {
      column.items.forEach((item) => {
        rows.push({
          id: item.id,
          data: {
            title: item.title,
            description: item.description,
            priority: item.priority,
            status: column.id,
            // Preserve any additional properties
            ...Object.fromEntries(
              Object.entries(item).filter(
                ([key]) => !['id', 'title', 'description', 'priority'].includes(key)
              )
            ),
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          parentId: null,
          depth: 0,
          isCollapsed: false,
        });
      });
    });

    // Create table
    const table: Table = {
      id: 'legacy-kanban-table',
      name: 'Legacy Kanban Board',
      columns: tableColumns,
      rows,
      columnOrder: ['title', 'description', 'priority', 'status'],
      views: [],
      activeViewId: 'kanban-view',
    };

    // Create kanban view
    const kanbanViewOptions: KanbanViewOptions = {
      groupByColumnId: 'status',
    };

    const view: View = {
      id: 'kanban-view',
      name: 'Kanban View',
      type: ViewType.KANBAN,
      filters: [],
      sorts: [],
      groupBy: [],
      columnOrder: ['title', 'description', 'priority'],
      columnVisibility: {
        title: true,
        description: true,
        priority: true,
        status: false, // Hidden since it's used for grouping
      },
      viewSpecificOptions: kanbanViewOptions,
    };

    table.views = [view];

    const appState: AppState = {
      tables: [table],
      activeTableId: table.id,
    };

    return {
      table,
      view,
      appState,
      columnsToDisplay: [titleColumn, descriptionColumn, priorityColumn],
      rowsToDisplay: rows,
    };
  }, [columns]);

  // Convert airtable events back to legacy format
  const handleUpdateCell = useCallback(
    (rowId: string, columnId: string, value: CellValue) => {
      if (columnId === 'status' && onDragEnd) {
        // Find the original item and column
        const sourceRow = rowsToDisplay.find((row) => row.id === rowId);
        if (sourceRow) {
          const legacyItem = convertRowToLegacyItem(sourceRow);
          const originalColumnId = sourceRow.data.status as string;
          const targetColumnId = value as string;

          if (originalColumnId !== targetColumnId) {
            onDragEnd(legacyItem, originalColumnId, targetColumnId);
          }
        }
      }
    },
    [rowsToDisplay, onDragEnd]
  );

  const handleOpenLinkRecordModal = useCallback(() => {
    // Not used in legacy kanban, but required by interface
  }, []);

  const handleAddRow = useCallback(() => {
    // Could be extended to support adding new items
    console.log('Add row functionality not implemented in legacy adapter');
  }, []);

  // Helper function to convert row back to legacy item format
  const convertRowToLegacyItem = (row: Row): LegacyDraggableItem => {
    const { title, description, priority, status, ...otherProps } = row.data;
    return {
      id: row.id,
      title: String(title || ''),
      description: String(description || ''),
      priority: priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
      ...otherProps,
    };
  };

  return (
    <div className="kanban-board-adapter">
      <KanbanView
        table={table}
        view={view}
        appState={appState}
        columnsToDisplay={columnsToDisplay}
        rowsToDisplay={rowsToDisplay}
        kanbanOptions={view.viewSpecificOptions as KanbanViewOptions}
        onUpdateCell={handleUpdateCell}
        onOpenLinkRecordModal={handleOpenLinkRecordModal}
        onAddRow={handleAddRow}
      />
    </div>
  );
};

export default KanbanBoardAdapter;
