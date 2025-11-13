import { useCallback, useRef, useState } from 'react';
export function useUndoRedo(initialPresent) {
    const [state, setState] = useState({
        past: [],
        present: initialPresent,
        future: []
    });
    const isInBatch = useRef(false);
    const batchUpdates = useRef([]);
    const canUndo = state.past.length > 0;
    const canRedo = state.future.length > 0;
    const set = useCallback((newPresent) => {
        setState(currentState => ({
            past: [...currentState.past, currentState.present],
            present: newPresent,
            future: []
        }));
    }, []);
    const reset = useCallback((newPresent) => {
        setState({
            past: [],
            present: newPresent,
            future: []
        });
    }, []);
    const undo = useCallback(() => {
        setState(currentState => {
            if (currentState.past.length === 0)
                return currentState;
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
            if (currentState.future.length === 0)
                return currentState;
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
    const addToBatch = useCallback((update) => {
        if (isInBatch.current) {
            batchUpdates.current.push(update);
        }
        else {
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
//# sourceMappingURL=useUndoRedo.js.map