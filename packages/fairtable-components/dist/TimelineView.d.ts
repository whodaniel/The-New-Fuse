import React from 'react';
import { Table, View, Row, Column, CellValue, AppState, TimelineViewOptions } from '@the-new-fuse/fairtable-core';
interface TimelineViewProps {
    table: Table;
    view: View;
    appState: AppState;
    columnsToDisplay: Column[];
    rowsToDisplay: Row[];
    timelineOptions: TimelineViewOptions;
    onUpdateCell: (rowId: string, columnId: string, value: CellValue) => void;
    onOpenLinkRecordModal: (rowId: string, columnId: string, linkedTableId: string, currentLinkedIds: string[]) => void;
}
declare const TimelineView: React.FC<TimelineViewProps>;
export default TimelineView;
//# sourceMappingURL=TimelineView.d.ts.map