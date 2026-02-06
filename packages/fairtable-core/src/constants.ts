import {
  DataType,
  FilterOperator,
  KanbanViewOptions,
  Table,
  TimelineViewOptions,
  View,
  ViewType,
} from './types.js';

// Simple ID generator function
const generateId = (): string => {
  return `id_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
};

export const DEFAULT_COLUMN_WIDTH = 180; // px
export const MIN_COLUMN_WIDTH = 80; // px
export const ROW_HEIGHT = 40; // px // For GridView
export const TIMELINE_DEFAULT_ITEM_DURATION_DAYS = 1; // Default duration for timeline items without an end date

export const DATA_TYPE_ICONS: Record<DataType | ViewType, string> = {
  [DataType.TEXT]: 'Aa',
  [DataType.NUMBER]: '#',
  [DataType.BOOLEAN]: '✓',
  [DataType.SINGLE_SELECT]: '▼',
  [DataType.LONG_TEXT]: '¶',
  [DataType.LINKED_RECORD]: '🔗',
  [DataType.FORMULA]: 'ƒ',
  [DataType.DATE]: '📅',
  [DataType.ATTACHMENT]: '📎',
  [DataType.URL]: '🌐',
  [DataType.EMAIL]: '✉️',
  [DataType.CREATED_TIME]: '⏱️',
  [DataType.LAST_MODIFIED_TIME]: '⏱️',
  [DataType.VOTES]: '👍', // Icon for Votes
  [ViewType.GRID]: '▦',
  [ViewType.KANBAN]: ' Kanban',
  [ViewType.CALENDAR]: '📅',
  [ViewType.GALLERY]: '🖼️',
  [ViewType.TIMELINE]: '📊',
};

export const DATA_TYPE_OPTIONS = [
  { value: DataType.TEXT, label: 'Text', icon: DATA_TYPE_ICONS[DataType.TEXT] },
  { value: DataType.NUMBER, label: 'Number', icon: DATA_TYPE_ICONS[DataType.NUMBER] },
  { value: DataType.BOOLEAN, label: 'Checkbox', icon: DATA_TYPE_ICONS[DataType.BOOLEAN] },
  {
    value: DataType.SINGLE_SELECT,
    label: 'Single Select',
    icon: DATA_TYPE_ICONS[DataType.SINGLE_SELECT],
  },
  { value: DataType.LONG_TEXT, label: 'Long Text', icon: DATA_TYPE_ICONS[DataType.LONG_TEXT] },
  { value: DataType.DATE, label: 'Date', icon: DATA_TYPE_ICONS[DataType.DATE] },
  { value: DataType.URL, label: 'URL', icon: DATA_TYPE_ICONS[DataType.URL] },
  { value: DataType.EMAIL, label: 'Email', icon: DATA_TYPE_ICONS[DataType.EMAIL] },
  {
    value: DataType.LINKED_RECORD,
    label: 'Link to another record',
    icon: DATA_TYPE_ICONS[DataType.LINKED_RECORD],
  },
  { value: DataType.FORMULA, label: 'Formula', icon: DATA_TYPE_ICONS[DataType.FORMULA] },
  { value: DataType.ATTACHMENT, label: 'Attachment', icon: DATA_TYPE_ICONS[DataType.ATTACHMENT] },
  { value: DataType.VOTES, label: 'Votes', icon: DATA_TYPE_ICONS[DataType.VOTES] },
  {
    value: DataType.CREATED_TIME,
    label: 'Created time',
    icon: DATA_TYPE_ICONS[DataType.CREATED_TIME],
  },
  {
    value: DataType.LAST_MODIFIED_TIME,
    label: 'Last modified time',
    icon: DATA_TYPE_ICONS[DataType.LAST_MODIFIED_TIME],
  },
];

export const FILTER_OPERATOR_OPTIONS: Record<
  FilterOperator,
  { label: string; applicableTypes: DataType[] }
> = {
  [FilterOperator.EQ]: {
    label: 'is',
    applicableTypes: [
      DataType.TEXT,
      DataType.NUMBER,
      DataType.SINGLE_SELECT,
      DataType.DATE,
      DataType.URL,
      DataType.EMAIL,
      DataType.BOOLEAN,
      DataType.VOTES,
    ],
  },
  [FilterOperator.NEQ]: {
    label: 'is not',
    applicableTypes: [
      DataType.TEXT,
      DataType.NUMBER,
      DataType.SINGLE_SELECT,
      DataType.DATE,
      DataType.URL,
      DataType.EMAIL,
      DataType.BOOLEAN,
      DataType.VOTES,
    ],
  },
  [FilterOperator.GT]: {
    label: '>',
    applicableTypes: [DataType.NUMBER, DataType.DATE, DataType.VOTES],
  },
  [FilterOperator.LT]: {
    label: '<',
    applicableTypes: [DataType.NUMBER, DataType.DATE, DataType.VOTES],
  },
  [FilterOperator.GTE]: {
    label: '>=',
    applicableTypes: [DataType.NUMBER, DataType.DATE, DataType.VOTES],
  },
  [FilterOperator.LTE]: {
    label: '<=',
    applicableTypes: [DataType.NUMBER, DataType.DATE, DataType.VOTES],
  },
  [FilterOperator.CONTAINS]: {
    label: 'contains',
    applicableTypes: [DataType.TEXT, DataType.LONG_TEXT, DataType.URL, DataType.EMAIL],
  },
  [FilterOperator.NOT_CONTAINS]: {
    label: 'does not contain',
    applicableTypes: [DataType.TEXT, DataType.LONG_TEXT, DataType.URL, DataType.EMAIL],
  },
  [FilterOperator.IS_EMPTY]: { label: 'is empty', applicableTypes: Object.values(DataType) },
  [FilterOperator.IS_NOT_EMPTY]: {
    label: 'is not empty',
    applicableTypes: Object.values(DataType),
  },
};

export const SINGLE_SELECT_COLOR_PALETTE: { name: string; value: string }[] = [
  { name: 'Gray', value: 'bg-gray-200 text-gray-800' },
  { name: 'Red', value: 'bg-red-200 text-red-800' },
  { name: 'Orange', value: 'bg-orange-200 text-orange-800' },
  { name: 'Amber', value: 'bg-amber-200 text-amber-800' },
  { name: 'Yellow', value: 'bg-yellow-200 text-yellow-800' },
  { name: 'Lime', value: 'bg-lime-200 text-lime-800' },
  { name: 'Green', value: 'bg-green-200 text-green-800' },
  { name: 'Emerald', value: 'bg-emerald-200 text-emerald-800' },
  { name: 'Teal', value: 'bg-teal-200 text-teal-800' },
  { name: 'Cyan', value: 'bg-cyan-200 text-cyan-800' },
  { name: 'Sky', value: 'bg-sky-200 text-sky-800' },
  { name: 'Blue', value: 'bg-blue-200 text-blue-800' },
  { name: 'Indigo', value: 'bg-indigo-200 text-indigo-800' },
  { name: 'Violet', value: 'bg-violet-200 text-violet-800' },
  { name: 'Purple', value: 'bg-purple-200 text-purple-800' },
  { name: 'Fuchsia', value: 'bg-fuchsia-200 text-fuchsia-800' },
  { name: 'Pink', value: 'bg-pink-200 text-pink-800' },
  { name: 'Rose', value: 'bg-rose-200 text-rose-800' },
];

export const NEW_TABLE_DEFAULT_NAME = 'New Table';
export const NEW_COLUMN_DEFAULT_NAME = 'New Column';
export const NEW_VIEW_DEFAULT_NAME = 'New View';

export const getDefaultGridView = (): View => ({
  id: generateId(),
  name: 'Grid',
  type: ViewType.GRID,
  filters: [],
  sorts: [],
  groupBy: [],
  viewSpecificOptions: {},
});

export const getDefaultKanbanViewOptions = (table: Table): KanbanViewOptions => {
  const { columns } = table;
  const singleSelectCol = columns.find((c) => c.type === DataType.SINGLE_SELECT);
  if (singleSelectCol) return { groupByColumnId: singleSelectCol.id };
  const linkedRecordCol = columns.find((c) => c.type === DataType.LINKED_RECORD);
  if (linkedRecordCol) return { groupByColumnId: linkedRecordCol.id };
  const textCol = columns.find((c) => c.type === DataType.TEXT);
  if (textCol) return { groupByColumnId: textCol.id };
  return { groupByColumnId: columns.length > 0 ? columns[0].id : null };
};

export const getDefaultTimelineViewOptions = (table: Table): TimelineViewOptions => {
  const { columns } = table;
  const dateColumns = columns.filter((c) => c.type === DataType.DATE);
  const firstDateCol = dateColumns[0];
  const secondDateCol = dateColumns.length > 1 ? dateColumns[1] : undefined;
  const firstTextCol = columns.find((c) => c.type === DataType.TEXT);

  return {
    startDateColumnId: firstDateCol?.id || null,
    endDateColumnId: secondDateCol?.id || null,
    labelColumnId: firstTextCol?.id || (columns.length > 0 ? columns[0].id : null),
  };
};
