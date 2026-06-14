import React, { DragEvent } from 'react';
import { Column, Table } from '@the-new-fuse/fairtable-core';
interface ColumnHeaderProps {
    column: Column;
    allTables: Table[];
    onUpdateColumn: (columnId: string, updates: Partial<Column>) => void;
    onDeleteColumn: (columnId: string) => void;
    onStartResize: (columnId: string, startX: number) => void;
    onColumnDragStart: (e: DragEvent<HTMLTableCellElement>, columnId: string) => void;
    onColumnDragOver: (e: DragEvent<HTMLTableCellElement>, columnId: string) => void;
    onColumnDrop: (e: DragEvent<HTMLTableCellElement>, columnId: string) => void;
    isDragTarget: boolean;
}
declare const ColumnHeader: React.FC<ColumnHeaderProps>;
export default ColumnHeader;
//# sourceMappingURL=ColumnHeader.d.ts.map