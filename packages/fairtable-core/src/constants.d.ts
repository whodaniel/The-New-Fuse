import { DataType, ViewType, FilterOperator, View, KanbanViewOptions, TimelineViewOptions, Table } from './types';
export declare const DEFAULT_COLUMN_WIDTH = 180;
export declare const MIN_COLUMN_WIDTH = 80;
export declare const ROW_HEIGHT = 40;
export declare const TIMELINE_DEFAULT_ITEM_DURATION_DAYS = 1;
export declare const DATA_TYPE_ICONS: Record<DataType | ViewType, string>;
export declare const DATA_TYPE_OPTIONS: {
    value: DataType;
    label: string;
    icon: string;
}[];
export declare const FILTER_OPERATOR_OPTIONS: Record<FilterOperator, {
    label: string;
    applicableTypes: DataType[];
}>;
export declare const SINGLE_SELECT_COLOR_PALETTE: {
    name: string;
    value: string;
}[];
export declare const NEW_TABLE_DEFAULT_NAME = "New Table";
export declare const NEW_COLUMN_DEFAULT_NAME = "New Column";
export declare const NEW_VIEW_DEFAULT_NAME = "New View";
export declare const getDefaultGridView: () => View;
export declare const getDefaultKanbanViewOptions: (table: Table) => KanbanViewOptions;
export declare const getDefaultTimelineViewOptions: (table: Table) => TimelineViewOptions;
//# sourceMappingURL=constants.d.ts.map