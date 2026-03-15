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
      <table className="min-w-full divide-y divide-border/50">
        <thead className="bg-transparent">
          <tr>
            {columns.map((column, idx) => (
              <th
                key={idx}
                scope="col"
                className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground/80"
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-transparent divide-y divide-border/40">
          {data.map((item, rowIdx) => (
            <tr
              key={rowIdx}
              onClick={() => onRowClick?.(item)}
              className={onRowClick ? 'cursor-pointer hover:bg-muted/30' : ''}
            >
              {columns.map((column, colIdx) => (
                <td
                  key={colIdx}
                  className="px-3 py-2 whitespace-nowrap text-sm text-muted-foreground"
                >
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

export { DataTable, DataTable as Table };
