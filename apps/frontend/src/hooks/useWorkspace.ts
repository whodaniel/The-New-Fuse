import { useState, useEffect } from 'react';
import { WorkspaceApiService } from '../api/workspace';

interface WorkspaceState {
  loading: boolean;
  error: Error | null;
  workspace?: any;
}

export const useWorkspace = (): WorkspaceState => {
  const [state, setState] = useState<WorkspaceState>({
    loading: true,
    error: null,
    workspace: null
  });

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const workspaceService = new WorkspaceApiService();
        const response = await workspaceService.getCurrentWorkspace();

        if (response.success && response.data) {
          setState({
            loading: false,
            error: null,
            workspace: response.data
          });
        } else {
          throw new Error(response.error || 'Failed to load workspace');
        }
      } catch (error) {
        setState({
          loading: false,
          error: error instanceof Error ? error : new Error('Failed to load workspace'),
          workspace: null
        });
      }
    };

    fetchWorkspace();
  }, []);

  return state;
};
