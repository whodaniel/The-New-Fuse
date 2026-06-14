import React from 'react';
import { Table } from '@the-new-fuse/fairtable-core';
interface TableTabsProps {
    tables: Table[];
    activeTableId: string | null;
    onSelectTable: (tableId: string) => void;
    onAddTable: () => void;
    onDeleteTable: (tableId: string) => void;
    onRenameTable: (tableId: string, newName: string) => void;
}
declare const TableTabs: React.FC<TableTabsProps>;
export default TableTabs;
//# sourceMappingURL=TableTabs.d.ts.map