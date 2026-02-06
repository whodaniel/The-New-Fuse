/**
 * DataTable Component - Advanced data table with sorting, filtering, pagination
 * Replaces corrupted Material-UI version with Tailwind + Custom Design System
 */

import { Button } from '@/components/ui/design-system';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  ChevronDown,
  ChevronUp,
  Download,
  Edit,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { ReactNode, useMemo, useState } from 'react';

export interface Column<T = any> {
  id: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  numeric?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  hidden?: boolean;
  format?: (value: any) => ReactNode;
}

interface DataTableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  loadingMessage?: string;
  hasError?: boolean;
  errorMessage?: string;
  defaultSort?: { column: string; direction: 'asc' | 'desc' };
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  onFilter?: (filters: any[]) => void;
  onRowClick?: (row: T) => void;
  onRowSelect?: (rows: T[]) => void;
  actions?: {
    add?: boolean;
    edit?: boolean;
    delete?: boolean;
    refresh?: boolean;
    export?: boolean;
  };
  onAction?: (action: string, selectedRows: T[]) => void;
  rowsPerPageOptions?: number[];
  defaultPageSize?: number;
  stickyHeader?: boolean;
  dense?: boolean;
  selectable?: boolean;
  searchable?: boolean;
  className?: string;
}

export function DataTable<T extends { id: string | number }>({
  columns: initialColumns,
  data = [],
  isLoading = false,
  loadingMessage = 'Loading...',
  hasError = false,
  errorMessage,
  defaultSort,
  onSort,
  onFilter,
  onRowClick,
  onRowSelect,
  actions = {},
  onAction,
  rowsPerPageOptions = [10, 25, 50, 100],
  defaultPageSize = 10,
  stickyHeader = true,
  dense = false,
  selectable = false,
  searchable = true,
  className,
}: DataTableProps<T>) {
  const [columns, setColumns] = useState(initialColumns);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultPageSize);
  const [sortBy, setSortBy] = useState(defaultSort?.column || '');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
    defaultSort?.direction || 'asc'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState<T[]>([]);

  // Process data (search, filter, sort)
  const processedData = useMemo(() => {
    let result = [...data];

    // Search
    if (searchTerm) {
      result = result.filter((row) =>
        Object.entries(row).some(([key, value]) => {
          const column = columns.find((col) => col.id === key);
          return (
            column?.filterable !== false &&
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
          );
        })
      );
    }

    // Sort
    if (sortBy) {
      result.sort((a, b) => {
        const aValue = (a as any)[sortBy];
        const bValue = (b as any)[sortBy];
        const column = columns.find((col) => col.id === sortBy);

        if (column?.numeric) {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }

        return sortDirection === 'asc'
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      });
    }

    return result;
  }, [data, searchTerm, sortBy, sortDirection, columns]);

  const handleSort = (column: string) => {
    const isAsc = sortBy === column && sortDirection === 'asc';
    const newDirection: 'asc' | 'desc' = isAsc ? 'desc' : 'asc';
    setSortBy(column);
    setSortDirection(newDirection);
    onSort?.(column, newDirection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(processedData);
      onRowSelect?.(processedData);
    } else {
      setSelectedRows([]);
      onRowSelect?.([]);
    }
  };

  const handleSelectRow = (row: T) => {
    const selectedIndex = selectedRows.findIndex((r) => r.id === row.id);
    let newSelected: T[] = [];

    if (selectedIndex === -1) {
      newSelected = [...selectedRows, row];
    } else {
      newSelected = selectedRows.filter((r) => r.id !== row.id);
    }

    setSelectedRows(newSelected);
    onRowSelect?.(newSelected);
  };

  const handleExport = () => {
    const csv = [
      columns.filter((col) => !col.hidden).map((col) => col.label),
      ...processedData.map((row) =>
        columns
          .filter((col) => !col.hidden)
          .map((col) => {
            const value = (row as any)[col.id];
            return col.format ? col.format(value) : value;
          })
      ),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const paginatedData = processedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <div className={cn('w-full', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
        <div className="text-lg font-semibold">
          {selectedRows.length > 0 ? `${selectedRows.length} selected` : 'Data Table'}
        </div>

        <div className="flex items-center gap-2">
          {searchable && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-sm"
              />
            </div>
          )}

          {actions.add && (
            <Tooltip label="Add">
              <button
                onClick={() => onAction?.('add', selectedRows)}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded"
              >
                <Plus className="h-4 w-4" />
              </button>
            </Tooltip>
          )}

          {actions.edit && selectedRows.length === 1 && (
            <Tooltip label="Edit">
              <button
                onClick={() => onAction?.('edit', selectedRows)}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded"
              >
                <Edit className="h-4 w-4" />
              </button>
            </Tooltip>
          )}

          {actions.delete && selectedRows.length > 0 && (
            <Tooltip label="Delete">
              <button
                onClick={() => onAction?.('delete', selectedRows)}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded text-danger-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </Tooltip>
          )}

          {actions.refresh && (
            <Tooltip label="Refresh">
              <button
                onClick={() => onAction?.('refresh', selectedRows)}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </Tooltip>
          )}

          {actions.export && (
            <Tooltip label="Export">
              <button
                onClick={handleExport}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded"
              >
                <Download className="h-4 w-4" />
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Table */}
      <div className={cn('overflow-x-auto', stickyHeader && 'max-h-[440px] overflow-y-auto')}>
        <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
          <thead
            className={cn('bg-neutral-50 dark:bg-neutral-900', stickyHeader && 'sticky top-0 z-10')}
          >
            <tr>
              {selectable && (
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      processedData.length > 0 && selectedRows.length === processedData.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded"
                  />
                </th>
              )}
              {columns
                .filter((col) => !col.hidden)
                .map((column) => (
                  <th
                    key={column.id}
                    className={cn(
                      'px-6 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider',
                      column.align === 'right' && 'text-right',
                      column.align === 'center' && 'text-center',
                      column.sortable !== false &&
                        'cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    )}
                    style={{ width: column.width }}
                    onClick={() => column.sortable !== false && handleSort(column.id)}
                  >
                    <div className="flex items-center gap-2">
                      {column.label}
                      {sortBy === column.id &&
                        (sortDirection === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </th>
                ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-6 py-8 text-center text-neutral-500"
                >
                  {loadingMessage}
                </td>
              </tr>
            ) : hasError ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-6 py-8 text-center text-danger-600"
                >
                  {errorMessage || 'An error occurred'}
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-6 py-8 text-center text-neutral-500"
                >
                  No data available
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'hover:bg-neutral-50 dark:hover:bg-neutral-700',
                    onRowClick && 'cursor-pointer',
                    selectedRows.some((r) => r.id === row.id) &&
                      'bg-primary-50 dark:bg-primary-900/20'
                  )}
                >
                  {selectable && (
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedRows.some((r) => r.id === row.id)}
                        onChange={() => handleSelectRow(row)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded"
                      />
                    </td>
                  )}
                  {columns
                    .filter((col) => !col.hidden)
                    .map((column) => (
                      <td
                        key={column.id}
                        className={cn(
                          dense ? 'px-4 py-2' : 'px-6 py-4',
                          'text-sm text-neutral-900 dark:text-neutral-100',
                          column.align === 'right' && 'text-right',
                          column.align === 'center' && 'text-center'
                        )}
                      >
                        {column.format
                          ? column.format((row as any)[column.id])
                          : (row as any)[column.id]}
                      </td>
                    ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between p-4 border-t border-neutral-200 dark:border-neutral-700">
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          Showing {page * rowsPerPage + 1} to{' '}
          {Math.min((page + 1) * rowsPerPage, processedData.length)} of {processedData.length}{' '}
          results
        </div>
        <div className="flex items-center gap-4">
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setPage(0);
            }}
            className="px-3 py-1 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-sm"
          >
            {rowsPerPageOptions.map((option) => (
              <option key={option} value={option}>
                {option} per page
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={(page + 1) * rowsPerPage >= processedData.length}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
