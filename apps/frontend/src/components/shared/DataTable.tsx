"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataTable = DataTable;
import react_1 from 'react';
import material_1 from '@mui/material';
import icons_material_1 from '@mui/icons-material';
function DataTable({ columns: initialColumns, data, isLoading, loadingMessage, hasError, errorMessage, defaultSort, onSort, onFilter, onRowClick, onRowSelect, actions = {}, onAction, rowsPerPageOptions = [10, 25, 50, 100], defaultPageSize = 10, stickyHeader = true, dense = false, selectable = false, searchable = true, sx, className }) {
    const [columns, setColumns] = (0, react_1.useState)(initialColumns);
    const [page, setPage] = (0, react_1.useState)(0);
    const [rowsPerPage, setRowsPerPage] = (0, react_1.useState)(defaultPageSize);
    const [sortBy, setSortBy] = (0, react_1.useState)((defaultSort === null || defaultSort === void 0 ? void 0 : defaultSort.column) || '');
    const [sortDirection, setSortDirection] = (0, react_1.useState)((defaultSort === null || defaultSort === void 0 ? void 0 : defaultSort.direction) || 'asc');
    const [filters, setFilters] = (0, react_1.useState)([]);
    const [searchTerm, setSearchTerm] = (0, react_1.useState)('');
    const [selectedRows, setSelectedRows] = (0, react_1.useState)([]);
    const [columnMenuAnchor, setColumnMenuAnchor] = (0, react_1.useState)(null);
    const [filterMenuAnchor, setFilterMenuAnchor] = (0, react_1.useState)(null);
    const [showFilterDialog, setShowFilterDialog] = (0, react_1.useState)(false);
    const [currentFilter, setCurrentFilter] = (0, react_1.useState)({});
    const processedData = (0, react_1.useMemo)(() => {
        let result = [...(data || [])];
        if (searchTerm) {
            result = result.filter(row => Object.entries(row).some(([key, value]) => {
                const column = columns.find(col => col.id === key);
                return (column === null || column === void 0 ? void 0 : column.filterable) !== false &&
                    String(value).toLowerCase().includes(searchTerm.toLowerCase());
            }));
        }
        filters.forEach(filter => {
            result = result.filter(row => {
                const value = row[filter.column];
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
                        const [min, max] = filter.value;
                        return value >= min && value <= max;
                    default:
                        return true;
                }
            });
        });
        if (sortBy) {
            result.sort((a, b) => {
                const aValue = a[sortBy];
                const bValue = b[sortBy];
                const column = columns.find(col => col.id === sortBy);
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
    const handleSort = (column) => {
        const isAsc = sortBy === column && sortDirection === 'asc';
        const newDirection = isAsc ? 'desc' : 'asc';
        setSortBy(column);
        setSortDirection(newDirection);
        onSort === null || onSort === void 0 ? void 0 : onSort(column, newDirection);
    };
    const handleFilter = (filter) => {
        setFilters((prev: any) => [...prev, filter]);
        setShowFilterDialog(false);
        setCurrentFilter({});
        onFilter === null || onFilter === void 0 ? void 0 : onFilter(filters);
    };
    const handleRemoveFilter = (index) => {
        setFilters((prev: any) => prev.filter((_, i) => i !== index));
    };
    const handlePageChange = (_, newPage) => {
        setPage(newPage);
    };
    const handleRowsPerPageChange = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };
    const handleSelectAll = (event) => {
        if (event.target.checked) {
            setSelectedRows(processedData);
            onRowSelect === null || onRowSelect === void 0 ? void 0 : onRowSelect(processedData);
        }
        else {
            setSelectedRows([]);
            onRowSelect === null || onRowSelect === void 0 ? void 0 : onRowSelect([]);
        }
    };
    const handleSelectRow = (row) => {
        const selectedIndex = selectedRows.findIndex(r => r.id === row.id);
        let newSelected = [];
        if (selectedIndex === -1) {
            newSelected = [...selectedRows, row];
        }
        else {
            newSelected = selectedRows.filter(r => r.id !== row.id);
        }
        setSelectedRows(newSelected);
        onRowSelect === null || onRowSelect === void 0 ? void 0 : onRowSelect(newSelected);
    };
    const handleAction = (action) => {
        onAction === null || onAction === void 0 ? void 0 : onAction(action, selectedRows);
    };
    const handleExport = () => {
        const csv = [
            columns.filter(col => !col.hidden).map(col => col.label),
            ...processedData.map(row => columns
                .filter(col => !col.hidden)
                .map(col => {
                const value = row[col.id];
                return col.format ? col.format(value) : value;
            }))
        ].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'export.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };
    return (<material_1.Paper sx={Object.assign({ width: '100%' }, sx)} className={className}>
            <material_1.Toolbar sx={{ pl: 2, pr: 1 }}>
                <material_1.Typography sx={{ flex: '1 1 100%' }} variant="h6" component="div">
                    {selectedRows.length > 0 ? (`${selectedRows.length} selected`) : ('Data Table')}
                </material_1.Typography>

                {searchable && (<material_1.TextField size="small" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} InputProps={{
                startAdornment: <icons_material_1.Search fontSize="small" sx={{ mr: 1 }}/>
            }} sx={{ mr: 2 }}/>)}

                <material_1.Box display="flex" gap={1}>
                    {actions.add && (<material_1.Tooltip title="Add">
                            <material_1.IconButton onClick={() => handleAction('add')}>
                                <icons_material_1.Add />
                            </material_1.IconButton>
                        </material_1.Tooltip>)}
                    {actions.edit && selectedRows.length === 1 && (<material_1.Tooltip title="Edit">
                            <material_1.IconButton onClick={() => handleAction('edit')}>
                                <icons_material_1.Edit />
                            </material_1.IconButton>
                        </material_1.Tooltip>)}
                    {actions.delete && selectedRows.length > 0 && (<material_1.Tooltip title="Delete">
                            <material_1.IconButton onClick={() => handleAction('delete')}>
                                <icons_material_1.Delete />
                            </material_1.IconButton>
                        </material_1.Tooltip>)}
                    {actions.refresh && (<material_1.Tooltip title="Refresh">
                            <material_1.IconButton onClick={() => handleAction('refresh')}>
                                <icons_material_1.Refresh />
                            </material_1.IconButton>
                        </material_1.Tooltip>)}
                    {actions.export && (<material_1.Tooltip title="Export">
                            <material_1.IconButton onClick={handleExport}>
                                <icons_material_1.Download />
                            </material_1.IconButton>
                        </material_1.Tooltip>)}
                    <material_1.Tooltip title="Filter">
                        <material_1.IconButton onClick={(e) => setFilterMenuAnchor(e.currentTarget)}>
                            <icons_material_1.FilterList />
                        </material_1.IconButton>
                    </material_1.Tooltip>
                    <material_1.Tooltip title="Columns">
                        <material_1.IconButton onClick={(e) => setColumnMenuAnchor(e.currentTarget)}>
                            <icons_material_1.ViewColumn />
                        </material_1.IconButton>
                    </material_1.Tooltip>
                </material_1.Box>
            </material_1.Toolbar>

            {filters.length > 0 && (<material_1.Box p={1} display="flex" gap={1} flexWrap="wrap">
                    {filters.map((filter, index) => (<material_1.Chip key={index} label={`${filter.column} ${filter.operator} ${filter.value}`} onDelete={() => handleRemoveFilter(index)}/>))}
                </material_1.Box>)}

            <material_1.TableContainer sx={{ maxHeight: stickyHeader ? 440 : undefined }}>
                <material_1.Table stickyHeader={stickyHeader} size={dense ? 'small' : 'medium'}>
                    <material_1.TableHead>
                        <material_1.TableRow>
                            {selectable && (<material_1.TableCell padding="checkbox">
                                    <material_1.Checkbox indeterminate={selectedRows.length > 0 && selectedRows.length < processedData.length} checked={processedData.length > 0 && selectedRows.length === processedData.length} onChange={handleSelectAll}/>
                                </material_1.TableCell>)}
                            {columns.filter(col => !col.hidden).map(column => (<material_1.TableCell key={column.id} align={column.align || (column.numeric ? 'right' : 'left')} style={{ width: column.width }}>
                                    {column.sortable !== false ? (<material_1.TableSortLabel active={sortBy === column.id} direction={sortBy === column.id ? sortDirection : 'asc'} onClick={() => handleSort(column.id)}>
                                            {column.label}
                                        </material_1.TableSortLabel>) : (column.label)}
                                </material_1.TableCell>))}
                        </material_1.TableRow>
                    </material_1.TableHead>
                    <material_1.TableBody>
                        {isLoading ? (<material_1.TableRow>
                                <material_1.TableCell colSpan={columns.length + (selectable ? 1 : 0)} align="center">
                                    {loadingMessage || 'Loading...'}
                                </material_1.TableCell>
                            </material_1.TableRow>) : hasError ? (<material_1.TableRow>
                                <material_1.TableCell colSpan={columns.length + (selectable ? 1 : 0)} align="center">
                                    {errorMessage || 'An error occurred'}
                                </material_1.TableCell>
                            </material_1.TableRow>) : processedData.length === 0 ? (<material_1.TableRow>
                                <material_1.TableCell colSpan={columns.length + (selectable ? 1 : 0)} align="center">
                                    No data available
                                </material_1.TableCell>
                            </material_1.TableRow>) : (processedData
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((row, index) => (<material_1.TableRow hover key={row.id} onClick={() => onRowClick === null || onRowClick === void 0 ? void 0 : onRowClick(row)} selected={selectedRows.some(r => r.id === row.id)} sx={{ cursor: onRowClick ? 'pointer' : undefined }}>
                                        {selectable && (<material_1.TableCell padding="checkbox">
                                                <material_1.Checkbox checked={selectedRows.some(r => r.id === row.id)} onChange={() => handleSelectRow(row)} onClick={(e) => e.stopPropagation()}/>
                                            </material_1.TableCell>)}
                                        {columns.filter(col => !col.hidden).map(column => (<material_1.TableCell key={column.id} align={column.align || (column.numeric ? 'right' : 'left')}>
                                                {column.format
                    ? column.format(row[column.id])
                    : row[column.id]}
                                            </material_1.TableCell>))}
                                    </material_1.TableRow>)))}
                    </material_1.TableBody>
                </material_1.Table>
            </material_1.TableContainer>

            <material_1.TablePagination rowsPerPageOptions={rowsPerPageOptions} component="div" count={processedData.length} rowsPerPage={rowsPerPage} page={page} onPageChange={handlePageChange} onRowsPerPageChange={handleRowsPerPageChange}/>

            <material_1.Menu anchorEl={columnMenuAnchor} open={Boolean(columnMenuAnchor)} onClose={() => setColumnMenuAnchor(null)}>
                {columns.map(column => (<material_1.MenuItem key={column.id}>
                        <material_1.FormControlLabel control={<material_1.Checkbox checked={!column.hidden} onChange={() => {
                    setColumns((prev: any) => prev.map(col => col.id === column.id
                        ? Object.assign(Object.assign({}, col), { hidden: !col.hidden }) : col));
                }}/>} label={column.label}/>
                    </material_1.MenuItem>))}
            </material_1.Menu>

            <material_1.Menu anchorEl={filterMenuAnchor} open={Boolean(filterMenuAnchor)} onClose={() => setFilterMenuAnchor(null)}>
                {columns
            .filter(col => col.filterable !== false)
            .map(column => (<material_1.MenuItem key={column.id} onClick={() => {
                setCurrentFilter({ column: column.id });
                setShowFilterDialog(true);
                setFilterMenuAnchor(null);
            }}>
                            {column.label}
                        </material_1.MenuItem>))}
            </material_1.Menu>

            <material_1.Dialog open={showFilterDialog} onClose={() => setShowFilterDialog(false)} maxWidth="xs" fullWidth>
                <material_1.DialogTitle>Add Filter</material_1.DialogTitle>
                <material_1.DialogContent>
                    <material_1.Box display="flex" flexDirection="column" gap={2} mt={1}>
                        <FormControl fullWidth>
                            <material_1.TextField select label="Operator" value={currentFilter.operator || ''} onChange={(e) => setCurrentFilter((prev: any) => (Object.assign(Object.assign({}, prev), { operator: e.target.value })))}>
                                <material_1.MenuItem value="equals">Equals</material_1.MenuItem>
                                <material_1.MenuItem value="contains">Contains</material_1.MenuItem>
                                <material_1.MenuItem value="greater">Greater Than</material_1.MenuItem>
                                <material_1.MenuItem value="less">Less Than</material_1.MenuItem>
                                <material_1.MenuItem value="between">Between</material_1.MenuItem>
                            </material_1.TextField>
                        </FormControl>
                        <material_1.TextField label="Value" value={currentFilter.value || ''} onChange={(e) => setCurrentFilter((prev: any) => (Object.assign(Object.assign({}, prev), { value: e.target.value })))}/>
                    </material_1.Box>
                </material_1.DialogContent>
                <material_1.DialogActions>
                    <material_1.Button onClick={() => setShowFilterDialog(false)}>Cancel</material_1.Button>
                    <material_1.Button onClick={() => handleFilter(currentFilter)} variant="contained" disabled={!currentFilter.column || !currentFilter.operator || !currentFilter.value}>
                        Add Filter
                    </material_1.Button>
                </material_1.DialogActions>
            </material_1.Dialog>
        </material_1.Paper>);
}
export {};
//# sourceMappingURL=DataTable.js.map