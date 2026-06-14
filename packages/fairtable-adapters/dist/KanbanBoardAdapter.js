"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const fairtable_components_1 = require("@the-new-fuse/fairtable-components");
const fairtable_core_1 = require("@the-new-fuse/fairtable-core");
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
const KanbanBoardAdapter = ({ columns, onDragStart, onDragEnd, onItemClick }) => {
    // Show deprecation warning in development
    react_1.default.useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.warn('🔄 [MIGRATION] KanbanBoardAdapter is being used. ' +
                'Consider migrating to @the-new-fuse/airtable-components/KanbanView for better performance and features. ' +
                'See migration guide: docs/migration/kanban-board.md');
        }
    }, []);
    // Convert legacy data to airtable format
    const { table, view, appState, columnsToDisplay, rowsToDisplay } = (0, react_1.useMemo)(() => {
        // Create columns for the airtable
        const titleColumn = {
            id: 'title',
            name: 'Title',
            type: fairtable_core_1.DataType.TEXT,
            width: 200
        };
        const descriptionColumn = {
            id: 'description',
            name: 'Description',
            type: fairtable_core_1.DataType.LONG_TEXT,
            width: 300
        };
        const priorityColumn = {
            id: 'priority',
            name: 'Priority',
            type: fairtable_core_1.DataType.SINGLE_SELECT,
            width: 120,
            options: [
                { id: 'LOW', name: 'Low', colorClass: 'bg-blue-100 text-blue-800' },
                { id: 'MEDIUM', name: 'Medium', colorClass: 'bg-yellow-100 text-yellow-800' },
                { id: 'HIGH', name: 'High', colorClass: 'bg-orange-100 text-orange-800' },
                { id: 'CRITICAL', name: 'Critical', colorClass: 'bg-red-100 text-red-800' }
            ]
        };
        const statusColumn = {
            id: 'status',
            name: 'Status',
            type: fairtable_core_1.DataType.SINGLE_SELECT,
            width: 150,
            options: columns.map(col => ({
                id: col.id,
                name: col.title,
                colorClass: 'bg-gray-100 text-gray-800'
            }))
        };
        const tableColumns = [titleColumn, descriptionColumn, priorityColumn, statusColumn];
        // Convert legacy items to rows
        const rows = [];
        columns.forEach(column => {
            column.items.forEach(item => {
                rows.push({
                    id: item.id,
                    data: {
                        title: item.title,
                        description: item.description,
                        priority: item.priority,
                        status: column.id,
                        // Preserve any additional properties
                        ...Object.fromEntries(Object.entries(item).filter(([key]) => !['id', 'title', 'description', 'priority'].includes(key)))
                    },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    parentId: null,
                    depth: 0,
                    isCollapsed: false
                });
            });
        });
        // Create table
        const table = {
            id: 'legacy-kanban-table',
            name: 'Legacy Kanban Board',
            columns: tableColumns,
            rows,
            columnOrder: ['title', 'description', 'priority', 'status'],
            views: [],
            activeViewId: 'kanban-view'
        };
        // Create kanban view
        const kanbanViewOptions = {
            groupByColumnId: 'status'
        };
        const view = {
            id: 'kanban-view',
            name: 'Kanban View',
            type: fairtable_core_1.ViewType.KANBAN,
            filters: [],
            sorts: [],
            groupBy: [],
            columnOrder: ['title', 'description', 'priority'],
            columnVisibility: {
                title: true,
                description: true,
                priority: true,
                status: false // Hidden since it's used for grouping
            },
            viewSpecificOptions: kanbanViewOptions
        };
        table.views = [view];
        const appState = {
            tables: [table],
            activeTableId: table.id
        };
        return {
            table,
            view,
            appState,
            columnsToDisplay: [titleColumn, descriptionColumn, priorityColumn],
            rowsToDisplay: rows
        };
    }, [columns]);
    // Convert airtable events back to legacy format
    const handleUpdateCell = (0, react_1.useCallback)((rowId, columnId, value) => {
        if (columnId === 'status' && onDragEnd) {
            // Find the original item and column
            const sourceRow = rowsToDisplay.find(row => row.id === rowId);
            if (sourceRow) {
                const legacyItem = convertRowToLegacyItem(sourceRow);
                const originalColumnId = sourceRow.data.status;
                const targetColumnId = value;
                if (originalColumnId !== targetColumnId) {
                    onDragEnd(legacyItem, originalColumnId, targetColumnId);
                }
            }
        }
    }, [rowsToDisplay, onDragEnd]);
    const handleOpenLinkRecordModal = (0, react_1.useCallback)(() => {
        // Not used in legacy kanban, but required by interface
    }, []);
    const handleAddRow = (0, react_1.useCallback)(() => {
        // Could be extended to support adding new items
        console.log('Add row functionality not implemented in legacy adapter');
    }, []);
    // Helper function to convert row back to legacy item format
    const convertRowToLegacyItem = (row) => {
        const { title, description, priority, status, ...otherProps } = row.data;
        return {
            id: row.id,
            title: String(title || ''),
            description: String(description || ''),
            priority: priority,
            ...otherProps
        };
    };
    return ((0, jsx_runtime_1.jsx)("div", { className: "kanban-board-adapter", children: (0, jsx_runtime_1.jsx)(fairtable_components_1.KanbanView, { table: table, view: view, appState: appState, columnsToDisplay: columnsToDisplay, rowsToDisplay: rowsToDisplay, kanbanOptions: view.viewSpecificOptions, onUpdateCell: handleUpdateCell, onOpenLinkRecordModal: handleOpenLinkRecordModal, onAddRow: handleAddRow }) }));
};
exports.default = KanbanBoardAdapter;
//# sourceMappingURL=KanbanBoardAdapter.js.map