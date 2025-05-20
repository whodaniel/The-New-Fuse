import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { debounce } from 'lodash';
import { saveWorkflowToServer } from '../api/workflow.js';
import type { WorkflowState } from '../types/workflow.js';

export const useAutoSave = (): any => {
  const [lastSaved, setLastSaved] = useState(new Date());
  const workflow = useSelector((state: WorkflowState) => state.workflow);

  const saveWorkflow = useCallback(async () => {
    try {
      await saveWorkflowToServer(workflow);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save workflow:', error);
    }
  }, [workflow]);

  const debouncedSave = debounce(saveWorkflow, 2000);

  useEffect(() => {
    debouncedSave();
    return () => debouncedSave.cancel();
  }, [workflow, debouncedSave]);

  return {
    saveWorkflow,
    lastSaved,
  };
};