"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataTable = DataTable;
import react_1 from 'react';
import { Box } from '@chakra-ui/react';
function DataTable(_a) {
    var initialColumns = _a.columns, data = _a.data, isLoading = _a.isLoading, loadingMessage = _a.loadingMessage, hasError = _a.hasError, errorMessage = _a.errorMessage, defaultSort = _a.defaultSort, onSort = _a.onSort, onFilter = _a.onFilter, onRowClick = _a.onRowClick, onRowSelect = _a.onRowSelect, _b = _a.actions, actions = _b === void 0 ? {} : _b, onAction = _a.onAction, _c = _a.rowsPerPageOptions, rowsPerPageOptions = _c === void 0 ? [10, 25, 50, 100] : _c, _d = _a.defaultPageSize, defaultPageSize = _d === void 0 ? 10 : _d, _e = _a.stickyHeader, stickyHeader = _e === void 0 ? true : _e, _f = _a.dense, dense = _f === void 0 ? false : _f, _g = _a.selectable, selectable = _g === void 0 ? false : _g, _h = _a.searchable, searchable = _h === void 0 ? true : _h, sx = _a.sx, className = _a.className;
    var _j = (0, react_1.useState)(initialColumns), columns = _j[0], setColumns = _j[1];
    var _k = (0, react_1.useState)(0), page = _k[0], setPage = _k[1];
    var _l = (0, react_1.useState)(defaultPageSize), rowsPerPage = _l[0], setRowsPerPage = _l[1];
    var _m = (0, react_1.useState)((defaultSort === null || defaultSort === void 0 ? void 0 : defaultSort.column) || ''), sortBy = _m[0], setSortBy = _m[1];
    var _o = (0, react_1.useState)((defaultSort === null || defaultSort === void 0 ? void 0 : defaultSort.direction) || 'asc'), sortDirection = _o[0], setSortDirection = _o[1];
    var _p = (0, react_1.useState)([]), filters = _p[0], setFilters = _p[1];
    var _q = (0, react_1.useState)(''), searchTerm = _q[0], setSearchTerm = _q[1];
    var _r = (0, react_1.useState)([]), selectedRows = _r[0], setSelectedRows = _r[1];
    var _s = (0, react_1.useState)(null), columnMenuAnchor = _s[0], setColumnMenuAnchor = _s[1];
    var _t = (0, react_1.useState)(null), filterMenuAnchor = _t[0], setFilterMenuAnchor = _t[1];
    var _u = (0, react_1.useState)(false), showFilterDialog = _u[0], setShowFilterDialog = _u[1];
    var _v = (0, react_1.useState)({}), currentFilter = _v[0], setCurrentFilter = _v[1];
    var processedData = (0, react_1.useMemo)(function () {
        var result = __spreadArray([], (data || []), true);
        if (searchTerm) {
            result = result.filter(function (row) { return Object.entries(row).some(function (_a) {
                var key = _a[0], value = _a[1];
                var column = columns.find(function (col) { return col.id === key; });
                return (column === null || column === void 0 ? void 0 : column.filterable) !== false &&
                    String(value).toLowerCase().includes(searchTerm.toLowerCase());
            }); });
        }
        filters.forEach(function (filter) {
            result = result.filter(function (row) {
                var value = row[filter.column];
                switch (filter.operator) {
                    case 'equals':
                        return value === filter.value;
                    case 'contains':
                        return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
                    case 'greater':
                        return value > filter.value;
                    case 'less':
                        return value < filter.value;
                    case 'between':
                        var _a = filter.value, min = _a[0], max = _a[1];
                        return value >= min && value <= max;
                    default:
                        return true;
                }
            });
        });
        if (sortBy) {
            result.sort(function (a, b) {
                var aValue = a[sortBy];
                var bValue = b[sortBy];
                var column = columns.find(function (col) { return col.id === sortBy; });
                if (column === null || column === void 0 ? void 0 : column.numeric) {
                    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
                }
                return sortDirection === 'asc'
                    ? String(aValue).localeCompare(String(bValue))
                    : String(bValue).localeCompare(String(aValue));
            });
        }
        return result;
    }, [data, searchTerm, filters, sortBy, sortDirection, columns]);
    var handleSort = function (column) {
        var isAsc = sortBy === column && sortDirection === 'asc';
        var newDirection = isAsc ? 'desc' : 'asc';
        setSortBy(column);
        setSortDirection(newDirection);
        onSort === null || onSort === void 0 ? void 0 : onSort(column, newDirection);
    };
    var handleFilter = function (filter) {
        setFilters(function (prev) { return __spreadArray(__spreadArray([], prev, true), [filter], false); });
        setShowFilterDialog(false);
        setCurrentFilter({});
        onFilter === null || onFilter === void 0 ? void 0 : onFilter(filters);
    };
    var handleRemoveFilter = function (index) {
        setFilters(function (prev) { return prev.filter(function (_, i) { return i !== index; }); });
    };
    var handlePageChange = function (_, newPage) {
        setPage(newPage);
    };
    var handleRowsPerPageChange = function (event) {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };
    var handleSelectAll = function (event) {
        if (event.target.checked) {
            setSelectedRows(processedData);
            onRowSelect === null || onRowSelect === void 0 ? void 0 : onRowSelect(processedData);
        }
        else {
            setSelectedRows([]);
            onRowSelect === null || onRowSelect === void 0 ? void 0 : onRowSelect([]);
        }
    };
    var handleSelectRow = function (row) {
        var selectedIndex = selectedRows.findIndex(function (r) { return r.id === row.id; });
        var newSelected = [];
        if (selectedIndex === -1) {
            newSelected = __spreadArray(__spreadArray([], selectedRows, true), [row], false);
        }
        else {
            newSelected = selectedRows.filter(function (r) { return r.id !== row.id; });
        }
        setSelectedRows(newSelected);
        onRowSelect === null || onRowSelect === void 0 ? void 0 : onRowSelect(newSelected);
    };
    var handleAction = function (action) {
        onAction === null || onAction === void 0 ? void 0 : onAction(action, selectedRows);
    };
    var handleExport = function () {
        var csv = __spreadArray([
            columns.filter(function (col) { return !col.hidden; }).map(function (col) { return col.label; })
        ], processedData.map(function (row) { return columns
            .filter(function (col) { return !col.hidden; })
            .map(function (col) {
            var value = row[col.id];
            return col.format ? col.format(value) : value;
        }); }), true).map(function (row) { return row.join(','); }).join('\n');
        var blob = new Blob([csv], { type: 'text/csv' });
        var url = window.URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'export.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };
    return (_jsxs(Box, { sx: Object.assign({ width: '100%' }, sx), className: className, children: [_jsxs(material_1.Toolbar, { sx: { pl: 2, pr: 1 }, children: [_jsx(material_1.Typography, { sx: { flex: '1 1 100%' }, variant: "h6", component: "div", children: selectedRows.length > 0 ? ("".concat(selectedRows.length, " selected")) : ('Data Table') }), searchable && (_jsx(material_1.TextField, { size: "small", placeholder: "Search...", value: searchTerm, onChange: function (e) { return setSearchTerm(e.target.value); }, InputProps: {
                            startAdornment: _jsx(icons_material_1.Search, { fontSize: "small", sx: { mr: 1 } })
                        }, sx: { mr: 2 } })), _jsxs(material_1.Box, { display: "flex", gap: 1, children: [actions.add && (_jsx(material_1.Tooltip, { title: "Add", children: _jsx(material_1.IconButton, { onClick: function () { return handleAction('add'); }, children: _jsx(icons_material_1.Add, {}) }) })), actions.edit && selectedRows.length === 1 && (_jsx(material_1.Tooltip, { title: "Edit", children: _jsx(material_1.IconButton, { onClick: function () { return handleAction('edit'); }, children: _jsx(icons_material_1.Edit, {}) }) })), actions.delete && selectedRows.length > 0 && (_jsx(material_1.Tooltip, { title: "Delete", children: _jsx(material_1.IconButton, { onClick: function () { return handleAction('delete'); }, children: _jsx(icons_material_1.Delete, {}) }) })), actions.refresh && (_jsx(material_1.Tooltip, { title: "Refresh", children: _jsx(material_1.IconButton, { onClick: function () { return handleAction('refresh'); }, children: _jsx(icons_material_1.Refresh, {}) }) })), actions.export && (_jsx(material_1.Tooltip, { title: "Export", children: _jsx(material_1.IconButton, { onClick: handleExport, children: _jsx(icons_material_1.Download, {}) }) })), _jsx(material_1.Tooltip, { title: "Filter", children: _jsx(material_1.IconButton, { onClick: function (e) { return setFilterMenuAnchor(e.currentTarget); }, children: _jsx(icons_material_1.FilterList, {}) }) }), _jsx(material_1.Tooltip, { title: "Columns", children: _jsx(material_1.IconButton, { onClick: function (e) { return setColumnMenuAnchor(e.currentTarget); }, children: _jsx(icons_material_1.ViewColumn, {}) }) })] })] }), filters.length > 0 && (_jsx(material_1.Box, { p: 1, display: "flex", gap: 1, flexWrap: "wrap", children: filters.map(function (filter, index) { return (_jsx(material_1.Chip, { label: "".concat(filter.column, " ").concat(filter.operator, " ").concat(filter.value), onDelete: function () { return handleRemoveFilter(index); } }, index)); }) })), _jsx(TableContainer, { sx: { maxHeight: stickyHeader ? 440 : undefined }, children: _jsxs(Table, { stickyHeader: stickyHeader, size: dense ? 'small' : 'medium', children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [selectable && (_jsx(TableCell, { padding: "checkbox", children: _jsx(material_1.Checkbox, { indeterminate: selectedRows.length > 0 && selectedRows.length < processedData.length, checked: processedData.length > 0 && selectedRows.length === processedData.length, onChange: handleSelectAll }) })), columns.filter(function (col) { return !col.hidden; }).map(function (column) { return (_jsx(TableCell, { align: column.align || (column.numeric ? 'right' : 'left'), style: { width: column.width }, children: column.sortable !== false ? (_jsx(TableSortLabel, { active: sortBy === column.id, direction: sortBy === column.id ? sortDirection : 'asc', onClick: function () { return handleSort(column.id); }, children: column.label })) : (column.label) }, column.id)); })] }) }), _jsx(TableBody, { children: isLoading ? (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: columns.length + (selectable ? 1 : 0), align: "center", children: loadingMessage || 'Loading...' }) })) : hasError ? (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: columns.length + (selectable ? 1 : 0), align: "center", children: errorMessage || 'An error occurred' }) })) : processedData.length === 0 ? (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: columns.length + (selectable ? 1 : 0), align: "center", children: "No data available" }) })) : (processedData
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map(function (row, index) { return (_jsxs(TableRow, { hover: true, onClick: function () { return onRowClick === null || onRowClick === void 0 ? void 0 : onRowClick(row); }, selected: selectedRows.some(function (r) { return r.id === row.id; }), sx: { cursor: onRowClick ? 'pointer' : undefined }, children: [selectable && (_jsx(TableCell, { padding: "checkbox", children: _jsx(material_1.Checkbox, { checked: selectedRows.some(function (r) { return r.id === row.id; }), onChange: function () { return handleSelectRow(row); }, onClick: function (e) { return e.stopPropagation(); } }) })), columns.filter(function (col) { return !col.hidden; }).map(function (column) { return (_jsx(TableCell, { align: column.align || (column.numeric ? 'right' : 'left'), children: column.format
                                            ? column.format(row[column.id])
                                            : row[column.id] }, column.id)); })] }, row.id)); })) })] }) }), _jsx(TablePagination, { rowsPerPageOptions: rowsPerPageOptions, component: "div", count: processedData.length, rowsPerPage: rowsPerPage, page: page, onPageChange: handlePageChange, onRowsPerPageChange: handleRowsPerPageChange }), _jsx(material_1.Menu, { anchorEl: columnMenuAnchor, open: Boolean(columnMenuAnchor), onClose: function () { return setColumnMenuAnchor(null); }, children: columns.map(function (column) { return (_jsx(material_1.MenuItem, { children: _jsx(material_1.FormControlLabel, { control: _jsx(material_1.Checkbox, { checked: !column.hidden, onChange: function () {
                                setColumns(function (prev) { return prev.map(function (col) { return col.id === column.id
                                    ? Object.assign(Object.assign({}, col), { hidden: !col.hidden }) : col; }); });
                            } }), label: column.label }) }, column.id)); }) }), _jsx(material_1.Menu, { anchorEl: filterMenuAnchor, open: Boolean(filterMenuAnchor), onClose: function () { return setFilterMenuAnchor(null); }, children: columns
                    .filter(function (col) { return col.filterable !== false; })
                    .map(function (column) { return (_jsx(material_1.MenuItem, { onClick: function () {
                        setCurrentFilter({ column: column.id });
                        setShowFilterDialog(true);
                        setFilterMenuAnchor(null);
                    }, children: column.label }, column.id)); }) }), _jsxs(material_1.Dialog, { open: showFilterDialog, onClose: function () { return setShowFilterDialog(false); }, maxWidth: "xs", fullWidth: true, children: [_jsx(material_1.DialogTitle, { children: "Add Filter" }), _jsx(material_1.DialogContent, { children: _jsxs(material_1.Box, { display: "flex", flexDirection: "column", gap: 2, mt: 1, children: [_jsx(FormControl, { fullWidth: true, children: _jsxs(material_1.TextField, { select: true, label: "Operator", value: currentFilter.operator || '', onChange: function (e) { return setCurrentFilter(function (prev) { return (Object.assign(Object.assign({}, prev), { operator: e.target.value })); }); }, children: [_jsx(material_1.MenuItem, { value: "equals", children: "Equals" }), _jsx(material_1.MenuItem, { value: "contains", children: "Contains" }), _jsx(material_1.MenuItem, { value: "greater", children: "Greater Than" }), _jsx(material_1.MenuItem, { value: "less", children: "Less Than" }), _jsx(material_1.MenuItem, { value: "between", children: "Between" })] }) }), _jsx(material_1.TextField, { label: "Value", value: currentFilter.value || '', onChange: function (e) { return setCurrentFilter(function (prev) { return (Object.assign(Object.assign({}, prev), { value: e.target.value })); }); } })] }) }), _jsxs(material_1.DialogActions, { children: [_jsx(material_1.Button, { onClick: function () { return setShowFilterDialog(false); }, children: "Cancel" }), _jsx(material_1.Button, { onClick: function () { return handleFilter(currentFilter); }, variant: "contained", disabled: !currentFilter.column || !currentFilter.operator || !currentFilter.value, children: "Add Filter" })] })] })] }));
}
