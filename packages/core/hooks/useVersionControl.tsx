import { useState, useEffect, useCallback } from 'react';
import { VersionManager } from '../version/VersionManager.js';
import {
  Version,
  VersionDiff,
  Branch,
  VersionControlState,
} from '../version/types.js';
import { DashboardState } from '../collaboration/types.js';
import { User } from '../collaboration/types.js';

export function useVersionControl(
  initialState: VersionControlState,
  currentUser: User
): unknown {
  const [manager] = useState(() => new VersionManager(initialState));
  const [currentVersion, setCurrentVersion] = useState<Version | null>(null);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [history, setHistory] = useState<Version[]>([]);

  // Load initial state
  useEffect(() => {
    const branch = (manager as any).switchBranch((initialState as any).currentBranch);
    const version = (manager as any).checkout((branch as any).head);
    updateState(version);
  }, [manager]);

  // Update local state
  const updateState = useCallback(
    (dashboardState: DashboardState) => {
      const state = manager['state']; // Access private state
      setCurrentVersion((state as any).versions[(state as any).currentVersion]);
      setCurrentBranch((state as any).branches[(state as any).currentBranch]);
      setHistory((manager as any).getHistory());
    },
    [manager]
  );

  // Version Control Operations
  const createVersion = useCallback(
    (
      dashboardState: DashboardState,
      message: string,
      tags?: string[]
    ): string => {
      const versionId = (manager as any).createVersion(dashboardState, {
        createdAt: new Date(),
        author: {
          id: (currentUser as any).id,
          name: (currentUser as any).name,
        },
        message,
        tags,
      });
      updateState(dashboardState);
      return versionId;
    },
    [manager, currentUser, updateState]
  );

  const checkout = useCallback(
    (versionId: string): DashboardState => {
      const state = (manager as any).checkout(versionId);
      updateState(state);
      return state;
    },
    [manager, updateState]
  );

  // Branch Operations
  const createBranch = useCallback(
    (name: string, description?: string): string => {
      const branchId = (manager as any).createBranch({
        name,
        description,
        head: currentVersion?.(metadata as any).id || '',
        author: {
          id: (currentUser as any).id,
          name: (currentUser as any).name,
        },
      });
      updateState(currentVersion?.state!);
      return branchId;
    },
    [manager, currentVersion, currentUser, updateState]
  );

  const switchBranch = useCallback(
    (branchId: string): DashboardState => {
      const state = (manager as any).switchBranch(branchId);
      updateState(state);
      return state;
    },
    [manager, updateState]
  );

  const mergeBranch = useCallback(
    (sourceBranchId: string, targetBranchId: string): DashboardState => {
      const state = (manager as any).mergeBranch(sourceBranchId, targetBranchId);
      updateState(state);
      return state;
    },
    [manager, updateState]
  );

  // Staging Area Operations
  const stageChanges = useCallback(
    (changes: VersionDiff[]): void => {
      (manager as any).stageChanges(changes);
      updateState(currentVersion?.state!);
    },
    [manager, currentVersion, updateState]
  );

  const setCommitMessage = useCallback(
    (message: string): void => {
      (manager as any).setCommitMessage(message);
    },
    [manager]
  );

  const commit = useCallback((: unknown): string => {
    const versionId = (manager as any).commit({
      id: (currentUser as any).id,
      name: (currentUser as any).name,
    });
    updateState(currentVersion?.state!);
    return versionId;
  }, [manager, currentUser, currentVersion, updateState]);

  return {
    currentVersion,
    currentBranch,
    history,
    createVersion,
    checkout,
    createBranch,
    switchBranch,
    mergeBranch,
    stageChanges,
    setCommitMessage,
    commit,
  };
}
