import React from 'react';
import { Column, CellValue, AppState, Row } from '@the-new-fuse/fairtable-core';
interface TableCellProps {
    value: CellValue;
    row: Row;
    column: Column;
    appState: AppState;
    onUpdateCell: (newValue: CellValue) => void;
    onOpenLinkRecordModal: (rowId: string, columnId: string, linkedTableId: string, currentLinkedIds: string[]) => void;
}
declare const _default: React.NamedExoticComponent<TableCellProps>;
export default _default;
//# sourceMappingURL=TableCell.d.ts.map