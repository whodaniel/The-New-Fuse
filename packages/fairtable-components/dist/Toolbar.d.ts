import React from 'react';
import { Table, View, ViewType, Filter, Sort } from '@the-new-fuse/fairtable-core';
interface ToolbarProps {
    table: Table;
    view: View;
    onSetActiveView: (viewId: string) => void;
    onAddView: (type: ViewType, options?: View['viewSpecificOptions']) => void;
    onRenameView: (viewId: string, newName: string) => void;
    onDeleteView: (viewId: string) => void;
    onUpdateViewSpecificOptions: (viewId: string, options: View['viewSpecificOptions']) => void;
    onAddFilter: () => void;
    onUpdateFilter: (filterId: string, updates: Partial<Filter>) => void;
    onDeleteFilter: (filterId: string) => void;
    onAddSort: () => void;
    onUpdateSort: (sortId: string, updates: Partial<Sort>) => void;
    onDeleteSort: (sortId: string) => void;
    onAddRow: () => void;
}
declare const Toolbar: React.FC<ToolbarProps>;
export default Toolbar;
//# sourceMappingURL=Toolbar.d.ts.map