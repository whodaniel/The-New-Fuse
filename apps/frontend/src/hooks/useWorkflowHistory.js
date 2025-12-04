import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
export var useWorkflowHistory = function () {
    var dispatch = useDispatch();
    var _a = useSelector(function (state) { return state.history; }), past = _a.past, future = _a.future;
    var undo = useCallback(function () {
        dispatch({ type: 'UNDO_WORKFLOW' });
    }, [dispatch]);
    var redo = useCallback(function () {
        dispatch({ type: 'REDO_WORKFLOW' });
    }, [dispatch]);
    return {
        undo: undo,
        redo: redo,
        canUndo: past.length > 0,
        canRedo: future.length > 0,
    };
};
