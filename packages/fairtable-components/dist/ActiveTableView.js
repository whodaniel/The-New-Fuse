import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { ViewType, FilterOperator, DataType } from '@the-new-fuse/fairtable-core';
import GridView from './GridView';
import KanbanView from './KanbanView';
import TimelineView from './TimelineView';
const evaluateFilter = (rowValue, operator, filterValue, columnType) => {
    if (operator === FilterOperator.IS_EMPTY)
        return rowValue === null || rowValue === undefined || String(rowValue).trim() === '' || (Array.isArray(rowValue) && rowValue.length === 0);
    if (operator === FilterOperator.IS_NOT_EMPTY)
        return !(rowValue === null || rowValue === undefined || String(rowValue).trim() === '' || (Array.isArray(rowValue) && rowValue.length === 0));
    let valA = rowValue;
    let valB = filterValue;
    if (columnType === DataType.NUMBER || columnType === DataType.VOTES) {
        valA = parseFloat(String(valA));
        valB = parseFloat(String(valB));
        if (isNaN(valA) && valA !== null && valA !== undefined)
            return false;
        if (isNaN(valB))
            return false;
    }
    else if (columnType === DataType.DATE) {
        valA = valA ? new Date(valA).getTime() : null;
        valB = valB ? new Date(valB).getTime() : null;
        if (isNaN(valA) && valA !== null && valA !== undefined)
            return false;
        if (isNaN(valB))
            return false;
    }
    else if (columnType === DataType.BOOLEAN) {
        valA = valA === true || String(valA).toLowerCase() === 'true' || String(valA) === '1';
        valB = valB === true || String(valB).toLowerCase() === 'true' || String(valB) === '1';
    }
    else if (typeof valA === 'string' && typeof valB === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
    }
    switch (operator) {
        case FilterOperator.EQ: return valA === valB;
        case FilterOperator.NEQ: return valA !== valB;
        case FilterOperator.GT: return valA !== null && valA !== undefined && valA > valB;
        case FilterOperator.LT: return valA !== null && valA !== undefined && valA < valB;
        case FilterOperator.GTE: return valA !== null && valA !== undefined && valA >= valB;
        case FilterOperator.LTE: return valA !== null && valA !== undefined && valA <= valB;
        case FilterOperator.CONTAINS: return typeof valA === 'string' && typeof valB === 'string' && valA.includes(valB);
        case FilterOperator.NOT_CONTAINS: return typeof valA === 'string' && typeof valB === 'string' && !valA.includes(valB);
        default: return true;
    }
};
const ActiveTableView = (props) => {
    const { table, view, appState } = props;
    const columnsToDisplay = useMemo(() => {
        const order = view.columnOrder || table.columnOrder;
        return order
            .map((colId) => table.columns.find((c) => c.id === colId))
            .filter(Boolean);
    }, [table.columns, table.columnOrder, view.columnOrder]);
    const processedRows = useMemo(() => {
        let filteredRows = [...table.rows];
        if (view.filters && view.filters.length > 0) {
            filteredRows = filteredRows.filter(row => {
                return view.filters.every((filter) => {
                    const column = table.columns.find((c) => c.id === filter.columnId);
                    if (!column)
                        return true;
                    return evaluateFilter(row.data[filter.columnId], filter.operator, filter.value, column.type);
                });
            });
        }
        if (view.sorts && view.sorts.length > 0) {
            const rowsToSort = [...filteredRows];
            rowsToSort.sort((a, b) => {
                for (const sortRule of view.sorts) {
                    const column = table.columns.find((c) => c.id === sortRule.columnId);
                    if (!column)
                        continue;
                    let valA = a.data[sortRule.columnId];
                    let valB = b.data[sortRule.columnId];
                    if (valA === null || valA === undefined)
                        return sortRule.direction === 'ASC' ? -1 : 1;
                    if (valB === null || valB === undefined)
                        return sortRule.direction === 'ASC' ? 1 : -1;
                    if (column.type === DataType.NUMBER || column.type === DataType.VOTES) {
                        valA = Number(valA);
                        valB = Number(valB);
                    }
                    else if (column.type === DataType.DATE || column.type === DataType.CREATED_TIME || column.type === DataType.LAST_MODIFIED_TIME) {
                        valA = new Date(valA).getTime();
                        valB = new Date(valB).getTime();
                    }
                    else if (column.type === DataType.BOOLEAN) {
                        valA = valA ? 1 : 0;
                        valB = valB ? 1 : 0;
                    }
                    else if (typeof valA === 'string' && typeof valB === 'string') {
                        valA = valA.toLowerCase();
                        valB = valB.toLowerCase();
                    }
                    if (valA < valB)
                        return sortRule.direction === 'ASC' ? -1 : 1;
                    if (valA > valB)
                        return sortRule.direction === 'ASC' ? 1 : -1;
                }
                return 0;
            });
            filteredRows = rowsToSort;
        }
        // For hierarchical display, we still pass all filtered/sorted rows.
        // The specific view (e.g., GridView) will handle rendering the hierarchy.
        return filteredRows;
    }, [table.rows, table.columns, view.filters, view.sorts]);
    switch (view.type) {
        case ViewType.GRID:
            return _jsx(GridView, { ...props, columnsToDisplay: columnsToDisplay, rowsToDisplay: processedRows });
        case ViewType.KANBAN:
            if (!view.viewSpecificOptions || !view.viewSpecificOptions.groupByColumnId) {
                return (_jsx("div", { className: "p-4 text-center text-slate-600", children: "Kanban view requires a \"Group By\" column to be configured. Please edit the view settings." }));
            }
            return _jsx(KanbanView, { ...props, columnsToDisplay: columnsToDisplay, rowsToDisplay: processedRows.filter(r => r.parentId === null), kanbanOptions: view.viewSpecificOptions });
        case ViewType.TIMELINE:
            if (!view.viewSpecificOptions || !view.viewSpecificOptions.startDateColumnId) {
                return (_jsx("div", { className: "p-4 text-center text-slate-600", children: "Timeline view requires at least a \"Start Date\" column to be configured. Please edit the view settings." }));
            }
            return _jsx(TimelineView, { ...props, columnsToDisplay: columnsToDisplay, rowsToDisplay: processedRows.filter(r => r.parentId === null), timelineOptions: view.viewSpecificOptions });
        default:
            return (_jsxs("div", { className: "p-4 text-center text-slate-600", children: ["View type \"", view.type, "\" is not yet implemented. Displaying Grid as default.", _jsx(GridView, { ...props, columnsToDisplay: columnsToDisplay, rowsToDisplay: processedRows })] }));
    }
};
export default ActiveTableView;
//# sourceMappingURL=ActiveTableView.js.map