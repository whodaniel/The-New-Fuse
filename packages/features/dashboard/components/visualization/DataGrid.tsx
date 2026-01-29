import { FC, useState } from 'react';

interface Column {
  Header: string;
  accessor: string;
}

interface DataGridProps {
  data: any[];
  columns: Column[];
  pageSize?: number;
  className?: string;
}

export const DataGrid: FC<DataGridProps> = ({ data, columns, pageSize = 10, className = '' }) => {
  const [filterInput, setFilterInput] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  const filteredData = data.filter((item) =>
    Object.values(item).some(
      (val) => val && val.toString().toLowerCase().includes(filterInput.toLowerCase())
    )
  );

  const pageCount = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search */}
      <div className="flex justify-between items-center">
        <input
          value={filterInput}
          onChange={(e) => {
            setFilterInput(e.target.value);
            setCurrentPage(0);
          }}
          placeholder="Search..."
          className="max-w-xs border border-gray-300 rounded-md p-2"
        />
        <div className="text-sm text-gray-500">
          Showing {paginatedData.length} of {filteredData.length} items
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.accessor}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.Header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row, i) => (
              <tr key={i}>
                {columns.map((column) => (
                  <td
                    key={column.accessor}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                  >
                    {row[column.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(0)}
              disabled={currentPage === 0}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(pageCount - 1, prev + 1))}
              disabled={currentPage === pageCount - 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(pageCount - 1)}
              disabled={currentPage === pageCount - 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
            >
              Last
            </button>
          </div>
          <span className="text-sm text-gray-700">
            Page{' '}
            <strong>
              {currentPage + 1} of {pageCount}
            </strong>
          </span>
        </div>
      )}
    </div>
  );
};
