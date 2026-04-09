import React from "react";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataGrid = void 0;
var react_1 = require("react");
var react_table_1 = require("react-table");
var Input_1 = require("@/shared/ui/core/Input");
var Button_1 = require("../../../../core/components/ui/Button");
var DataGrid = function (): JSX.Element _a) {
    var data = _a.data, columns = _a.columns, _b = _a.pageSize, pageSize = _b === void 0 ? 10 : _b, _c = _a.className, className = _c === void 0 ? '' : _c;
    var _d = (0, react_1.useState)(''), filterInput = _d[0], setFilterInput = _d[1];
    var _e = (0, react_table_1.useTable)({
        columns: columns,
        data: data,
        initialState: { pageSize: pageSize },
    }, react_table_1.useFilters, react_table_1.useGlobalFilter, react_table_1.useSortBy, react_table_1.usePagination), getTableProps = _e.getTableProps, getTableBodyProps = _e.getTableBodyProps, headerGroups = _e.headerGroups, prepareRow = _e.prepareRow, page = _e.page, canPreviousPage = _e.canPreviousPage, canNextPage = _e.canNextPage, pageOptions = _e.pageOptions, pageCount = _e.pageCount, gotoPage = _e.gotoPage, nextPage = _e.nextPage, previousPage = _e.previousPage, setPageSize = _e.setPageSize, setGlobalFilter = _e.setGlobalFilter, pageIndex = _e.state.pageIndex;
    var handleFilterChange = function (): JSX.Element e) {
        var value = e.target.value || '';
        setFilterInput(value);
        setGlobalFilter(value);
    };
    return (<div className={"space-y-4 ".concat(className)}>
      {/* Search */}
      <div className="flex justify-between items-center">
        <Input_1.Input value={filterInput} onChange={handleFilterChange} placeholder="Search..." className="max-w-xs"/>
        <div className="flex items-center space-x-2">
          <select value={pageSize} onChange={function (): JSX.Element e) { return setPageSize(Number(e.target.value)); }} className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            {[10, 20, 30, 40, 50].map(function (): JSX.Element size) { return (<option key={size} value={size}>
                Show {size}
              </option>); })}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg">
        <table {...getTableProps()} className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {headerGroups.map(function (): JSX.Element headerGroup) { return (<tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(function (): JSX.Element column) { return (<th {...column.getHeaderProps(column.getSortByToggleProps())} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <span>{column.render('Header')}</span>
                      <span>
                        {column.isSorted ? (column.isSortedDesc ? ('↓') : ('↑')) : ('')}
                      </span>
                    </div>
                  </th>); })}
              </tr>); })}
          </thead>
          <tbody {...getTableBodyProps()} className="bg-white divide-y divide-gray-200">
            {page.map(function (): JSX.Element row) {
            prepareRow(row);
            return (<tr {...row.getRowProps()}>
                  {row.cells.map(function (): JSX.Element cell) { return (<td {...cell.getCellProps()} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cell.render('Cell')}
                    </td>); })}
                </tr>);
        })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button_1.Button onClick={function (): JSX.Element ) { return gotoPage(0); }} disabled={!canPreviousPage} variant="outline" size="sm">
            {'<<'}
          </Button_1.Button>
          <Button_1.Button onClick={function (): JSX.Element ) { return previousPage(); }} disabled={!canPreviousPage} variant="outline" size="sm">
            {'<'}
          </Button_1.Button>
          <Button_1.Button onClick={function (): JSX.Element ) { return nextPage(); }} disabled={!canNextPage} variant="outline" size="sm">
            {'>'}
          </Button_1.Button>
          <Button_1.Button onClick={function (): JSX.Element ) { return gotoPage(pageCount - 1); }} disabled={!canNextPage} variant="outline" size="sm">
            {'>>'}
          </Button_1.Button>
        </div>
        <span className="text-sm text-gray-700">
          Page{' '}
          <strong>
            {pageIndex + 1} of {pageOptions.length}
          </strong>
        </span>
      </div>
    </div>);
};
exports.DataGrid = DataGrid;
export {};
