import { useState, useEffect, useCallback } from 'react';
import { VersionManager } from '../version/VersionManager.js';
export function useVersionControl(initialState, currentUser) {
    const [manager] = useState(() => new VersionManager(initialState));
    const [currentVersion, setCurrentVersion] = useState(null);
    const [currentBranch, setCurrentBranch] = useState(null);
    const [history, setHistory] = useState([]);
    // Load initial state
    useEffect(() => {
        const branch = manager.switchBranch(initialState.currentBranch);
        const version = manager.checkout(branch.head);
        updateState(version);
    }, [manager]);
    // Update local state
    const updateState = useCallback((dashboardState) => {
        const state = manager['state']; // Access private state
        setCurrentVersion(state.versions[state.currentVersion]);
        setCurrentBranch(state.branches[state.currentBranch]);
        setHistory(manager.getHistory());
    }, [manager]);
    // Version Control Operations
    const createVersion = useCallback((dashboardState, message, tags) => {
        const versionId = manager.createVersion(dashboardState, {
            createdAt: new Date(),
            author: {
                id: currentUser.id,
                name: currentUser.name,
            },
            message,
            tags,
        });
        updateState(dashboardState);
        return versionId;
    }, [manager, currentUser, updateState]);
    const checkout = useCallback((versionId) => {
        const state = manager.checkout(versionId);
        updateState(state);
        return state;
    }, [manager, updateState]);
    // Branch Operations
    const createBranch = useCallback((name, description) => {
        const branchId = manager.createBranch({
            name,
            description,
            head: currentVersion?.(metadata).id || '',
            author: {
                id: currentUser.id,
                name: currentUser.name,
            },
        });
        updateState(currentVersion?.state);
        return branchId;
    }, [manager, currentVersion, currentUser, updateState]);
    const switchBranch = useCallback((branchId) => {
        const state = manager.switchBranch(branchId);
        updateState(state);
        return state;
    }, [manager, updateState]);
    const mergeBranch = useCallback((sourceBranchId, targetBranchId) => {
        const state = manager.mergeBranch(sourceBranchId, targetBranchId);
        updateState(state);
        return state;
    }, [manager, updateState]);
    // Staging Area Operations
    const stageChanges = useCallback((changes) => {
        manager.stageChanges(changes);
        updateState(currentVersion?.state);
    }, [manager, currentVersion, updateState]);
    const setCommitMessage = useCallback((message) => {
        manager.setCommitMessage(message);
    }, [manager]);
    const commit = useCallback((), unknown), string;
    {
        const versionId = manager.commit({
            id: currentUser.id,
            name: currentUser.name,
        });
        updateState(currentVersion?.state);
        return versionId;
    }
    [manager, currentUser, currentVersion, updateState];
    ;
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
//# sourceMappingURL=useVersionControl.js.map