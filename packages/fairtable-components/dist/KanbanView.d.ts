import React from 'react';
import { Table, View, Row, Column, CellValue, AppState, KanbanViewOptions } from '@the-new-fuse/fairtable-core';
interface KanbanViewProps {
    table: Table;
    view: View;
    appState: AppState;
    columnsToDisplay: Column[];
    rowsToDisplay: Row[];
    kanbanOptions: KanbanViewOptions;
    onUpdateCell: (rowId: string, columnId: string, value: CellValue) => void;
    onOpenLinkRecordModal: (rowId: string, columnId: string, linkedTableId: string, currentLinkedIds: string[]) => void;
    onAddRow: (parentId?: string | null, defaultValues?: Partial<Row['data']>) => void;
}
declare const KanbanView: React.FC<KanbanViewProps>;
export default KanbanView;
//# sourceMappingURL=KanbanView.d.ts.map