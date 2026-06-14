import React from 'react';
import { Table, Column, Row, CellValue, AppState, View } from '@the-new-fuse/fairtable-core';
interface GridViewProps {
    table: Table;
    view: View;
    appState: AppState;
    columnsToDisplay: Column[];
    rowsToDisplay: Row[];
    onAddColumn: () => void;
    onUpdateColumn: (columnId: string, updates: Partial<Column>) => void;
    onDeleteColumn: (columnId: string) => void;
    onReorderColumn: (draggedColumnId: string, targetColumnId: string) => void;
    onAddRow: () => void;
    onUpdateCell: (rowId: string, columnId: string, value: CellValue) => void;
    onDeleteRow: (rowId: string) => void;
    onOpenLinkRecordModal: (rowId: string, columnId: string, linkedTableId: string, currentLinkedIds: string[]) => void;
}
declare const GridView: React.FC<GridViewProps>;
export default GridView;
//# sourceMappingURL=TableView.d.ts.map