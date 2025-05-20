import React from 'react';
import { WorkflowBuilder } from '../services/WorkflowBuilder.js';
import { WorkflowEditor } from '../components/WorkflowEditor.js';
import WorkflowControlPanel from '../components/WorkflowControlPanel.js';
import { WorkflowDefinition } from '../types.js';

const WorkflowExample: React.FC = () => {
  // Example Workflow Definition
  const createExampleDefinition = (): WorkflowDefinition => {
    const builder = new WorkflowBuilder('example-workflow', 'Example Data Processing');

    builder.addStep({
      id: 'step-1',
      name: 'Fetch Data',
      type: 'action',
      action: 'http.request',
      parameters: {
        url: 'https://api.example.com/data',
        method: 'GET',
      },
      dependencies: [],
    });

    builder.addStep({
      id: 'step-2',
      name: 'Transform Data',
      type: 'action',
      action: 'data.transform',
      parameters: {
        transform: 'jsonata',
        expression: '$uppercase(payload.name)',
      },
      dependencies: ['step-1'],
    });

    // Example Conditional Step
    builder.addStep({
      id: 'step-conditional',
      name: 'Check Condition',
      type: 'condition',
      action: 'logic.evaluate',
      parameters: {
        expression: 'payload.value > 10',
      },
      dependencies: ['step-2'],
      conditions: [
        {
          nextStepId: 'step-3a', // If condition is true
          expression: 'result === true', // Based on the output of logic.evaluate
        },
        {
          nextStepId: 'step-3b', // If condition is false
          expression: 'result === false',
        },
      ],
    });

    builder.addStep({
      id: 'step-3a',
      name: 'Process High Value',
      type: 'action',
      action: 'notify.slack',
      parameters: {
        channel: '#alerts',
        message: 'High value item processed: {{payload.name}}',
      },
      dependencies: ['step-conditional'],
    });

    builder.addStep({
      id: 'step-3b',
      name: 'Process Standard Value',
      type: 'action',
      action: 'log.info',
      parameters: {
        message: 'Standard value item processed: {{payload.name}}',
      },
      dependencies: ['step-conditional'],
    });

    builder.addStep({
      id: 'step-final',
      name: 'Save Result',
      type: 'action',
      action: 'db.save',
      parameters: {
        destination: 'results_table',
      },
      // Depends on both possible outcomes of the condition
      dependencies: ['step-3a', 'step-3b'],
    });

    return builder.build();
  };

  const [definition, setDefinition] = React.useState<WorkflowDefinition>(createExampleDefinition());

  const handleSave = (updatedDefinition: WorkflowDefinition) => {
    console.log('Saving updated workflow:', updatedDefinition);
    setDefinition(updatedDefinition);
    // Here you would typically send the definition to your backend API
  };

  // Mock metrics and status for control panel example
  const mockMetrics = {
    stepMetrics: {
      'step-1': { id: 'step-1', status: 'completed', attempts: 1 },
      'step-2': { id: 'step-2', status: 'running', attempts: 1 },
      'step-conditional': { id: 'step-conditional', status: 'pending', attempts: 0 },
      'step-3a': { id: 'step-3a', status: 'pending', attempts: 0 },
      'step-3b': { id: 'step-3b', status: 'pending', attempts: 0 },
      'step-final': { id: 'step-final', status: 'pending', attempts: 0 },
    }
  };
  const mockStatus = 'running'; // or 'paused', 'completed', 'failed'

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Workflow Management</h1>
      <WorkflowEditor initialDefinition={definition} onSave={handleSave} />
      <WorkflowControlPanel
        workflowId={definition.id}
        status={mockStatus}
        metrics={mockMetrics}
        onPause={() => console.log('Pause requested')}
        onResume={() => console.log('Resume requested')}
        onRetry={() => console.log('Retry requested')}
        onCancel={() => console.log('Cancel requested')}
      />
    </div>
  );
};

export default WorkflowExample;
