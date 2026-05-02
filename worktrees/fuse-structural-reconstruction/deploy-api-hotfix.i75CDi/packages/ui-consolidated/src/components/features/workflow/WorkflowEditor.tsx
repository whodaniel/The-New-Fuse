import {
  WorkflowModel,
  WorkflowStepDefinition,
  WorkflowStepType,
} from '@the-new-fuse/api-types/src/workflow';
import { Edit, PlusCircle, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Button } from '../../Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../Card/Card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../Dialog/Dialog';
import { Input } from '../../Input/Input';
import { Textarea } from '../../Textarea/Textarea';
import { WorkflowVisualizer } from './WorkflowVisualizer';

// Explicitly define props interface for the component
interface WorkflowEditorProps {
  initialDefinition: WorkflowModel;
  onSave: (definition: WorkflowModel) => void;
}

const WorkflowEditor: React.FC<WorkflowEditorProps> = ({ initialDefinition, onSave }) => {
  const [workflow, setWorkflow] = useState<WorkflowModel>(initialDefinition);
  const [editedStep, setEditedStep] = useState<WorkflowStepDefinition | null>(null);
  const [selectedStep, setSelectedStep] = useState<WorkflowStepDefinition | null>(null);
  const [isNewStep, setIsNewStep] = useState(false);
  const [paramsError, setParamsError] = useState<string | null>(null);

  // Simple workflow state management without external builder
  useEffect(() => {
    setWorkflow(initialDefinition);
  }, [initialDefinition]);

  const handleAddStep = () => {
    // Create a new step with default values
    const newStep: WorkflowStepDefinition = {
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

  const handleEditStep = (step: WorkflowStepDefinition) => {
    setEditedStep({ ...step });
    setIsNewStep(false);
  };

  const handleStepChange = (field: keyof WorkflowStepDefinition, value: any) => {
    setEditedStep((prev: any) => {
      if (!prev) return null;
      return { ...prev, [field]: value };
    });
  };

  const handleParamsChange = (paramsJson: string) => {
    try {
      const parsedParams = JSON.parse(paramsJson);
      setEditedStep((prev: any) => {
        if (!prev) return null;
        return { ...prev, parameters: parsedParams };
      });
      setParamsError(null);
    } catch (_error) {
      setParamsError('Invalid JSON format for parameters.');
    }
  };

  const handleSaveStep = () => {
    if (!editedStep) return;

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
    if (!selectedStep) return;

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
  const _ActionButtons = ({ step }: { step: WorkflowStepDefinition }) => {
    const onEdit = () => handleEditStep(step);
    const onDelete = () => {
      setSelectedStep(step);
      // Show a confirmation dialog or delete immediately
      handleDeleteStep();
    };

    return (
      <div className="flex space-x-2 mt-2">
        <Button onClick={onEdit} variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button onClick={onDelete} variant="outline" size="sm" className="text-destructive">
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Workflow Editor: {workflow.name}</span>
            <div className="flex space-x-2">
              <Button onClick={handleAddStep} variant="outline" size="sm">
                <PlusCircle className="h-4 w-4 mr-1" />
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
          <WorkflowVisualizer definition={workflow} />

          {/* Step Editor Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <span className="hidden">Open Step Editor</span>
            </DialogTrigger>

            {/* Edit Step Dialog Content */}
            {editedStep && (
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>{isNewStep ? 'Add New Step' : 'Edit Step'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <Input
                    id="step-name"
                    value={editedStep.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleStepChange('name', e.target.value)
                    }
                    placeholder="Step Name"
                  />
                  <Input
                    id="step-id"
                    value={editedStep.id}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleStepChange('id', e.target.value)
                    }
                    placeholder="Step ID (unique)"
                    disabled={!isNewStep} // Disable ID editing for existing steps
                  />
                  <Input
                    id="step-type"
                    value={editedStep.type}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleStepChange('type', e.target.value as any)
                    }
                    placeholder="Step Type (e.g., action, condition)"
                  />
                  <Input
                    id="step-action"
                    value={editedStep.action}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleStepChange('action', e.target.value)
                    }
                    placeholder="Action Name (e.g., http.request, data.transform)"
                  />
                  <Textarea
                    id="step-params"
                    value={JSON.stringify(editedStep.parameters || {}, null, 2)}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      handleParamsChange(e.target.value)
                    }
                    placeholder="Parameters (JSON format)"
                    rows={6}
                    className={paramsError ? 'border-destructive' : ''}
                  />
                  {paramsError && <p className="text-sm text-destructive">{paramsError}</p>}
                  {/* TODO: Add UI for dependencies and conditions */}
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="button" onClick={handleSaveStep}>
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            )}
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

export { WorkflowEditor };
