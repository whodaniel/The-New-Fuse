import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWorkflow, Workflow } from '@/hooks';
import { ChevronLeft, Play, Pause, RotateCcw, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

/**
 * Workflow Execution page component
 */
const WorkflowExecution: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { workflows, loading, error, executeWorkflow } = useWorkflow();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionStatus, setExecutionStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);

  // Find the workflow by ID
  useEffect(() => {
    if (id && workflows.length > 0) {
      const foundWorkflow = workflows.find(w => w.id === id);
      setWorkflow(foundWorkflow || null);
    }
  }, [id, workflows]);

  // Handle execute workflow
  const handleExecuteWorkflow = async () => {
    if (!workflow) return;

    setIsExecuting(true);
    setExecutionStatus('running');
    setExecutionLogs((prev: any) => [...prev, `[${new Date().toISOString()}] Starting workflow execution...`]);

    try {
      // Simulate node execution
      for (const node of workflow.nodes) {
        setExecutionLogs((prev: any) => [...prev, `[${new Date().toISOString()}] Executing node: ${node.data.name || node.id}`]);

        // Simulate execution time
        await new Promise(resolv(e: any) => setTimeout(resolve, 1000));

        // Randomly succeed or fail for demo purposes
        const success = Math.random() > 0.2;

        if (success) {
          setExecutionLogs((prev: any) => [...prev, `[${new Date().toISOString()}] Node ${node.data.name || node.id} completed successfully`]);
        } else {
          setExecutionLogs((prev: any) => [...prev, `[${new Date().toISOString()}] Node ${node.data.name || node.id} failed: Error executing node`]);
          setExecutionStatus('failed');
          setIsExecuting(false);
          return;
        }
      }

      setExecutionLogs((prev: any) => [...prev, `[${new Date().toISOString()}] Workflow execution completed successfully`]);
      setExecutionStatus('completed');
    } catch (err) {
      setExecutionLogs((prev: any) => [...prev, `[${new Date().toISOString()}] Workflow execution failed: ${err instanceof Error ? err.message : 'Unknown error'}`]);
      setExecutionStatus('failed');
    } finally {
      setIsExecuting(false);
    }
  };

  // Handle pause execution
  const handlePauseExecution = () => {
    setIsExecuting(false);
    setExecutionLogs((prev: any) => [...prev, `[${new Date().toISOString()}] Workflow execution paused`]);
  };

  // Handle reset execution
  const handleResetExecution = () => {
    setExecutionStatus('idle');
    setExecutionLogs([]);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto py-6">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto py-6">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error.message}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto py-6">
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
              Workflow not found. The workflow may have been deleted or you may not have access to it.
            </div>
            <div className="mt-4">
              <Button variant="outline" onClick={() => navigate('/workflows')}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Workflows
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-auto">
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
              {executionStatus === 'idle' || executionStatus === 'completed' || executionStatus === 'failed' ? (
                <Button onClick={handleExecuteWorkflow} disabled={isExecuting}>
                  <Play className="h-4 w-4 mr-2" />
                  Execute
                </Button>
              ) : (
                <Button variant="outline" onClick={handlePauseExecution} disabled={!isExecuting}>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              )}

              <Button variant="outline" onClick={handleResetExecution} disabled={isExecuting || executionStatus === 'idle'}>
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
                  {executionStatus === 'idle' && (
                    <>
                      <Clock className="h-5 w-5 text-gray-500 mr-2" />
                      <span className="font-medium">Idle</span>
                    </>
                  )}
                  {executionStatus === 'running' && (
                    <>
                      <div className="h-5 w-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mr-2"></div>
                      <span className="font-medium text-blue-500">Running</span>
                    </>
                  )}
                  {executionStatus === 'completed' && (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <span className="font-medium text-green-500">Completed</span>
                    </>
                  )}
                  {executionStatus === 'failed' && (
                    <>
                      <XCircle className="h-5 w-5 text-red-500 mr-2" />
                      <span className="font-medium text-red-500">Failed</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Nodes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{workflow.nodes.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Start Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  {executionStatus !== 'idle' ? new Date().toLocaleString() : 'Not started'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  {executionStatus === 'running' ? 'Running...' : executionStatus === 'idle' ? 'Not started' : '00:00:05'}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Execution Logs</CardTitle>
              <CardDescription>
                View the logs for this workflow execution.
              </CardDescription>
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
                    <div key={index} className="py-1">
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
              <CardDescription>
                View the execution status of each node in the workflow.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflow.nodes.map((node, index) => (
                  <div key={node.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{node.data.name || node.id}</div>
                        <div className="text-xs text-muted-foreground">{node.type}</div>
                      </div>
                    </div>
                    <div>
                      {executionStatus === 'idle' && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                          Pending
                        </span>
                      )}
                      {executionStatus === 'running' && index === 1 && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center">
                          <div className="h-2 w-2 rounded-full bg-blue-500 mr-1 animate-pulse"></div>
                          Running
                        </span>
                      )}
                      {executionStatus === 'running' && index < 1 && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          Completed
                        </span>
                      )}
                      {executionStatus === 'running' && index > 1 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                          Pending
                        </span>
                      )}
                      {executionStatus === 'completed' && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          Completed
                        </span>
                      )}
                      {executionStatus === 'failed' && index < 2 && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          Completed
                        </span>
                      )}
                      {executionStatus === 'failed' && index === 2 && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                          Failed
                        </span>
                      )}
                      {executionStatus === 'failed' && index > 2 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                          Skipped
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default WorkflowExecution;
