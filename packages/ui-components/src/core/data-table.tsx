import React from 'react';

interface Column {
  header: string;
  accessor: string | ((item: any) => React.ReactNode);
  width?: string;
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  className?: string;
  onRowClick?: (item: any) => void;
}

function DataTable({ data, columns, className = '', onRowClick }: DataTableProps): JSX.Element {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, idx) => (
              <th
                key={idx}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item, rowIdx) => (
            <tr
              key={rowIdx}
              onClick={() => onRowClick?.(item)}
              className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
            >
              {columns.map((column, colIdx) => (
                <td key={colIdx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {typeof column.accessor === 'function'
                    ? column.accessor(item)
                    : String(item[column.accessor as keyof typeof item] || '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { DataTable };