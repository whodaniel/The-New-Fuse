import { useState, useEffect } from 'react';

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
    // Simulate loading and then success
    const timer = setTimeout(() => {
      setState({
        loading: false,
        error: null,
        workspace: {
          name: 'Default Workspace',
          id: '1',
          members: 3
        }
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return state;
};