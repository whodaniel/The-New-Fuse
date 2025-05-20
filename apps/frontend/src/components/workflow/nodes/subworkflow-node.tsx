import React, { memo, useState, useEffect } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from './base-node.js';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ChevronDown, ChevronUp, Edit, Play, Workflow } from 'lucide-react';
import { workflowDatabaseService } from '@/services/WorkflowDatabaseService';
import { workflowExecutionService } from '@/services/WorkflowExecutionService';

const SubworkflowNode: React.React.FC<NodeProps> = memo(({ id, data }) => {
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
          workflowId
        }
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
            inputMapping: mapping
          }
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
            outputMapping: mapping
          }
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
        variables: inputData
      });
      
      // Get execution result
      const executionHistory = workflowExecutionService.getExecutionHistory();
      const execution = executionHistory.find(item => item.id === executionId);
      
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
  const selectedWorkflow = workflows.find(w => w.id === config.workflowId);
  
  // Input and output handles
  const inputHandles = [
    { id: 'input', label: 'Input' }
  ];
  
  const outputHandles = [
    { id: 'output', label: 'Output' },
    { id: 'error', label: 'Error' }
  ];
  
  // Render node content
  const renderContent = () => (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor={`workflow-${id}`} className="text-xs">Subworkflow</Label>
        <Select
          value={config.workflowId || ''}
          onValueChange={handleWorkflowChange}
          disabled={loading}
        >
          <SelectTrigger id={`workflow-${id}`} className="text-xs h-7">
            <SelectValue placeholder="Select workflow" />
          </SelectTrigger>
          <SelectContent>
            {workflows.map(workflow => (
              <SelectItem key={workflow.id} value={workflow.id} className="text-xs">
                {workflow.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex justify-between">
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-7"
          onClick={() => setIsDialogOpen(true)}
        >
          <Edit className="h-3 w-3 mr-1" />
          Configure
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-7"
          onClick={executeSubworkflow}
          disabled={!config.workflowId || isExecuting}
        >
          <Play className="h-3 w-3 mr-1" />
          Test
        </Button>
      </div>
      
      {selectedWorkflow && (
        <div className="text-xs text-muted-foreground">
          <div>Workflow: {selectedWorkflow.name}</div>
          <div>Nodes: {selectedWorkflow.nodes?.length || 0}</div>
        </div>
      )}
      
      {executionResult && (
        <div className="text-xs bg-muted p-2 rounded-md max-h-20 overflow-auto">
          <pre className="text-xs">{JSON.stringify(executionResult, null, 2)}</pre>
        </div>
      )}
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Configure Subworkflow</DialogTitle>
            <DialogDescription>
              Configure input and output mappings for the subworkflow.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="input">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="input">Input Mapping</TabsTrigger>
              <TabsTrigger value="output">Output Mapping</TabsTrigger>
            </TabsList>
            
            <TabsContent value="input" className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor={`input-mapping-${id}`} className="text-sm">Input Mapping</Label>
                <Textarea
                  id={`input-mapping-${id}`}
                  className="font-mono text-xs h-40"
                  placeholder='{\n  "targetField": "source.path.to.field"\n}'
                  value={config.inputMapping || '{\n  "input": "input"\n}'}
                  onChange={(e: any) => handleInputMappingChange(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Map input fields to subworkflow variables. Use JSON format with target fields as keys and source paths as values.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="output" className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor={`output-mapping-${id}`} className="text-sm">Output Mapping</Label>
                <Textarea
                  id={`output-mapping-${id}`}
                  className="font-mono text-xs h-40"
                  placeholder='{\n  "result": "output-node-id.result"\n}'
                  value={config.outputMapping || '{\n  "result": "output"\n}'}
                  onChange={(e: any) => handleOutputMappingChange(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Map subworkflow results to output fields. Use JSON format with output fields as keys and result paths as values.
                </p>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)}>Done</Button>
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
        renderContent
      }}
      inputHandles={inputHandles}
      outputHandles={outputHandles}
    />
  );
});

SubworkflowNode.displayName = 'SubworkflowNode';

export { SubworkflowNode };
