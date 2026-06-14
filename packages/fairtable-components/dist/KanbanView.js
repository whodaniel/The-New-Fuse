import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { DataType } from '@the-new-fuse/fairtable-core';
import { PlusIcon } from './Icons'; // For "Add new" in unclassified
const KanbanView = ({ table, view, appState, columnsToDisplay, rowsToDisplay, kanbanOptions, onUpdateCell, onOpenLinkRecordModal, onAddRow, }) => {
    const [draggedItem, setDraggedItem] = useState(null);
    const [isDraggingOverLane, setIsDraggingOverLane] = useState(null);
    const groupByColumn = useMemo(() => {
        return table.columns.find((c) => c.id === kanbanOptions.groupByColumnId);
    }, [table.columns, kanbanOptions.groupByColumnId]);
    const lanes = useMemo(() => {
        if (!groupByColumn)
            return [];
        const grouped = {};
        const uncategorizedId = '___uncategorized___';
        // Initialize lanes for SINGLE_SELECT options first to maintain their order
        if (groupByColumn.type === DataType.SINGLE_SELECT && groupByColumn.options) {
            groupByColumn.options.forEach((option) => {
                grouped[option.id] = {
                    id: option.id,
                    title: option.name,
                    colorClass: option.colorClass,
                    rows: [],
                    representativeValue: option.id,
                };
            });
        }
        // Initialize uncategorized lane
        grouped[uncategorizedId] = { id: uncategorizedId, title: 'Uncategorized', rows: [], representativeValue: null };
        rowsToDisplay.forEach(row => {
            let groupValue = row.data[groupByColumn.id];
            let laneId = null;
            let representativeValueForLane = groupValue;
            if (groupByColumn.type === DataType.SINGLE_SELECT) {
                laneId = groupValue;
            }
            else if (groupByColumn.type === DataType.LINKED_RECORD) {
                const linkedIds = Array.isArray(groupValue) ? groupValue : [];
                laneId = linkedIds.length > 0 ? linkedIds[0] : null;
                if (laneId && !grouped[laneId]) {
                    const linkedTable = appState.tables.find((t) => t.id === groupByColumn.linkedTableId);
                    const linkedRowData = linkedTable?.rows.find((r) => r.id === laneId);
                    const primaryColLinked = linkedTable?.columns.find((c) => c.id === linkedTable.columnOrder[0]);
                    const title = linkedRowData && primaryColLinked ? String(linkedRowData.data[primaryColLinked.id] ?? laneId) : (laneId || 'Unknown Link');
                    grouped[laneId] = { id: laneId, title: title, rows: [], representativeValue: [laneId] }; // Store as array for LINKED_RECORD
                }
            }
            else { // For TEXT, BOOLEAN, NUMBER etc.
                laneId = groupValue !== null && groupValue !== undefined ? String(groupValue) : null;
                if (laneId && !grouped[laneId]) {
                    grouped[laneId] = { id: laneId, title: laneId, rows: [], representativeValue: groupValue };
                }
            }
            if (laneId && grouped[laneId]) {
                grouped[laneId].rows.push(row);
            }
            else {
                grouped[uncategorizedId].rows.push(row);
            }
        });
        let orderedLanes = Object.values(grouped);
        if (groupByColumn.type === DataType.SINGLE_SELECT && groupByColumn.options) {
            const optionOrder = groupByColumn.options.map((opt) => opt.id);
            orderedLanes.sort((a, b) => {
                if (a.id === uncategorizedId)
                    return 1;
                if (b.id === uncategorizedId)
                    return -1;
                const indexA = optionOrder.indexOf(a.id);
                const indexB = optionOrder.indexOf(b.id);
                return indexA - indexB;
            });
        }
        return orderedLanes.filter(lane => lane.id !== uncategorizedId || lane.rows.length > 0);
    }, [groupByColumn, rowsToDisplay, appState.tables]);
    const primaryDisplayColumn = useMemo(() => {
        return columnsToDisplay.find((c) => c.type === DataType.TEXT && c.id !== groupByColumn?.id) || columnsToDisplay[0];
    }, [columnsToDisplay, groupByColumn]);
    const handleDragStart = (e, rowId, originalLaneId) => {
        e.dataTransfer.setData('text/plain', rowId); // Necessary for Firefox
        e.dataTransfer.effectAllowed = 'move';
        setDraggedItem({ rowId, originalLaneId });
        // e.currentTarget.style.opacity = '0.5'; // Visual feedback
    };
    const handleDragOver = (e, laneId) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (laneId !== isDraggingOverLane) {
            setIsDraggingOverLane(laneId);
        }
    };
    const handleDragLeaveLane = (e) => {
        setIsDraggingOverLane(null);
    };
    const handleDrop = (e, targetLaneId) => {
        e.preventDefault();
        if (!draggedItem || !groupByColumn)
            return;
        const { rowId, originalLaneId } = draggedItem;
        if (originalLaneId !== targetLaneId) {
            const targetLane = lanes.find((l) => l.id === targetLaneId);
            if (targetLane) {
                let newValue = targetLane.representativeValue;
                // Ensure the value format matches the column type (e.g., boolean string to boolean)
                if (groupByColumn.type === DataType.BOOLEAN) {
                    newValue = String(newValue).toLowerCase() === 'true';
                }
                else if (groupByColumn.type === DataType.NUMBER && newValue !== null) {
                    newValue = parseFloat(String(newValue));
                    if (isNaN(newValue))
                        newValue = null;
                }
                onUpdateCell(rowId, groupByColumn.id, newValue);
            }
        }
        setDraggedItem(null);
        setIsDraggingOverLane(null);
        // e.currentTarget.style.opacity = '1'; // Reset opacity
    };
    const handleDragEnd = (e) => {
        // e.currentTarget.style.opacity = '1'; // Reset opacity if drag cancelled
        setDraggedItem(null);
        setIsDraggingOverLane(null);
    };
    if (!groupByColumn) {
        return _jsx("div", { className: "p-4 text-center text-red-500", children: "Kanban view configuration error: Group By column not found." });
    }
    return (_jsx("div", { className: "flex-grow overflow-x-auto overflow-y-hidden p-4 flex space-x-4 bg-slate-100 custom-scrollbar", children: lanes.map(lane => (_jsxs("div", { className: `w-72 flex-shrink-0 bg-slate-200 rounded-lg shadow ${isDraggingOverLane === lane.id ? 'ring-2 ring-sky-500' : ''}`, onDragOver: (e) => handleDragOver(e, lane.id), onDrop: (e) => handleDrop(e, lane.id), onDragLeave: handleDragLeaveLane, children: [_jsxs("div", { className: `p-3 border-b border-slate-300 ${lane.colorClass ? `${lane.colorClass} text-opacity-75 rounded-t-lg` : 'text-slate-700'}`, children: [_jsx("h3", { className: `font-semibold text-sm truncate ${lane.colorClass ? '' : ''}`, children: lane.title }), _jsxs("span", { className: "text-xs opacity-80", children: [lane.rows.length, " card", lane.rows.length === 1 ? '' : 's'] })] }), _jsxs("div", { className: "p-2 space-y-2 overflow-y-auto custom-scrollbar max-h-[calc(100vh-200px)]", children: [lane.rows.map(row => (_jsxs("div", { draggable: true, onDragStart: (e) => handleDragStart(e, row.id, lane.id), onDragEnd: handleDragEnd, className: `bg-white p-3 rounded-md shadow hover:shadow-lg transition-shadow cursor-grab ${draggedItem?.rowId === row.id ? 'opacity-50 ring-2 ring-sky-400' : ''}`, children: [primaryDisplayColumn && (_jsx("p", { className: "text-sm font-medium text-slate-800 truncate mb-1", children: String(row.data[primaryDisplayColumn.id] ?? 'Untitled Card') })), columnsToDisplay.slice(0, 3).map(col => {
                                    if (col.id === primaryDisplayColumn?.id || col.id === groupByColumn.id)
                                        return null;
                                    const cellValue = row.data[col.id];
                                    let displayValue = String(cellValue ?? '');
                                    if (cellValue === null || cellValue === undefined || String(cellValue).trim() === '') {
                                        displayValue = _jsx("span", { className: "text-slate-400 italic", children: "empty" });
                                    }
                                    else if (col.type === DataType.SINGLE_SELECT && col.options) {
                                        const opt = col.options.find((o) => o.id === cellValue);
                                        displayValue = opt ? _jsx("span", { className: `text-xs px-1.5 py-0.5 rounded-full ${opt.colorClass}`, children: opt.name }) : '...';
                                    }
                                    else if (col.type === DataType.LINKED_RECORD && Array.isArray(cellValue) && cellValue.length > 0) {
                                        displayValue = _jsxs("button", { onClick: () => col.linkedTableId && onOpenLinkRecordModal(row.id, col.id, col.linkedTableId, cellValue), className: "text-xs text-sky-600 hover:underline", children: [cellValue.length, " link(s)"] });
                                    }
                                    else if (col.type === DataType.BOOLEAN) {
                                        displayValue = _jsx("input", { type: "checkbox", checked: !!cellValue, readOnly: true, className: "form-checkbox h-3.5 w-3.5" });
                                    }
                                    return (_jsxs("div", { className: "text-xs text-slate-600 mt-1 flex items-center", children: [_jsxs("span", { className: "font-medium w-1/3 truncate mr-1", children: [col.name, ":"] }), _jsx("span", { className: "w-2/3 truncate", children: displayValue })] }, col.id));
                                })] }, row.id))), _jsxs("button", { onClick: () => onAddRow(null, { [groupByColumn.id]: lane.representativeValue }), className: "w-full mt-2 p-2 text-xs text-slate-500 hover:bg-slate-300 rounded flex items-center justify-center", children: [_jsx(PlusIcon, { className: "w-3 h-3 mr-1" }), " Add card"] })] })] }, lane.id))) }));
};
export default KanbanView;
//# sourceMappingURL=KanbanView.js.map