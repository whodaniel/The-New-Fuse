export interface ClassificationSystem {
  id: string;
  name: string;
  fullName: string;
  origin: string;
  description: string;
}

export interface ClassificationNode {
  code: string;
  label: string;
  description?: string;
  parentId?: string;
  childrenIds?: string[];
  system: string;
  crosswalks: Record<string, string[]>;
  color: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  oclcNumber?: string;
  ddc?: string;
  lcc?: string;
  publishYear?: number;
  publisher?: string;
  pageCount?: number;
  coverUrl?: string;
  openLibraryId?: string;
  wikidataId?: string;
  description?: string;
  subjects?: string[];
}

export interface ShelfPosition {
  shelfId: string;
  row: number;
  slot: number;
}

export interface WorldPosition {
  x: number;
  y: number;
  z: number;
}

export type AnnotationType =
  | 'highlight'
  | 'margin-note'
  | 'sticky-note'
  | 'bookmark'
  | 'underline';

export interface Annotation {
  id: string;
  bookId: string;
  type: AnnotationType;
  pageNumber?: number;
  position?: { x: number; y: number };
  text?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonalBook {
  id: string;
  book: Book;
  shelfPosition?: ShelfPosition;
  acquisitionDate?: Date;
  readingStatus: 'unread' | 'reading' | 'finished';
  readingProgress?: number;
  loanStatus?: { lentTo: string; dueDate: Date };
  condition?: 'mint' | 'good' | 'fair' | 'worn';
  isSigned?: boolean;
  personalNotes?: string;
  annotations: Annotation[];
}

export type NotebookType =
  | 'binder'
  | 'composition'
  | 'legal-pad'
  | 'index-card-box'
  | 'sticky-note-pad';

export interface Notebook {
  id: string;
  type: NotebookType;
  title: string;
  color: string;
  dividers?: NotebookDivider[];
  pages?: NotebookPage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NotebookDivider {
  id: string;
  label: string;
  color: string;
  pageRange: [number, number];
}

export interface NotebookPage {
  id: string;
  pageNumber: number;
  content: string;
  annotations?: Annotation[];
}

export type SearchMode =
  | 'classification'
  | 'keyword'
  | 'semantic'
  | 'temporal'
  | 'spatial';

export interface SearchResult {
  book: Book;
  relevance: number;
  matchReason: string;
  shelfLocation?: WorldPosition;
}

export type TimelineType =
  | 'publication'
  | 'acquisition'
  | 'reading'
  | 'annotation'
  | 'historical';

export interface TimelineEvent {
  id: string;
  type: TimelineType;
  date: Date;
  title: string;
  description?: string;
  bookId?: string;
  relatedEventIds?: string[];
}

export interface LibraryEnvironment {
  id: string;
  name: string;
  description: string;
  location: string;
  era: string;
  architecturalStyle: string;
  floors: LibraryFloor[];
  primaryClassification: string;
}

export interface LibraryFloor {
  id: string;
  name: string;
  rooms: LibraryRoom[];
}

export interface LibraryRoom {
  id: string;
  name: string;
  width: number;
  depth: number;
  height: number;
  shelves: ShelfDefinition[];
  furniture: FurnitureDefinition[];
}

export interface ShelfDefinition {
  id: string;
  position: WorldPosition;
  rotation: number;
  classificationRange: string;
  rows: number;
}

export interface FurnitureDefinition {
  type: 'table' | 'chair' | 'lamp' | 'display-case' | 'reading-stand';
  position: WorldPosition;
  rotation: number;
}

export interface PlayerState {
  position: WorldPosition;
  rotation: { yaw: number; pitch: number };
  speed: number;
  isSprinting: boolean;
  nearestShelfId?: string;
  heldBookId?: string;
  focusedBookId?: string;
}

export type AppView =
  | '3d-library'
  | 'book-reader'
  | 'notebook-editor'
  | 'timeline'
  | 'search'
  | 'personal-library'
  | 'settings';
