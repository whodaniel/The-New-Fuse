import { useCallback, useEffect, useMemo, useState } from 'react';
import { Workspace, WorkspaceApiService } from '../api/workspace';

interface WorkspaceState {
  loading: boolean;
  error: Error | null;
  workspace: Workspace | null;
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
}

interface UseWorkspaceResult extends WorkspaceState {
  selectWorkspace: (workspaceId: string) => Promise<void>;
  createWorkspace: () => Promise<Workspace | null>;
  refreshWorkspaces: () => Promise<void>;
}

export const useWorkspace = (): UseWorkspaceResult => {
  const workspaceService = useMemo(() => new WorkspaceApiService(), []);
  const [state, setState] = useState<WorkspaceState>({
    loading: true,
    error: null,
    workspace: null,
    currentWorkspace: null,
    workspaces: [],
  });

  const refreshWorkspaces = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const [workspacesResponse, currentResponse] = await Promise.all([
        workspaceService.getWorkspaces(),
        workspaceService.getCurrentWorkspace(),
      ]);

      if (!workspacesResponse.success) {
        throw new Error(workspacesResponse.error || 'Failed to load workspaces');
      }

      const nextWorkspaces = workspacesResponse.data?.workspaces || [];
      const nextCurrent =
        (currentResponse.success ? currentResponse.data : null) || nextWorkspaces[0] || null;

      setState({
        loading: false,
        error: null,
        workspace: nextCurrent,
        currentWorkspace: nextCurrent,
        workspaces: nextWorkspaces,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Failed to load workspace'),
      }));
    }
  }, [workspaceService]);

  useEffect(() => {
    refreshWorkspaces();
  }, [refreshWorkspaces]);

  const selectWorkspace = useCallback(
    async (workspaceId: string) => {
      if (!workspaceId) return;

      const existing = state.workspaces.find((workspace) => workspace.id === workspaceId);
      if (existing) {
        setState((prev) => ({
          ...prev,
          currentWorkspace: existing,
          workspace: existing,
        }));
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const response = await workspaceService.getWorkspace(workspaceId);
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to select workspace');
        }

        setState((prev) => {
          const hasWorkspace = prev.workspaces.some(
            (workspace) => workspace.id === response.data!.id
          );
          const nextWorkspaces = hasWorkspace
            ? prev.workspaces
            : [...prev.workspaces, response.data as Workspace];

          return {
            ...prev,
            loading: false,
            error: null,
            currentWorkspace: response.data as Workspace,
            workspace: response.data as Workspace,
            workspaces: nextWorkspaces,
          };
        });
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error : new Error('Failed to select workspace'),
        }));
      }
    },
    [state.workspaces, workspaceService]
  );

  const createWorkspace = useCallback(async (): Promise<Workspace | null> => {
    const defaultName = `Workspace ${state.workspaces.length + 1}`;
    const promptedName =
      typeof window !== 'undefined' ? window.prompt('Workspace name', defaultName) : defaultName;
    const name = (promptedName || '').trim();

    if (!name) {
      return null;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await workspaceService.createWorkspace({ name });
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create workspace');
      }

      const created = response.data;
      setState((prev) => ({
        ...prev,
        loading: false,
        error: null,
        workspace: created,
        currentWorkspace: created,
        workspaces: [...prev.workspaces, created],
      }));

      return created;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Failed to create workspace'),
      }));
      return null;
    }
  }, [state.workspaces.length, workspaceService]);

  return {
    ...state,
    selectWorkspace,
    createWorkspace,
    refreshWorkspaces,
  };
};
