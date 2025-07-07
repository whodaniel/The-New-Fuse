import { useState, useCallback } from "react";
export function useUndoRedo(initialState) {
    const [history, setHistory] = useState([initialState]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const canUndo = currentIndex > 0;
    const canRedo = currentIndex < history.length - 1;
    const undo = useCallback(() => {
        if (canUndo) {
            setCurrentIndex(currentIndex - 1);
        }
    }, [canUndo, currentIndex]);
    const redo = useCallback(() => {
        if (canRedo) {
            setCurrentIndex(currentIndex + 1);
        }
    }, [canRedo, currentIndex]);
    const setState = useCallback((newState) => {
        const newHistory = history.slice(0, currentIndex + 1);
        newHistory.push(newState);
        setHistory(newHistory);
        setCurrentIndex(newHistory.length - 1);
    }, [history, currentIndex]);
    return {
        state: history[currentIndex],
        canUndo,
        canRedo,
        undo,
        redo,
        setState,
    };
}
