import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { workflowDatabaseService } from '@/services/WorkflowDatabaseService';
import { workflowExecutionService } from '@/services/WorkflowExecutionService';
import { Edit, Play } from 'lucide-react';
import React, { memo, useEffect, useState } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from './base-node';

const SubworkflowNode: React.FC<NodeProps> = memo(({ id, data }) => {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);

  const config = data.config || {};

  // Load workflows
  useEffect(() => {
    const loadWorkflows = async () => {
      setLoading(true);
      setError(null);

      try {
        const workflows = await workflowDatabaseService.getWorkflows();
        setWorkflows(workflows);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load workflows'));
      } finally {
        setLoading(false);
      }
    };

    loadWorkflows();
  }, []);

  // Handle workflow selection
  const handleWorkflowChange = (workflowId: string) => {
    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...config,
          workflowId,
        },
      });
    }
  };

  // Handle input mapping change
  const handleInputMappingChange = (mapping: string) => {
    try {
      // Validate JSON
      const parsedMapping = JSON.parse(mapping);

      if (data.onUpdate) {
        data.onUpdate({
          config: {
            ...config,
            inputMapping: mapping,
          },
        });
      }
    } catch (error) {
      // Invalid JSON, don't update
      console.error('Invalid input mapping JSON:', error);
    }
  };

  // Handle output mapping change
  const handleOutputMappingChange = (mapping: string) => {
    try {
      // Validate JSON
      const parsedMapping = JSON.parse(mapping);

      if (data.onUpdate) {
        data.onUpdate({
          config: {
            ...config,
            outputMapping: mapping,
          },
        });
      }
    } catch (error) {
      // Invalid JSON, don't update
      console.error('Invalid output mapping JSON:', error);
    }
  };

  // Execute subworkflow
  const executeSubworkflow = async () => {
    if (!config.workflowId) {
      return;
    }

    setIsExecuting(true);
    setExecutionResult(null);

    try {
      // Get workflow
      const workflow = await workflowDatabaseService.getWorkflow(config.workflowId);

      // Parse input mapping
      let inputData = {};
      if (config.inputMapping) {
        try {
          const mapping = JSON.parse(config.inputMapping);

          // Apply mapping to input data
          if (data.inputs) {
            Object.entries(mapping).forEach(([key, value]) => {
              const path = (value as string).split('.');
              let source = data.inputs;

              for (const segment of path) {
                if (source && typeof source === 'object' && segment in source) {
                  source = source[segment];
                } else {
                  source = undefined;
                  break;
                }
              }

              if (source !== undefined) {
                inputData[key] = source;
              }
            });
          }
        } catch (error) {
          console.error('Error applying input mapping:', error);
        }
      }

      // Execute workflow
      const executionId = await workflowExecutionService.executeWorkflow(workflow, {
        variables: inputData,
      });

      // Get execution result
      const executionHistory = workflowExecutionService.getExecutionHistory();
      const execution = executionHistory.find((item) => item.id === executionId);

      if (execution) {
        // Apply output mapping
        let outputData = execution.nodeResults;

        if (config.outputMapping) {
          try {
            const mapping = JSON.parse(config.outputMapping);
            const result = {};

            Object.entries(mapping).forEach(([key, value]) => {
              const path = (value as string).split('.');
              let source = outputData;

              for (const segment of path) {
                if (source && typeof source === 'object' && segment in source) {
                  source = source[segment];
                } else {
                  source = undefined;
                  break;
                }
              }

              if (source !== undefined) {
                result[key] = source;
              }
            });

            outputData = result;
          } catch (error) {
            console.error('Error applying output mapping:', error);
          }
        }

        setExecutionResult(outputData);
      }
    } catch (error) {
      console.error('Error executing subworkflow:', error);
      setExecutionResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsExecuting(false);
    }
  };

  // Get selected workflow
  const selectedWorkflow = workflows.find((w) => w.id === config.workflowId);

  // Input and output handles
  const inputHandles = [{ id: 'input', label: 'Input' }];

  const outputHandles = [
    { id: 'output', label: 'Output' },
    { id: 'error', label: 'Error' },
  ];

  // Render node content
  const renderContent = () => (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor={`workflow-${id}`} className="text-xs font-medium text-slate-200">
          Subworkflow
        </Label>
        <Select
          value={config.workflowId || ''}
          onValueChange={handleWorkflowChange}
          disabled={loading}
        >
          <SelectTrigger
            id={`workflow-${id}`}
            className="h-9 text-xs bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
          >
            <SelectValue placeholder="Select workflow" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600">
            {workflows.map((workflow) => (
              <SelectItem
                key={workflow.id}
                value={workflow.id}
                className="text-xs text-white hover:bg-slate-700 focus:bg-slate-700"
              >
                {workflow.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Empty state when no workflows available */}
      {!loading && workflows.length === 0 && (
        <div className="text-xs text-slate-400 bg-slate-700/30 p-3 rounded border border-slate-600/50 text-center">
          <div className="text-2xl mb-2">📋</div>
          <p className="font-medium text-slate-300">No Workflows Available</p>
          <p className="mt-1 text-slate-400 leading-relaxed">
            Create and save other workflows to use them as subworkflows here.
          </p>
          <p className="mt-2 text-slate-500 text-xs">
            Subworkflows allow you to reuse complex logic across multiple workflows.
          </p>
        </div>
      )}

      <div className="flex justify-between">
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-7 border-slate-600 text-white hover:bg-slate-700 bg-slate-700/50"
          onClick={() => setIsDialogOpen(true)}
        >
          <Edit className="h-3 w-3 mr-1" />
          Configure
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="text-xs h-7 border-slate-600 text-white hover:bg-slate-700 bg-slate-700/50"
          onClick={executeSubworkflow}
          disabled={!config.workflowId || isExecuting}
        >
          <Play className="h-3 w-3 mr-1" />
          Test
        </Button>
      </div>

      {selectedWorkflow && (
        <div className="text-xs text-slate-300">
          <div>Workflow: {selectedWorkflow.name}</div>
          <div>Nodes: {selectedWorkflow.nodes?.length || 0}</div>
        </div>
      )}

      {executionResult && (
        <div className="text-xs bg-slate-700/50 border border-slate-600 p-2 rounded-md max-h-20 overflow-auto">
          <pre className="text-xs text-slate-200">{JSON.stringify(executionResult, null, 2)}</pre>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-slate-800 border-slate-600 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Configure Subworkflow</DialogTitle>
            <DialogDescription className="text-slate-300">
              Configure input and output mappings for the subworkflow.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="input">
            <TabsList className="grid w-full grid-cols-2 bg-slate-700 border-slate-600">
              <TabsTrigger
                value="input"
                className="data-[state=active]:bg-slate-600 data-[state=active]:text-white"
              >
                Input Mapping
              </TabsTrigger>
              <TabsTrigger
                value="output"
                className="data-[state=active]:bg-slate-600 data-[state=active]:text-white"
              >
                Output Mapping
              </TabsTrigger>
            </TabsList>

            <TabsContent value="input" className="space-y-3">
              <div className="space-y-1">
                <Label
                  htmlFor={`input-mapping-${id}`}
                  className="text-sm font-medium text-slate-200"
                >
                  Input Mapping
                </Label>
                <Textarea
                  id={`input-mapping-${id}`}
                  className="font-mono text-xs h-40 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 resize-none"
                  placeholder='{\n  "targetField": "source.path.to.field"\n}'
                  value={config.inputMapping || '{\n  "input": "input"\n}'}
                  onChange={(e: any) => handleInputMappingChange(e.target.value)}
                />
                <p className="text-xs text-slate-300 leading-relaxed">
                  Map input fields to subworkflow variables. Use JSON format with target fields as
                  keys and source paths as values.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="output" className="space-y-3">
              <div className="space-y-1">
                <Label
                  htmlFor={`output-mapping-${id}`}
                  className="text-sm font-medium text-slate-200"
                >
                  Output Mapping
                </Label>
                <Textarea
                  id={`output-mapping-${id}`}
                  className="font-mono text-xs h-40 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 resize-none"
                  placeholder='{\n  "result": "output-node-id.result"\n}'
                  value={config.outputMapping || '{\n  "result": "output"\n}'}
                  onChange={(e: any) => handleOutputMappingChange(e.target.value)}
                />
                <p className="text-xs text-slate-300 leading-relaxed">
                  Map subworkflow results to output fields. Use JSON format with output fields as
                  keys and result paths as values.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              onClick={() => setIsDialogOpen(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <BaseNode
      id={id}
      data={{
        ...data,
        name: selectedWorkflow?.name || data.name || 'Subworkflow',
        type: 'subworkflow',
        renderContent,
      }}
      inputHandles={inputHandles}
      outputHandles={outputHandles}
    />
  );
});

SubworkflowNode.displayName = 'SubworkflowNode';

export { SubworkflowNode };
