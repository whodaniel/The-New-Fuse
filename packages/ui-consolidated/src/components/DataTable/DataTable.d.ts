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
declare function DataTable({ data, columns, className, onRowClick }: DataTableProps): JSX.Element;
export { DataTable };
export { DataTable as Table };
//# sourceMappingURL=DataTable.d.ts.map