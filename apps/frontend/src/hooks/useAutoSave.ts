// @ts-nocheck
import { debounce } from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { saveWorkflowToServer } from '../api/workflow';
import type { WorkflowState } from '../types/workflow';

export const useAutoSave = (): any => {
  const [lastSaved, setLastSaved] = useState(new Date());
  const workflow = useSelector((state: WorkflowState) => state.workflow);

  const workflowRef = useRef(workflow);
  useEffect(() => {
    workflowRef.current = workflow;
  }, [workflow]);

  const saveWorkflow = useCallback(async () => {
    try {
      await saveWorkflowToServer(workflowRef.current);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save workflow:', error);
    }
  }, []);

  const debouncedSave = useMemo(() => debounce(saveWorkflow, 2000), [saveWorkflow]);

  useEffect(() => {
    debouncedSave();
    return () => {
      // Don't cancel immediately on workflow change, let it debounce.
      // Cancel is handled strictly on unmount.
    };
  }, [workflow, debouncedSave]);

  useEffect(() => {
    return () => debouncedSave.cancel();
  }, [debouncedSave]);

  return {
    saveWorkflow,
    lastSaved,
  };
};
