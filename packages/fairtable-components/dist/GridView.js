import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// GridView Component
import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_COLUMN_WIDTH, ROW_HEIGHT } from '@the-new-fuse/fairtable-core';
import { PlusIcon, TrashIcon, ChevronDownIcon, ChevronRightIcon, PlusSmallIcon } from './Icons';
import ColumnHeader from './ColumnHeader';
import TableCell from './TableCell';
const GridView = ({ table, view, appState, columnsToDisplay, rowsToDisplay, // These rows are already filtered/sorted from ActiveTableView
onAddColumn, onUpdateColumn, onDeleteColumn, onReorderColumn, onAddRow, onUpdateCell, onDeleteRow, onToggleRowCollapse, onOpenLinkRecordModal, }) => {
    const [resizingColumn, setResizingColumn] = useState(null);
    const [draggedColumnId, setDraggedColumnId] = useState(null);
    const [dropTargetColumnId, setDropTargetColumnId] = useState(null);
    const handleMouseMove = useCallback((e) => {
        if (!resizingColumn || !table)
            return;
        const currentWidth = resizingColumn.startWidth + (e.clientX - resizingColumn.startX);
        const newWidth = Math.max(currentWidth, DEFAULT_COLUMN_WIDTH / 2);
        const colElement = document.querySelector(`th[data-column-id="${resizingColumn.id}"]`);
        if (colElement)
            colElement.style.width = `${newWidth}px`;
    }, [resizingColumn, table]);
    const handleMouseUp = useCallback((e) => {
        if (!resizingColumn || !table)
            return;
        const finalWidth = resizingColumn.startWidth + (e.clientX - resizingColumn.startX);
        const newWidth = Math.max(finalWidth, DEFAULT_COLUMN_WIDTH / 2);
        onUpdateColumn(resizingColumn.id, { width: newWidth });
        setResizingColumn(null);
    }, [resizingColumn, table, onUpdateColumn]);
    useEffect(() => {
        if (resizingColumn) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        else {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizingColumn, handleMouseMove, handleMouseUp]);
    const handleStartResize = (columnId, startX) => {
        const column = table.columns.find((c) => c.id === columnId);
        if (column) {
            setResizingColumn({ id: columnId, startX, startWidth: column.width || DEFAULT_COLUMN_WIDTH });
        }
    };
    const handleColumnDragStart = (e, columnId) => {
        setDraggedColumnId(columnId);
        e.dataTransfer.effectAllowed = 'move';
    };
    const handleColumnDragOver = (e, columnId) => {
        e.preventDefault();
        if (columnId !== draggedColumnId) {
            setDropTargetColumnId(columnId);
        }
    };
    const handleColumnDragLeave = () => {
        setDropTargetColumnId(null);
    };
    const handleColumnDrop = (e, targetColumnId) => {
        e.preventDefault();
        if (draggedColumnId && draggedColumnId !== targetColumnId) {
            onReorderColumn(draggedColumnId, targetColumnId);
        }
        setDraggedColumnId(null);
        setDropTargetColumnId(null);
    };
    const getVisibleRows = useCallback(() => {
        const visible = [];
        const processRow = (row, parentCollapsed) => {
            if (!parentCollapsed) {
                visible.push(row);
                const children = rowsToDisplay.filter(child => child.parentId === row.id);
                children.forEach(child => processRow(child, row.isCollapsed));
            }
        };
        // Start processing with top-level rows
        rowsToDisplay.filter(r => r.parentId === null).forEach(topLevelRow => processRow(topLevelRow, false));
        return visible;
    }, [rowsToDisplay]);
    const displayableRows = getVisibleRows();
    if (!table || !view) {
        return _jsx("div", { className: "p-8 text-center text-slate-500", children: "Grid view data is missing." });
    }
    return (_jsxs("div", { className: "flex-grow overflow-auto custom-scrollbar", style: { userSelect: resizingColumn ? 'none' : 'auto' }, children: [_jsxs("table", { className: "min-w-full border-collapse", children: [_jsx("thead", { className: "bg-slate-50", children: _jsxs("tr", { children: [_jsx("th", { className: "sticky top-0 left-0 z-20 bg-slate-100 p-2 border-b border-r border-slate-300 text-xs font-medium text-slate-500", style: { width: '60px', minWidth: '60px' }, children: "#" }), columnsToDisplay.map((col) => (_jsx(ColumnHeader, { column: col, allTables: appState.tables, onUpdateColumn: onUpdateColumn, onDeleteColumn: onDeleteColumn, onStartResize: handleStartResize, onColumnDragStart: handleColumnDragStart, onColumnDragOver: handleColumnDragOver, onColumnDrop: handleColumnDrop, isDragTarget: dropTargetColumnId === col.id && draggedColumnId !== col.id }, col.id))), _jsx("th", { className: "sticky top-0 z-10 bg-slate-50 p-0 border-b border-slate-300", style: { width: '50px' }, children: _jsx("div", { className: "h-full flex items-center justify-center", children: _jsx("button", { onClick: onAddColumn, className: "p-2 text-sky-600 hover:bg-sky-100 rounded-full transition-colors", title: "Add new column", children: _jsx(PlusIcon, { className: "w-5 h-5" }) }) }) })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-slate-200", children: displayableRows.map((row, visualRowIndex) => {
                            const hasChildren = rowsToDisplay.some(r => r.parentId === row.id);
                            return (_jsxs("tr", { className: "group hover:bg-slate-50", style: { height: `${ROW_HEIGHT}px` }, children: [_jsx("td", { className: "sticky left-0 bg-slate-50 group-hover:bg-slate-100 p-0 border-b border-r border-slate-300 text-xs text-slate-500 text-center select-none", style: { width: '60px', minWidth: '60px', paddingLeft: `${row.depth * 12}px` }, children: _jsxs("div", { className: "flex items-center justify-start h-full", children: [hasChildren ? (_jsx("button", { onClick: () => onToggleRowCollapse(row.id), className: "p-0.5 text-slate-500 hover:bg-slate-200 rounded", children: row.isCollapsed ? (_jsx(ChevronRightIcon, { className: "w-3.5 h-3.5", "aria-label": "Expand row" })) : (_jsx(ChevronDownIcon, { className: "w-3.5 h-3.5", "aria-label": "Collapse row" })) })) : (_jsx("span", { className: "w-[18px] h-[18px] inline-block" }) // Placeholder for alignment
                                                ), _jsx("span", { className: "mx-1 group-hover:hidden", children: visualRowIndex + 1 }), _jsxs("div", { className: "hidden group-hover:flex items-center", children: [_jsx("button", { onClick: () => onDeleteRow(row.id), className: "text-red-400 hover:text-red-600 p-0.5", title: "Delete row", children: _jsx(TrashIcon, { className: "w-3.5 h-3.5" }) }), _jsx("button", { onClick: () => onAddRow(row.id), className: "text-sky-500 hover:text-sky-700 p-0.5", title: "Add sub-item", children: _jsx(PlusSmallIcon, { className: "w-4 h-4" }) })] })] }) }), columnsToDisplay.map((col) => (_jsx(TableCell, { value: row.data[col.id], row: row, column: col, appState: appState, onUpdateCell: (newValue) => onUpdateCell(row.id, col.id, newValue), onOpenLinkRecordModal: onOpenLinkRecordModal }, `${row.id}-${col.id}`))), _jsx("td", { className: "border-b border-slate-300" }), " "] }, row.id));
                        }) })] }), displayableRows.length === 0 && (_jsx("div", { className: "p-8 text-center text-slate-400", children: "This view is empty. Try adjusting filters, expanding items, or adding new rows." }))] }));
};
export default GridView;
//# sourceMappingURL=GridView.js.map