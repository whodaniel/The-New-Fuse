import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from '../../ui/Button';
import { ValidationErrors } from './ValidationErrors';
import { ShareButton } from './ShareButton';
import { DeployButton } from './DeployButton';
import { useWorkflowActions } from '../../../hooks/useWorkflowActions';
export var WorkflowToolbar = function (_a) {
    var onSave = _a.onSave, canUndo = _a.canUndo, canRedo = _a.canRedo, onUndo = _a.onUndo, onRedo = _a.onRedo, lastSaved = _a.lastSaved, validationErrors = _a.validationErrors;
    var _b = useWorkflowActions(), executeWorkflow = _b.executeWorkflow, deployWorkflow = _b.deployWorkflow;
    return (_jsxs("div", { className: "workflow-toolbar flex items-center justify-between p-4 border-b", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Button, { variant: "ghost", onClick: onUndo, disabled: !canUndo, icon: "undo", tooltip: "Undo (Ctrl+Z)" }), _jsx(Button, { variant: "ghost", onClick: onRedo, disabled: !canRedo, icon: "redo", tooltip: "Redo (Ctrl+Y)" }), _jsx("div", { className: "h-6 w-px bg-gray-300 mx-2" }), _jsx(Button, { variant: "primary", onClick: onSave, icon: "save", tooltip: "Last saved: ".concat(lastSaved.toLocaleTimeString()), children: "Save" }), _jsx(Button, { variant: "secondary", onClick: executeWorkflow, icon: "play", tooltip: "Execute workflow", children: "Execute" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(ValidationErrors, { errors: validationErrors }), _jsx(ShareButton, {}), _jsx(DeployButton, { onDeploy: deployWorkflow })] })] }));
};
