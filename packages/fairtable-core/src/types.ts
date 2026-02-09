
export enum DataType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  SINGLE_SELECT = 'SINGLE_SELECT',
  LONG_TEXT = 'LONG_TEXT',
  LINKED_RECORD = 'LINKED_RECORD',
  FORMULA = 'FORMULA',
  DATE = 'DATE',
  ATTACHMENT = 'ATTACHMENT',
  URL = 'URL',
  EMAIL = 'EMAIL',
  CREATED_TIME = 'CREATED_TIME',
  LAST_MODIFIED_TIME = 'LAST_MODIFIED_TIME',
  VOTES = 'VOTES', // New DataType for votes
}

export interface SelectOption {
  id: string;
  name: string;
  colorClass: string;
}

export interface AttachmentFile {
  id: string;
  name: string;
  url: string; // Could be a data URL for local files or a remote URL
  type: string; // MIME type
  size: number; // bytes
}

export interface Column {
  id: string;
  name: string;
  type: DataType;
  options?: SelectOption[]; // For SINGLE_SELECT
  width?: number;
  linkedTableId?: string; // For LINKED_RECORD
  formulaString?: string; // For FORMULA
}

export type CellValue = string | number | boolean | null | undefined | string[] | AttachmentFile[]; // string[] for LINKED_RECORD IDs, AttachmentFile[] for ATTACHMENT

export interface CellData {
  [columnId: string]: CellValue;
}

export interface Row {
  id: string;
  data: CellData;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  order?: number; // For explicit ordering within groups (e.g., Kanban lanes)
  parentId: string | null; // For hierarchical rows (subtasks)
  depth: number;          // Indentation level
  isCollapsed: boolean;   // For parent rows to hide children
}

export enum ViewType {
  GRID = 'GRID',
  KANBAN = 'KANBAN', 
  CALENDAR = 'CALENDAR', // Placeholder
  GALLERY = 'GALLERY', // Placeholder
  TIMELINE = 'TIMELINE', 
}

export enum FilterOperator {
  EQ = 'EQ', // Equals
  NEQ = 'NEQ', // Not Equals
  GT = 'GT', // Greater Than
  LT = 'LT', // Less Than
  GTE = 'GTE', // Greater Than or Equal To
  LTE = 'LTE', // Less Than or Equal To
  CONTAINS = 'CONTAINS',
  NOT_CONTAINS = 'NOT_CONTAINS',
  IS_EMPTY = 'IS_EMPTY',
  IS_NOT_EMPTY = 'IS_NOT_EMPTY',
}

export interface Filter {
  id: string;
  columnId: string;
  operator: FilterOperator;
  value?: any; 
  conjunction: 'AND' | 'OR'; 
}

export interface Sort {
  id: string;
  columnId: string;
  direction: 'ASC' | 'DESC';
}

export interface GroupBy {
  id: string;
  columnId: string;
}

export interface KanbanViewOptions {
  groupByColumnId: string | null;
}
export interface CalendarViewOptions {
  dateColumnId: string | null;
  endDateColumnId?: string | null; 
}
export interface GalleryViewOptions {
  coverImageColumnId?: string | null;
}

export interface TimelineViewOptions {
  startDateColumnId: string | null;
  endDateColumnId?: string | null; 
  labelColumnId?: string | null; 
}


export type ViewSpecificOptions = KanbanViewOptions | CalendarViewOptions | GalleryViewOptions | TimelineViewOptions | {};


export interface View {
  id: string;
  name: string;
  type: ViewType;
  filters: Filter[];
  sorts: Sort[];
  groupBy: GroupBy[]; 
  columnOrder?: string[]; 
  columnVisibility?: Record<string, boolean>; 
  columnWidths?: Record<string, number>; 
  viewSpecificOptions?: ViewSpecificOptions; 
}


export interface Table {
  id: string;
  name: string;
  columns: Column[];
  rows: Row[];
  columnOrder: string[]; 
  views: View[];
  activeViewId: string | null;
}

export interface AppState {
  tables: Table[];
  activeTableId: string | null;
}
