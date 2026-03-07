import React from "react";
"use strict";
var __spreadArray = (this && this.__spreadArray) || function (): JSX.Element to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableWidget = void 0;
var react_1 = require("react");
var TableWidget = function (): JSX.Element _a) {
    var data = _a.data, columns = _a.columns, title = _a.title, description = _a.description, loading = _a.loading, error = _a.error, _b = _a.className, className = _b === void 0 ? '' : _b, _c = _a.pageSize, pageSize = _c === void 0 ? 5 : _c;
    var _d = (0, react_1.useState)(1), currentPage = _d[0], setCurrentPage = _d[1];
    var _e = (0, react_1.useState)(null), sortConfig = _e[0], setSortConfig = _e[1];
    var handleSort = function (): JSX.Element key) {
        setSortConfig(function (): JSX.Element current) {
            if ((current === null || current === void 0 ? void 0 : current.key) === key) {
                return {
                    key: key,
                    direction: current.direction === 'asc' ? 'desc' : asc',
                };
            }
            return { key: key, direction: asc' };
        });
    };
    var sortedData = react_1.default.useMemo(function (): JSX.Element ) {
        if (!sortConfig)
            return data;
        return __spreadArray([], data, true).sort(function (): JSX.Element a, b) {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }, [data, sortConfig]);
    var totalPages = Math.ceil(sortedData.length / pageSize);
    var startIndex = (currentPage - 1) * pageSize;
    var paginatedData = sortedData.slice(startIndex, startIndex + pageSize);
    if (loading) {
        return (<div className={"bg-white rounded-lg shadow p-6 ".concat(className)}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {__spreadArray([], Array(pageSize), true).map(function (): JSX.Element _, i) { return (<div key={i} className="h-10 bg-gray-200 rounded"></div>); })}
          </div>
        </div>
      </div>);
    }
    if (error) {
        return (<div className={"bg-white rounded-lg shadow p-6 ".concat(className)}>
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Error loading table
          </h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
        </div>
      </div>);
    }
    return (<div className={"bg-white rounded-lg shadow p-6 ".concat(className)}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          {description && (<p className="mt-1 text-sm text-gray-500">{description}</p>)}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(function (): JSX.Element column) { return (<th key={column.key} scope="col" className={"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ".concat(column.width || '')}>
                  {column.sortable ? (<button className="group inline-flex items-center space-x-1" onClick={function (): JSX.Element ) { return handleSort(column.key); }}>
                      <span>{column.label}</span>
                      <span className="text-gray-400 group-hover:text-gray-500">
                        {(sortConfig === null || sortConfig === void 0 ? void 0 : sortConfig.key) === column.key ? (sortConfig.direction === 'asc' ? ('↑') : ('↓')) : ('↕')}
                      </span>
                    </button>) : (column.label)}
                </th>); })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map(function (): JSX.Element row, rowIndex) { return (<tr key={rowIndex}>
                {columns.map(function (): JSX.Element column) { return (<td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {column.render
                    ? column.render(row[column.key], row)
                    : row[column.key]}
                  </td>); })}
              </tr>); })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (<div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            <button onClick={function (): JSX.Element ) { return setCurrentPage(function (): JSX.Element p) { return Math.max(1, p - 1); }); }} disabled={currentPage === 1} className="px-3 py-1 border rounded-md text-sm disabled:opacity-50">
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button onClick={function (): JSX.Element ) { return setCurrentPage(function (): JSX.Element p) { return Math.min(totalPages, p + 1); }); }} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-md text-sm disabled:opacity-50">
              Next
            </button>
          </div>
        </div>)}
    </div>);
};
exports.TableWidget = TableWidget;
export {};
