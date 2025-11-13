import React, { useState, useEffect } from 'react';
import { WorkflowStepType } from '@the-new-fuse/api-types'; // Updated import
// import { WorkflowBuilder } from '../../../api/src/services/WorkflowBuilder'; // This will be migrated later
import { WorkflowVisualizer } from './WorkflowVisualizer';
import { Button } from '../../Button/Button';
import { Input } from '../../Input/Input';
import { Textarea } from '../../Textarea/Textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../Card/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '../../Dialog/Dialog';
import { Trash2, Edit, PlusCircle } from 'lucide-react';
const WorkflowEditor = ({ initialDefinition, onSave }) => {
    const [workflow, setWorkflow] = useState(initialDefinition);
    const [editedStep, setEditedStep] = useState(null);
    const [selectedStep, setSelectedStep] = useState(null);
    const [isNewStep, setIsNewStep] = useState(false);
    const [paramsError, setParamsError] = useState(null);
    // TODO: Initialize WorkflowBuilder when service is available
    // const [builder] = useState(() => {
    //   return new WorkflowBuilder(
    //     initialDefinition.id,
    //     initialDefinition.name,
    //     initialDefinition.description
    //   );
    // });
    // Placeholder builder until service is available
    const builder = {
        build: () => workflow,
        addStep: (_step) => { },
        removeStep: (_stepId) => { },
        updateStep: (_stepId, _step) => { }
    };
    // Load initial steps
    useEffect(() => {
        // Reset builder with initial definition steps
        // Assuming initialDefinition.steps is an array in this context, need to convert to Record
        const stepsRecord = {};
        if (Array.isArray(initialDefinition.steps)) {
            initialDefinition.steps.forEach((step) => {
                stepsRecord[step.id] = step;
            });
        }
        else {
            Object.assign(stepsRecord, initialDefinition.steps);
        }
        for (const stepId in stepsRecord) {
            builder.addStep(stepsRecord[stepId]);
        }
        setWorkflow(builder.build());
    }, [initialDefinition, builder]);
    const handleAddStep = () => {
        // Create a new step with default values
        const newStep = {
            id: `step-${Date.now().toString()}`,
            name: "New Step",
            type: WorkflowStepType.ACTION,
            action: "custom.action",
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
            setParamsError("Invalid JSON format for parameters.");
        }
    };
    const handleSaveStep = () => {
        if (!editedStep)
            return;
        if (isNewStep) {
            builder.addStep(editedStep);
        }
        else {
            // Update existing step
            // This is a simplified approach - in a real app you'd need to handle dependencies
            const updatedSteps = { ...workflow.steps };
            updatedSteps[editedStep.id] = editedStep;
            // Recreate workflow with updated steps
            // This is simplified - in a real implementation you'd need to handle the graph structure
            const updatedWorkflow = {
                ...workflow,
                steps: updatedSteps
            };
            setWorkflow(updatedWorkflow);
            builder.updateStep(editedStep.id, editedStep);
        }
        // Refresh the workflow
        setWorkflow(builder.build());
        setEditedStep(null);
    };
    const handleDeleteStep = () => {
        if (!selectedStep)
            return;
        // Remove step from builder
        builder.removeStep(selectedStep.id);
        // Refresh the workflow
        setWorkflow(builder.build());
        setSelectedStep(null);
    };
    const handleSaveWorkflow = () => {
        const updatedWorkflow = builder.build();
        onSave(updatedWorkflow);
    };
    // Helper component for action buttons that appear when a step is selected
    // TODO: Integrate this component when step editing is implemented
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ActionButtons = ({ step }) => {
        const onEdit = () => handleEditStep(step);
        const onDelete = () => {
            setSelectedStep(step);
            // Show a confirmation dialog or delete immediately
            handleDeleteStep();
        };
        return (<div className="flex space-x-2 mt-2">
        <Button onClick={onEdit} variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-1"/>
          Edit
        </Button>
        <Button onClick={onDelete} variant="outline" size="sm" className="text-destructive">
          <Trash2 className="h-4 w-4 mr-1"/>
          Delete
        </Button>
      </div>);
    };
    return (<div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Workflow Editor: {workflow.name}</span>
            <div className="flex space-x-2">
              <Button onClick={handleAddStep} variant="outline" size="sm">
                <PlusCircle className="h-4 w-4 mr-1"/>
                Add Step
              </Button>
              <Button onClick={handleSaveWorkflow} variant="outline" size="sm">
                Save Workflow
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Workflow Visualization */}
          <WorkflowVisualizer definition={workflow}/>

          {/* Step Editor Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <span className="hidden">Open Step Editor</span>
            </DialogTrigger>
            
            {/* Edit Step Dialog Content */}
            {editedStep && (<DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>{isNewStep ? 'Add New Step' : 'Edit Step'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <Input id="step-name" value={editedStep.name} onChange={(e) => handleStepChange('name', e.target.value)} placeholder="Step Name"/>
                  <Input id="step-id" value={editedStep.id} onChange={(e) => handleStepChange('id', e.target.value)} placeholder="Step ID (unique)" disabled={!isNewStep} // Disable ID editing for existing steps
        />
                   <Input id="step-type" value={editedStep.type} onChange={(e) => handleStepChange('type', e.target.value)} placeholder="Step Type (e.g., action, condition)"/>
                   <Input id="step-action" value={editedStep.action} onChange={(e) => handleStepChange('action', e.target.value)} placeholder="Action Name (e.g., http.request, data.transform)"/>
                  <Textarea id="step-params" value={JSON.stringify(editedStep.parameters || {}, null, 2)} onChange={(e) => handleParamsChange(e.target.value)} placeholder="Parameters (JSON format)" rows={6} className={paramsError ? 'border-destructive' : ''}/>
                  {paramsError && <p className="text-sm text-destructive">{paramsError}</p>}
                  {/* TODO: Add UI for dependencies and conditions */}
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancel</Button>
                  </DialogClose>
                  <Button type="button" onClick={handleSaveStep}>Save</Button>
                </DialogFooter>
              </DialogContent>)}
          </Dialog>
        </CardContent>
      </Card>
    </div>);
};
export { WorkflowEditor };
//# sourceMappingURL=WorkflowEditor.js.map