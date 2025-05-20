import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { WorkflowState } from '../types/workflow.js';

export const useWorkflowHistory = (): any => {
  const dispatch = useDispatch();
  const { past, future } = useSelector((state: WorkflowState) => state.history);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO_WORKFLOW' });
  }, [dispatch]);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO_WORKFLOW' });
  }, [dispatch]);

  return {
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
};