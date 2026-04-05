import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { WorkflowStepType, } from '@the-new-fuse/api-types/src/workflow';
import { Edit, PlusCircle, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../Card/Card';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, } from '../../Dialog/Dialog';
import { Input } from '../../Input/Input';
import { Textarea } from '../../Textarea/Textarea';
import { WorkflowVisualizer } from './WorkflowVisualizer';
const WorkflowEditor = ({ initialDefinition, onSave }) => {
    const [workflow, setWorkflow] = useState(initialDefinition);
    const [editedStep, setEditedStep] = useState(null);
    const [selectedStep, setSelectedStep] = useState(null);
    const [isNewStep, setIsNewStep] = useState(false);
    const [paramsError, setParamsError] = useState(null);
    // Simple workflow state management without external builder
    useEffect(() => {
        setWorkflow(initialDefinition);
    }, [initialDefinition]);
    const handleAddStep = () => {
        // Create a new step with default values
        const newStep = {
            id: `step-${Date.now().toString()}`,
            name: 'New Step',
            type: WorkflowStepType.ACTION,
            action: 'custom.action',
            parameters: {},
            config: {},
            connections: [],
        };
        setEditedStep(newStep);
        setIsNewStep(true);
    };
    const handleEditStep = (step) => {
        setEditedStep({ ...step });
        setIsNewStep(false);
    };
    const handleStepChange = (field, value) => {
        setEditedStep((prev) => {
            if (!prev)
                return null;
            return { ...prev, [field]: value };
        });
    };
    const handleParamsChange = (paramsJson) => {
        try {
            const parsedParams = JSON.parse(paramsJson);
            setEditedStep((prev) => {
                if (!prev)
                    return null;
                return { ...prev, parameters: parsedParams };
            });
            setParamsError(null);
        }
        catch (_error) {
            setParamsError('Invalid JSON format for parameters.');
        }
    };
    const handleSaveStep = () => {
        if (!editedStep)
            return;
        const updatedSteps = { ...workflow.steps };
        updatedSteps[editedStep.id] = editedStep;
        const updatedWorkflow = {
            ...workflow,
            steps: updatedSteps,
        };
        setWorkflow(updatedWorkflow);
        setEditedStep(null);
    };
    const handleDeleteStep = () => {
        if (!selectedStep)
            return;
        const updatedSteps = { ...workflow.steps };
        delete updatedSteps[selectedStep.id];
        const updatedWorkflow = {
            ...workflow,
            steps: updatedSteps,
        };
        setWorkflow(updatedWorkflow);
        setSelectedStep(null);
    };
    const handleSaveWorkflow = () => {
        onSave(workflow);
    };
    // Helper component for action buttons that appear when a step is selected
    const _ActionButtons = ({ step }) => {
        const onEdit = () => handleEditStep(step);
        const onDelete = () => {
            setSelectedStep(step);
            // Show a confirmation dialog or delete immediately
            handleDeleteStep();
        };
        return (_jsxs("div", { className: "flex space-x-2 mt-2", children: [_jsxs(Button, { onClick: onEdit, variant: "outline", size: "sm", children: [_jsx(Edit, { className: "h-4 w-4 mr-1" }), "Edit"] }), _jsxs(Button, { onClick: onDelete, variant: "outline", size: "sm", className: "text-destructive", children: [_jsx(Trash2, { className: "h-4 w-4 mr-1" }), "Delete"] })] }));
    };
    return (_jsx("div", { className: "space-y-4", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex justify-between items-center", children: [_jsxs("span", { children: ["Workflow Editor: ", workflow.name] }), _jsxs("div", { className: "flex space-x-2", children: [_jsxs(Button, { onClick: handleAddStep, variant: "outline", size: "sm", children: [_jsx(PlusCircle, { className: "h-4 w-4 mr-1" }), "Add Step"] }), _jsx(Button, { onClick: handleSaveWorkflow, variant: "outline", size: "sm", children: "Save Workflow" })] })] }) }), _jsxs(CardContent, { children: [_jsx(WorkflowVisualizer, { definition: workflow }), _jsxs(Dialog, { children: [_jsx(DialogTrigger, { asChild: true, children: _jsx("span", { className: "hidden", children: "Open Step Editor" }) }), editedStep && (_jsxs(DialogContent, { className: "sm:max-w-[600px]", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: isNewStep ? 'Add New Step' : 'Edit Step' }) }), _jsxs("div", { className: "grid gap-4 py-4", children: [_jsx(Input, { id: "step-name", value: editedStep.name, onChange: (e) => handleStepChange('name', e.target.value), placeholder: "Step Name" }), _jsx(Input, { id: "step-id", value: editedStep.id, onChange: (e) => handleStepChange('id', e.target.value), placeholder: "Step ID (unique)", disabled: !isNewStep }), _jsx(Input, { id: "step-type", value: editedStep.type, onChange: (e) => handleStepChange('type', e.target.value), placeholder: "Step Type (e.g., action, condition)" }), _jsx(Input, { id: "step-action", value: editedStep.action, onChange: (e) => handleStepChange('action', e.target.value), placeholder: "Action Name (e.g., http.request, data.transform)" }), _jsx(Textarea, { id: "step-params", value: JSON.stringify(editedStep.parameters || {}, null, 2), onChange: (e) => handleParamsChange(e.target.value), placeholder: "Parameters (JSON format)", rows: 6, className: paramsError ? 'border-destructive' : '' }), paramsError && _jsx("p", { className: "text-sm text-destructive", children: paramsError })] }), _jsxs(DialogFooter, { children: [_jsx(DialogClose, { asChild: true, children: _jsx(Button, { type: "button", variant: "secondary", children: "Cancel" }) }), _jsx(Button, { type: "button", onClick: handleSaveStep, children: "Save" })] })] }))] })] })] }) }));
};
export { WorkflowEditor };
