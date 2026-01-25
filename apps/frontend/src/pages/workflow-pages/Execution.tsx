import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWorkflow } from '@/hooks';
import {
  WorkflowExecution as IWorkflowExecution,
  workflowService,
} from '@/services/WorkflowService';
import { AlertCircle, ChevronLeft, Pause, Play, RotateCcw } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

/**
 * Workflow Execution page component
 */
const WorkflowExecution: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { workflows, loading, error, executeWorkflow, getWorkflow } = useWorkflow();
  const [workflow, setWorkflow] = useState<any>(null); // Using any temporarily to avoid type mismatches with different Workflow interfaces
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentExecution, setCurrentExecution] = useState<IWorkflowExecution | null>(null);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const subscriptionRef = useRef<(() => void) | null>(null);

  // Load workflow
  useEffect(() => {
    const fetchWorkflow = async () => {
      if (id) {
        // Try to find in loaded workflows first
        const found = workflows.find((w) => w.id === id);
        if (found) {
          setWorkflow(found);
        } else {
          // Fetch specifically
          try {
            const fetched = await getWorkflow(id);
            setWorkflow(fetched);
          } catch (e) {
            console.error(e);
          }
        }
      }
    };
    fetchWorkflow();
  }, [id, workflows, getWorkflow]);

  // Clean up subscription
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current();
      }
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'failed':
        return 'text-red-500';
      case 'running':
        return 'text-blue-500';
      case 'pending':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  const handleExecuteWorkflow = async () => {
    if (!workflow) return;

    setIsExecuting(true);
    setExecutionLogs((prev) => [...prev, `[${new Date().toISOString()}] Initiating execution...`]);

    try {
      const execution = await executeWorkflow(workflow.id, {});
      setCurrentExecution(execution);

      // Subscribe to updates
      try {
        subscriptionRef.current = workflowService.subscribeToExecution(
          execution.id,
          (updatedExecution) => {
            setCurrentExecution(updatedExecution);

            // Extract new logs
            if (updatedExecution.logs && updatedExecution.logs.length > executionLogs.length) {
              const newLogs = updatedExecution.logs
                .slice(executionLogs.length)
                .map((l) => `[${new Date(l.timestamp).toISOString()}] ${l.message}`);
              setExecutionLogs((prev) => [...prev, ...newLogs]);
            }

            if (
              updatedExecution.status === 'completed' ||
              updatedExecution.status === 'failed' ||
              updatedExecution.status === 'cancelled'
            ) {
              setIsExecuting(false);
              if (subscriptionRef.current) {
                subscriptionRef.current();
                subscriptionRef.current = null;
              }
            }
          }
        );
      } catch (wsError) {
        console.warn('WebSocket subscription failed, falling back to polling', wsError);
        // Fallback polling could go here
      }
    } catch (err: any) {
      setExecutionLogs((prev) => [
        ...prev,
        `[${new Date().toISOString()}] Execution failed startup: ${err.message}`,
      ]);
      setIsExecuting(false);
    }
  };

  const handleStopExecution = async () => {
    if (currentExecution) {
      await workflowService.cancelExecution(currentExecution.id);
      setIsExecuting(false);
    }
  };

  const handleResetExecution = () => {
    setCurrentExecution(null);
    setExecutionLogs([]);
    setIsExecuting(false);
  };

  if (loading && !workflow) {
    return (
      <div className="container mx-auto py-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
          Workflow not found.
        </div>
        <Button variant="outline" onClick={() => navigate('/workflows')} className="mt-4">
          <ChevronLeft className="h-4 w-4 mr-2" /> Back to Workflows
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/workflows/${id}`)}
                className="mr-4"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Workflow
              </Button>
              <div>
                <h1 className="text-3xl font-bold">{workflow.name}</h1>
                <p className="text-muted-foreground">Workflow Execution</p>
              </div>
            </div>

            <div className="flex space-x-2">
              {!isExecuting ? (
                <Button onClick={handleExecuteWorkflow}>
                  <Play className="h-4 w-4 mr-2" />
                  Execute
                </Button>
              ) : (
                <Button variant="outline" onClick={handleStopExecution}>
                  <Pause className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              )}

              <Button variant="outline" onClick={handleResetExecution} disabled={isExecuting}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  {currentExecution ? (
                    <span
                      className={`font-medium ${getStatusColor(currentExecution.status)} capitalize flex items-center`}
                    >
                      {currentExecution.status === 'running' && (
                        <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin mr-2" />
                      )}
                      {currentExecution.status}
                    </span>
                  ) : (
                    <span className="text-gray-500 font-medium">Idle</span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Nodes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{workflow.nodes?.length || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  {currentExecution ? new Date(currentExecution.startTime).toLocaleString() : '-'}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Execution Logs</CardTitle>
              <CardDescription>Real-time logs from the workflow engine.</CardDescription>
            </CardHeader>
            <CardContent>
              {executionLogs.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    No logs yet. Execute the workflow to see logs here.
                  </p>
                </div>
              ) : (
                <div className="bg-gray-900 text-gray-100 p-4 rounded-md font-mono text-sm overflow-auto max-h-96">
                  {executionLogs.map((log, index) => (
                    <div key={index} className="py-1 border-b border-gray-800 last:border-0">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Node Execution Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflow.nodes?.map((node: any, index: number) => {
                  const nodeExec = currentExecution?.nodeExecutions?.find(
                    (ne) => ne.nodeId === node.id
                  );
                  const status = nodeExec?.status || 'pending';

                  return (
                    <div
                      key={node.id}
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 font-mono text-xs">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">
                            {node.data?.name || node.id || 'Unnamed Node'}
                          </div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {node.type}
                          </div>
                        </div>
                      </div>
                      <div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs capitalize ${
                            status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : status === 'failed'
                                ? 'bg-red-100 text-red-700'
                                : status === 'running'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default WorkflowExecution;
