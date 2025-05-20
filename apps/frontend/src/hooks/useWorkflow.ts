import { useState, useCallback } from 'react';
import { Node, Edge, Connection, addEdge } from 'reactflow';
import { v4 as uuidv4 } from 'uuid';

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: Node[];
  edges: Edge[];
  createdAt: Date;
  updatedAt: Date;
}

export const useWorkflow = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Create a new workflow
  const createWorkflow = useCallback((name: string, description?: string) => {
    const newWorkflow: Workflow = {
      id: uuidv4(),
      name,
      description,
      nodes: [
        {
          id: 'input-1',
          type: 'input',
          position: { x: 100, y: 100 },
          data: { 
            name: 'Workflow Input',
            type: 'input',
            config: {
              inputMapping: {}
            }
          }
        }
      ],
      edges: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setWorkflows(prev => [...prev, newWorkflow]);
    setCurrentWorkflow(newWorkflow);
    
    return newWorkflow;
  }, []);
  
  // Load workflows from API
  const loadWorkflows = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, this would fetch workflows from an API
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const mockWorkflows: Workflow[] = [
        {
          id: '1',
          name: 'Sample Workflow',
          description: 'A sample workflow for demonstration',
          nodes: [
            {
              id: 'input-1',
              type: 'input',
              position: { x: 100, y: 100 },
              data: { 
                name: 'Workflow Input',
                type: 'input',
                config: {
                  inputMapping: {}
                }
              }
            },
            {
              id: 'agent-1',
              type: 'agent',
              position: { x: 300, y: 100 },
              data: { 
                name: 'Code Assistant',
                type: 'agent',
                config: {
                  agentId: 'agent-1'
                }
              }
            },
            {
              id: 'output-1',
              type: 'output',
              position: { x: 500, y: 100 },
              data: { 
                name: 'Workflow Output',
                type: 'output',
                config: {
                  outputMapping: {}
                }
              }
            }
          ],
          edges: [
            {
              id: 'edge-input-agent',
              source: 'input-1',
              target: 'agent-1',
              sourceHandle: 'default',
              targetHandle: 'default'
            },
            {
              id: 'edge-agent-output',
              source: 'agent-1',
              target: 'output-1',
              sourceHandle: 'default',
              targetHandle: 'default'
            }
          ],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      setWorkflows(mockWorkflows);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load workflows'));
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Save a workflow
  const saveWorkflow = useCallback(async (workflow: Workflow) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, this would save the workflow to an API
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedWorkflow = {
        ...workflow,
        updatedAt: new Date()
      };
      
      setWorkflows(prev => 
        prev.map(w => w.id === workflow.id ? updatedWorkflow : w)
      );
      
      if (currentWorkflow?.id === workflow.id) {
        setCurrentWorkflow(updatedWorkflow);
      }
      
      return updatedWorkflow;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to save workflow'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentWorkflow]);
  
  // Delete a workflow
  const deleteWorkflow = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, this would delete the workflow from an API
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setWorkflows(prev => prev.filter(w => w.id !== id));
      
      if (currentWorkflow?.id === id) {
        setCurrentWorkflow(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete workflow'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentWorkflow]);
  
  // Execute a workflow
  const executeWorkflow = useCallback(async (workflow: Workflow) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, this would execute the workflow via an API
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Executing workflow:', workflow);
      
      return {
        id: uuidv4(),
        workflowId: workflow.id,
        status: 'completed',
        startTime: new Date(),
        endTime: new Date(),
        results: {}
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to execute workflow'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return {
    workflows,
    currentWorkflow,
    loading,
    error,
    setCurrentWorkflow,
    createWorkflow,
    loadWorkflows,
    saveWorkflow,
    deleteWorkflow,
    executeWorkflow
  };
};

export default useWorkflow;
