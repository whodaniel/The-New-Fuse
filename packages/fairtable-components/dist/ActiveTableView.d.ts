import React from 'react';
import { Table, View, Row, Column, CellValue, AppState } from '@the-new-fuse/fairtable-core';
interface ActiveTableViewProps {
    table: Table;
    view: View;
    appState: AppState;
    onAddColumn: () => void;
    onUpdateColumn: (columnId: string, updates: Partial<Column>) => void;
    onDeleteColumn: (columnId: string) => void;
    onReorderColumn: (draggedColumnId: string, targetColumnId: string) => void;
    onAddRow: (parentId?: string | null, defaultValues?: Partial<Row['data']>) => void;
    onUpdateCell: (rowId: string, columnId: string, value: CellValue) => void;
    onDeleteRow: (rowId: string) => void;
    onToggleRowCollapse: (rowId: string) => void;
    onOpenLinkRecordModal: (rowId: string, columnId: string, linkedTableId: string, currentLinkedIds: string[]) => void;
    onUpdateViewSpecificOptions: (viewId: string, options: View['viewSpecificOptions']) => void;
}
declare const ActiveTableView: React.FC<ActiveTableViewProps>;
export default ActiveTableView;
//# sourceMappingURL=ActiveTableView.d.ts.map