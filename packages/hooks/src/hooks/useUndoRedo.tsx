import { useCallback, useRef, useState } from 'react';

interface UseUndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
}

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

export function useUndoRedo<T>(initialPresent: T): UseUndoRedoResult<T> {
  const [state, setState] = useState<UseUndoRedoState<T>>({
    past: [],
    present: initialPresent,
    future: []
  });

  const isInBatch = useRef(false);
  const batchUpdates = useRef<T[]>([]);

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  const set = useCallback((newPresent: T) => {
    setState(currentState => ({
      past: [...currentState.past, currentState.present],
      present: newPresent,
      future: []
    }));
  }, []);

  const reset = useCallback((newPresent: T) => {
    setState({
      past: [],
      present: newPresent,
      future: []
    });
  }, []);

  const undo = useCallback(() => {
    setState(currentState => {
      if (currentState.past.length === 0) return currentState;

      const previous = currentState.past[currentState.past.length - 1];
      const newPast = currentState.past.slice(0, -1);

      return {
        past: newPast,
        present: previous,
        future: [currentState.present, ...currentState.future]
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState(currentState => {
      if (currentState.future.length === 0) return currentState;

      const next = currentState.future[0];
      const newFuture = currentState.future.slice(1);

      return {
        past: [...currentState.past, currentState.present],
        present: next,
        future: newFuture
      };
    });
  }, []);

  const startBatch = useCallback(() => {
    isInBatch.current = true;
    batchUpdates.current = [];
  }, []);

  const addToBatch = useCallback((update: T) => {
    if (isInBatch.current) {
      batchUpdates.current.push(update);
    } else {
      set(update);
    }
  }, [set]);

  const commitBatch = useCallback(() => {
    if (isInBatch.current && batchUpdates.current.length > 0) {
      const lastUpdate = batchUpdates.current[batchUpdates.current.length - 1];
      set(lastUpdate);
      batchUpdates.current = [];
    }
    isInBatch.current = false;
  }, [set]);

  return {
    state: state.present,
    set,
    reset,
    undo,
    redo,
    canUndo,
    canRedo,
    startBatch,
    addToBatch,
    commitBatch
  };
}