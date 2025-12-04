import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSelector } from 'react-redux';
import { ExecutionStatus } from './ExecutionStatus';
import { ExecutionPath } from './ExecutionPath';
import { useWorkflowExecution } from '../../../hooks/useWorkflowExecution';
export var ExecutionOverlay = function () {
    var _a = useSelector(function (state) { return state.execution; }), isExecuting = _a.isExecuting, currentNode = _a.currentNode, executionPath = _a.executionPath;
    var _b = useWorkflowExecution(), pauseExecution = _b.pauseExecution, resumeExecution = _b.resumeExecution, stopExecution = _b.stopExecution;
    if (!isExecuting)
        return null;
    return (_jsxs("div", { className: "absolute inset-0 pointer-events-none", children: [_jsx(ExecutionPath, { path: executionPath }), _jsx(ExecutionStatus, { currentNode: currentNode, onPause: pauseExecution, onResume: resumeExecution, onStop: stopExecution })] }));
};
