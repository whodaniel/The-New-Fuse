"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTimeline = void 0;
const react_1 = require("react");
const useTimeline = ({ timelineService, initialBranchId }) => {
    const [events, setEvents] = (0, react_1.useState)([]);
    const [branches, setBranches] = (0, react_1.useState)([]);
    const [workflows, setWorkflows] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [currentBranchId, setCurrentBranchId] = (0, react_1.useState)(initialBranchId);
    const loadTimelineData = (0, react_1.useCallback)(async (branchId) => {
        try {
            setLoading(true);
            setError(null);
            const [timelineEvents, branchHierarchy] = await Promise.all([
                timelineService.getEventTimeline(branchId),
                timelineService.getBranchHierarchy(branchId)
            ]);
            const workflowPromises = timelineEvents.map(event => timelineService.getWorkflowsByEvent(event.id));
            const allWorkflows = (await Promise.all(workflowPromises)).flat();
            setEvents(timelineEvents);
            setBranches(branchHierarchy);
            setWorkflows(allWorkflows);
            setCurrentBranchId(branchId);
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to load timeline data'));
            throw err;
        }
        finally {
            setLoading(false);
        }
    }, [timelineService]);
    const createBranch = (0, react_1.useCallback)(async (name, startEventId, parentBranchId) => {
        try {
            const newBranch = await timelineService.createBranch({
                name,
                startEventId,
                parentBranchId
            });
            await loadTimelineData(newBranch.id);
            return newBranch;
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to create branch'));
            throw err;
        }
    }, [timelineService, loadTimelineData]);
    const mergeBranch = (0, react_1.useCallback)(async (branchId, targetEventId, mergedFromEvents) => {
        try {
            await timelineService.mergeBranch({
                branchId,
                targetEventId,
                mergedFromEvents
            });
            await loadTimelineData(currentBranchId || branchId);
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to merge branch'));
            throw err;
        }
    }, [timelineService, loadTimelineData, currentBranchId]);
    const createWorkflow = (0, react_1.useCallback)(async (name, description, eventId, steps) => {
        try {
            const newWorkflow = await timelineService.createWorkflow({
                name,
                description,
                eventId,
                steps
            });
            setWorkflows(prev => [...prev, newWorkflow]);
            return newWorkflow;
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to create workflow'));
            throw err;
        }
    }, [timelineService]);
    const executeWorkflowStep = (0, react_1.useCallback)(async (workflowId, stepId, result) => {
        try {
            await timelineService.executeWorkflowStep(workflowId, stepId, result);
            setWorkflows(prev => prev.map(w => {
                if (w.id !== workflowId)
                    return w;
                return {
                    ...w,
                    steps: w.steps.map(s => s.id === stepId
                        ? { ...s, status: 'COMPLETED', result }
                        : s)
                };
            }));
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to execute workflow step'));
            throw err;
        }
    }, [timelineService]);
    const switchBranch = (0, react_1.useCallback)((branchId) => {
        loadTimelineData(branchId).catch(err => {
            setError(err instanceof Error ? err : new Error('Failed to switch branch'));
        });
    }, [loadTimelineData]);
    (0, react_1.useEffect)(() => {
        if (initialBranchId) {
            loadTimelineData(initialBranchId).catch(err => {
                setError(err instanceof Error ? err : new Error('Failed to load initial timeline data'));
            });
        }
    }, [initialBranchId, loadTimelineData]);
    return {
        events,
        branches,
        workflows,
        loading,
        error,
        currentBranchId,
        createBranch,
        mergeBranch,
        createWorkflow,
        executeWorkflowStep,
        switchBranch,
        refresh: () => currentBranchId ? loadTimelineData(currentBranchId) : Promise.resolve()
    };
};
exports.useTimeline = useTimeline;
//# sourceMappingURL=useTimeline.js.map