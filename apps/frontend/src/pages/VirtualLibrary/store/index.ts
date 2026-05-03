import { create } from 'zustand';
import type {
  PlayerState,
  AppView,
  Book,
  Annotation,
  PersonalBook,
  Notebook,
  TimelineEvent,
  SearchResult,
} from '../types';

interface LibraryStore {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;

  player: PlayerState;
  updatePlayer: (update: Partial<PlayerState>) => void;

  books: Book[];
  addBooks: (books: Book[]) => void;

  personalBooks: PersonalBook[];
  addPersonalBook: (book: PersonalBook) => void;
  updatePersonalBook: (id: string, update: Partial<PersonalBook>) => void;
  removePersonalBook: (id: string) => void;

  selectedBookId: string | null;
  setSelectedBook: (id: string | null) => void;

  annotations: Annotation[];
  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: (id: string, update: Partial<Annotation>) => void;
  removeAnnotation: (id: string) => void;

  notebooks: Notebook[];
  addNotebook: (notebook: Notebook) => void;
  updateNotebook: (id: string, update: Partial<Notebook>) => void;
  removeNotebook: (id: string) => void;

  timelineEvents: TimelineEvent[];
  addTimelineEvent: (event: TimelineEvent) => void;

  activeClassification: 'ddc' | 'lcc' | 'udc';
  setActiveClassification: (system: 'ddc' | 'lcc' | 'udc') => void;

  currentEnvironmentId: string;
  setCurrentEnvironment: (id: string) => void;

  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: SearchResult[];
  setSearchResults: (results: SearchResult[]) => void;

  thoughtStream: { id: string; text: string; timestamp: number }[];
  addThought: (text: string) => void;
}

export const useLibraryStore = create<LibraryStore>((set) => ({
  currentView: '3d-library',
  setCurrentView: (view) => set({ currentView: view }),

  player: {
    position: { x: 0, y: 1.65, z: 8 },
    rotation: { yaw: 0, pitch: 0 },
    speed: 2.5,
    isSprinting: false,
  },
  updatePlayer: (update) =>
    set((state) => ({ player: { ...state.player, ...update } })),

  books: [],
  addBooks: (books) =>
    set((state) => ({ books: [...state.books, ...books] })),

  personalBooks: [],
  addPersonalBook: (book) =>
    set((state) => ({ personalBooks: [...state.personalBooks, book] })),
  updatePersonalBook: (id, update) =>
    set((state) => ({
      personalBooks: state.personalBooks.map((pb) =>
        pb.id === id ? { ...pb, ...update } : pb,
      ),
    })),
  removePersonalBook: (id) =>
    set((state) => ({
      personalBooks: state.personalBooks.filter((pb) => pb.id !== id),
    })),

  selectedBookId: null,
  setSelectedBook: (id) =>
    set({
      selectedBookId: id,
      currentView: id ? 'book-reader' : '3d-library',
    }),

  annotations: [],
  addAnnotation: (annotation) =>
    set((state) => ({
      annotations: [...state.annotations, annotation],
    })),
  updateAnnotation: (id, update) =>
    set((state) => ({
      annotations: state.annotations.map((a) =>
        a.id === id ? { ...a, ...update, updatedAt: new Date() } : a,
      ),
    })),
  removeAnnotation: (id) =>
    set((state) => ({
      annotations: state.annotations.filter((a) => a.id !== id),
    })),

  notebooks: [],
  addNotebook: (notebook) =>
    set((state) => ({ notebooks: [...state.notebooks, notebook] })),
  updateNotebook: (id, update) =>
    set((state) => ({
      notebooks: state.notebooks.map((n) =>
        n.id === id
          ? { ...n, ...update, updatedAt: new Date() }
          : n,
      ),
    })),
  removeNotebook: (id) =>
    set((state) => ({
      notebooks: state.notebooks.filter((n) => n.id !== id),
    })),

  timelineEvents: [],
  addTimelineEvent: (event) =>
    set((state) => ({
      timelineEvents: [...state.timelineEvents, event],
    })),

  activeClassification: 'ddc',
  setActiveClassification: (system) =>
    set({ activeClassification: system }),

  currentEnvironmentId: 'rundell-public-library',
  setCurrentEnvironment: (id) =>
    set({ currentEnvironmentId: id }),

  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  searchResults: [],
  setSearchResults: (results) => set({ searchResults: results }),

  thoughtStream: [],
  addThought: (text) =>
    set((state) => ({
      thoughtStream: [
        ...state.thoughtStream.slice(-9),
        { id: Math.random().toString(36).substr(2, 9), text, timestamp: Date.now() },
      ],
    })),
}));
