import React, { useEffect, useState } from 'react';
import { useReactFlow } from 'reactflow';
import { workflowExecutionService, ExecutionUpdate } from '@/services/WorkflowExecutionService';
import { useA2ACommunication } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Play, Square, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';

interface WorkflowExecutionContextProps {
  workflowId: string;
}

export const WorkflowExecutionContext: React.React.FC<WorkflowExecutionContextProps> = ({ workflowId }) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [nodeStates, setNodeStates] = useState<Record<string, 'idle' | 'running' | 'completed' | 'failed'>>({}); 
  const { getNodes, getEdges, setNodes, setEdges } = useReactFlow();
  const a2aService = useA2ACommunication();
  
  // Initialize A2A service
  useEffect(() => {
    workflowExecutionService.setA2AService(a2aService);
  }, [a2aService]);
  
  // Subscribe to execution updates
  useEffect(() => {
    const subscription = workflowExecutionService.subscribe((update: ExecutionUpdate) => {
      if (update.nodeId) {
        // Update node state
        setNodeStates((prev: any) => ({
          ...prev,
          [update.nodeId]: update.state as any
        }));
        
        // Update node UI
        setNodes(nodes => 
          nodes.map(nod(e: any) => {
            if (node.id === update.nodeId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  status: update.state
                }
              };
            }
            return node;
          })
        );
        
        // Show toast for node completion or failure
        if (update.state === 'completed') {
          toast.success(`Node ${update.nodeId} completed`);
        } else if (update.state === 'failed') {
          toast.error(`Node ${update.nodeId} failed: ${update.message}`);
        }
      } else {
        // Update workflow execution state
        if (update.state === 'started') {
          setIsExecuting(true);
          setExecutionId(update.executionId);
          toast.info('Workflow execution started');
        } else if (update.state === 'completed') {
          setIsExecuting(false);
          toast.success('Workflow execution completed');
        } else if (update.state === 'failed') {
          setIsExecuting(false);
          toast.error(`Workflow execution failed: ${update.message}`);
        } else if (update.state === 'aborted') {
          setIsExecuting(false);
          toast.warning('Workflow execution aborted');
        }
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [setNodes]);
  
  // Execute workflow
  const handleExecuteWorkflow = async () => {
    try {
      // Reset node states
      const nodes = getNodes();
      setNodeStates(
        nodes.reduce((acc, node) => {
          acc[node.id] = 'idle';
          return acc;
        }, {} as Record<string, 'idle' | 'running' | 'completed' | 'failed'>)
      );
      
      // Update node UI
      setNodes(nodes => 
        nodes.map(nod(e: any) => ({
          ...node,
          data: {
            ...node.data,
            status: 'idle'
          }
        }))
      );
      
      // Execute workflow
      const workflow = {
        id: workflowId,
        name: 'Current Workflow',
        nodes: getNodes(),
        edges: getEdges()
      };
      
      await workflowExecutionService.executeWorkflow(workflow);
    } catch (error) {
      console.error('Failed to execute workflow:', error);
      toast.error(`Failed to execute workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Abort workflow execution
  const handleAbortExecution = () => {
    if (executionId) {
      workflowExecutionService.abortExecution(executionId);
    }
  };
  
  return (
    <div className="absolute bottom-4 right-4 flex space-x-2">
      {isExecuting ? (
        <Button variant="destructive" size="sm" onClick={handleAbortExecution}>
          <Square className="h-4 w-4 mr-2" />
          Stop Execution
        </Button>
      ) : (
        <Button variant="default" size="sm" onClick={handleExecuteWorkflow}>
          <Play className="h-4 w-4 mr-2" />
          Execute Workflow
        </Button>
      )}
    </div>
  );
};

export default WorkflowExecutionContext;
