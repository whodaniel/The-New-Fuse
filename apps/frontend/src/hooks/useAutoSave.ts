import { debounce } from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { saveWorkflowToServer } from '../api/workflow';
import type { WorkflowState } from '../types/workflow';

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
