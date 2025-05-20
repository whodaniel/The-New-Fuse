import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWorkflow, Workflow } from '@/hooks';
import WorkflowAnalytics from '@/components/workflow/WorkflowAnalytics';
import { ChevronLeft, Play, Edit, Clock, Calendar, BarChart, FileText, GitBranch } from 'lucide-react';

/**
 * Workflow Detail page component
 */
const WorkflowDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { workflows, loading, error } = useWorkflow();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);

  // Find the workflow by ID
  useEffect(() => {
    if (id && workflows.length > 0) {
      const foundWorkflow = workflows.find(w => w.id === id);
      setWorkflow(foundWorkflow || null);
    }
  }, [id, workflows]);

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
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
                onClick={() => navigate('/workflows')}
                className="mr-4"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold">{workflow.name}</h1>
                <p className="text-muted-foreground">
                  Created {formatDate(workflow.createdAt)} • Updated {formatDate(workflow.updatedAt)}
                </p>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" asChild>
                <Link to={`/workflows/builder?id=${workflow.id}`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
              <Button>
                <Play className="h-4 w-4 mr-2" />
                Execute
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="executions">Executions</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <CardTitle className="text-sm font-medium">Connections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{workflow.edges.length}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Last Execution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">Never executed</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {workflow.description || 'No description provided.'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Workflow Diagram</CardTitle>
                </CardHeader>
                <CardContent className="h-64 flex items-center justify-center bg-gray-50 rounded-md">
                  <div className="text-center">
                    <GitBranch className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      Open the workflow builder to view and edit the workflow diagram.
                    </p>
                    <Button variant="outline" className="mt-4" asChild>
                      <Link to={`/workflows/builder?id=${workflow.id}`}>
                        Open Workflow Builder
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="executions">
              <Card>
                <CardHeader>
                  <CardTitle>Execution History</CardTitle>
                  <CardDescription>
                    View the history of workflow executions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      No executions yet. Execute the workflow to see results here.
                    </p>
                    <Button className="mt-4">
                      <Play className="h-4 w-4 mr-2" />
                      Execute Workflow
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Workflow Settings</CardTitle>
                  <CardDescription>
                    Configure settings for this workflow.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-1">Execution Mode</h3>
                      <select
                        id="execution-mode"
                        aria-label="Execution Mode"
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="sequential">Sequential</option>
                        <option value="parallel">Parallel</option>
                      </select>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-1">Error Handling</h3>
                      <select
                        id="error-handling"
                        aria-label="Error Handling"
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="stop">Stop on Error</option>
                        <option value="continue">Continue on Error</option>
                        <option value="retry">Retry on Error</option>
                      </select>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-1">Timeout (seconds)</h3>
                      <input
                        id="timeout"
                        type="number"
                        aria-label="Timeout in seconds"
                        className="w-full p-2 border rounded-md"
                        defaultValue={300}
                        min={1}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>Save Settings</Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <WorkflowAnalytics workflowId={workflow?.id || ''} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default WorkflowDetail;
