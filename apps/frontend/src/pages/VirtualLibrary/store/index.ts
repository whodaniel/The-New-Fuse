import { create } from 'zustand';
import type {
  Annotation,
  AppView,
  Book,
  Notebook,
  PersonalBook,
  PlayerState,
  SearchResult,
  TimelineEvent,
} from '../types';

interface LibraryStore {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;

  player: PlayerState;
  updatePlayer: (update: Partial<PlayerState>) => void;

  // Flat compatibility mirrors: several library components were written
  // against a flat store shape (playerPosition, isPointerLocked, ...).
  // These fields mirror the canonical nested state above and are kept in
  // sync by the setters below; the nested `player` object stays canonical.
  playerPosition: PlayerState['position'];
  playerRotation: PlayerState['rotation'];
  setPlayerPosition: (position: PlayerState['position']) => void;
  isPointerLocked: boolean;
  setPointerLocked: (locked: boolean) => void;
  setSprinting: (sprinting: boolean) => void;
  nearestShelfCode: string | null;
  nearestShelfLabel: string | null;
  setNearestShelf: (code: string | null, label: string | null) => void;
  navigationTarget: PlayerState['position'] | null;
  setNavigationTarget: (target: PlayerState['position'] | null) => void;
  isNavigating: boolean;
  setIsNavigating: (navigating: boolean) => void;

  books: Book[];
  addBooks: (books: Book[]) => void;

  personalBooks: PersonalBook[];
  addPersonalBook: (book: PersonalBook) => void;
  updatePersonalBook: (id: string, update: Partial<PersonalBook>) => void;
  removePersonalBook: (id: string) => void;

  selectedBookId: string | null;
  setSelectedBook: (id: string | null) => void;
  selectedBook: Book | null;
  selectBook: (id: string | null) => void;

  annotations: Annotation[];
  addAnnotation: {
    (annotation: Annotation): void;
    (bookId: string, type: Annotation['type']): void;
  };
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

  relayStatus: 'connecting' | 'connected' | 'error' | 'disconnected';
  setRelayStatus: (status: 'connecting' | 'connected' | 'error' | 'disconnected') => void;
}

export const useLibraryStore = create<LibraryStore>((set, get) => ({
  currentView: '3d-library',
  setCurrentView: (view) => set({ currentView: view }),

  player: {
    position: { x: 0, y: 1.65, z: 8 },
    rotation: { yaw: 0, pitch: 0 },
    speed: 2.5,
    isSprinting: false,
  },
  updatePlayer: (update) =>
    set((state) => {
      const player = { ...state.player, ...update };
      return {
        player,
        playerPosition: player.position,
        playerRotation: player.rotation,
      };
    }),

  playerPosition: { x: 0, y: 1.65, z: 8 },
  playerRotation: { yaw: 0, pitch: 0 },
  setPlayerPosition: (position) =>
    set((state) => ({
      player: { ...state.player, position },
      playerPosition: position,
    })),
  isPointerLocked: false,
  setPointerLocked: (locked) => set({ isPointerLocked: locked }),
  setSprinting: (sprinting) =>
    set((state) => ({ player: { ...state.player, isSprinting: sprinting } })),
  nearestShelfCode: null,
  nearestShelfLabel: null,
  setNearestShelf: (code, label) =>
    set((state) => ({
      nearestShelfCode: code,
      nearestShelfLabel: label,
      player: { ...state.player, nearestShelfId: code ?? undefined },
    })),
  navigationTarget: null,
  setNavigationTarget: (target) => set({ navigationTarget: target, isNavigating: target !== null }),
  isNavigating: false,
  setIsNavigating: (navigating) => set({ isNavigating: navigating }),

  books: [],
  addBooks: (books) =>
    set((state) => {
      const allBooks = [...state.books, ...books];
      return {
        books: allBooks,
        selectedBook: state.selectedBookId
          ? (allBooks.find((b) => b.id === state.selectedBookId) ?? state.selectedBook)
          : state.selectedBook,
      };
    }),

  personalBooks: [],
  addPersonalBook: (book) => set((state) => ({ personalBooks: [...state.personalBooks, book] })),
  updatePersonalBook: (id, update) =>
    set((state) => ({
      personalBooks: state.personalBooks.map((pb) => (pb.id === id ? { ...pb, ...update } : pb)),
    })),
  removePersonalBook: (id) =>
    set((state) => ({
      personalBooks: state.personalBooks.filter((pb) => pb.id !== id),
    })),

  selectedBookId: null,
  setSelectedBook: (id) =>
    set((state) => ({
      selectedBookId: id,
      selectedBook: id ? (state.books.find((b) => b.id === id) ?? null) : null,
      currentView: id ? 'book-reader' : '3d-library',
    })),
  selectedBook: null,
  selectBook: (id) => get().setSelectedBook(id),

  annotations: [],
  addAnnotation: (annotationOrBookId: Annotation | string, maybeType?: Annotation['type']) =>
    set((state) => {
      const annotation: Annotation =
        typeof annotationOrBookId === 'string'
          ? {
              id: Math.random().toString(36).substr(2, 9),
              bookId: annotationOrBookId,
              type: maybeType ?? 'sticky-note',
              createdAt: new Date(),
              updatedAt: new Date(),
            }
          : annotationOrBookId;
      return { annotations: [...state.annotations, annotation] };
    }),
  updateAnnotation: (id, update) =>
    set((state) => ({
      annotations: state.annotations.map((a) =>
        a.id === id ? { ...a, ...update, updatedAt: new Date() } : a
      ),
    })),
  removeAnnotation: (id) =>
    set((state) => ({
      annotations: state.annotations.filter((a) => a.id !== id),
    })),

  notebooks: [],
  addNotebook: (notebook) => set((state) => ({ notebooks: [...state.notebooks, notebook] })),
  updateNotebook: (id, update) =>
    set((state) => ({
      notebooks: state.notebooks.map((n) =>
        n.id === id ? { ...n, ...update, updatedAt: new Date() } : n
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
  setActiveClassification: (system) => set({ activeClassification: system }),

  currentEnvironmentId: 'rundell-public-library',
  setCurrentEnvironment: (id) => set({ currentEnvironmentId: id }),

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

  relayStatus: 'disconnected',
  setRelayStatus: (status) => set({ relayStatus: status }),
}));
