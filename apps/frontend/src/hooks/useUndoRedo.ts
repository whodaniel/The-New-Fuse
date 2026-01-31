import { useCallback, useState } from 'react';

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function useUndoRedo<T>(initialState: T) {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const undo = useCallback(() => {
    let prevState: T | undefined;
    setHistory((currentState) => {
      if (currentState.past.length === 0) return currentState;

      const previous = currentState.past[currentState.past.length - 1];
      const newPast = currentState.past.slice(0, currentState.past.length - 1);
      prevState = previous;

      return {
        past: newPast,
        present: previous,
        future: [currentState.present, ...currentState.future],
      };
    });
    return prevState;
  }, []);

  const redo = useCallback(() => {
    let nextState: T | undefined;
    setHistory((currentState) => {
      if (currentState.future.length === 0) return currentState;

      const next = currentState.future[0];
      const newFuture = currentState.future.slice(1);
      nextState = next;

      return {
        past: [...currentState.past, currentState.present],
        present: next,
        future: newFuture,
      };
    });
    return nextState;
  }, []);

  const takeSnapshot = useCallback((newState: T) => {
    setHistory((currentState) => {
      // If the new state is strictly equal to the present, do nothing
      if (currentState.present === newState) return currentState;

      return {
        past: [...currentState.past, currentState.present],
        present: newState,
        future: [],
      };
    });
  }, []);

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    takeSnapshot,
    history,
  };
}
