interface UseUndoRedoResult<T> {
    state: T;
    set: (newPresent: T) => void;
    reset: (newPresent: T) => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    startBatch: () => void;
    addToBatch: (update: T) => void;
    commitBatch: () => void;
}
export declare function useUndoRedo<T>(initialPresent: T): UseUndoRedoResult<T>;
export {};
//# sourceMappingURL=useUndoRedo.d.ts.map