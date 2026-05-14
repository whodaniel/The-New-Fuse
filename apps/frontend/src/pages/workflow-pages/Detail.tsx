// @ts-nocheck
import {
  PremiumButton as Button,
  GlassCard,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
import WorkflowAnalytics from '@/components/workflow/WorkflowAnalytics';
import { useWorkflow, Workflow } from '@/hooks';
import { ChevronLeft, Clock, Edit, GitBranch, Play } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

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
      const foundWorkflow = workflows.find((w) => w.id === id);
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
      minute: 'numeric',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md">
          {error.message}
        </div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-2 rounded-md">
          Workflow not found. The workflow may have been deleted or you may not have access to it.
        </div>
        <div className="mt-4">
          <Button variant="outline" onClick={() => navigate('/workflows')}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Workflows
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={() => navigate('/workflows')} className="mr-4">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{workflow.name}</h1>
            <p className="text-muted-foreground">
              Created {formatDate(workflow.createdAt)} • Updated {formatDate(workflow.updatedAt)}
            </p>
          </div>
        </div>

        <div className="flex space-x-2">
          <Link to={`/workflows/builder?id=${workflow.id}`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button variant="primary">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GlassCard title="Nodes" gradient="blue">
              <div className="text-2xl font-bold text-white">{workflow.nodes.length}</div>
            </GlassCard>

            <GlassCard title="Connections" gradient="purple">
              <div className="text-2xl font-bold text-white">{workflow.edges.length}</div>
            </GlassCard>

            <GlassCard title="Last Execution" gradient="cyan">
              <div className="text-sm text-gray-400">Never executed</div>
            </GlassCard>
          </div>

          <GlassCard title="Description" gradient="green">
            <p className="text-gray-300">{workflow.description || 'No description provided.'}</p>
          </GlassCard>

          <GlassCard title="Workflow Diagram" gradient="orange">
            <div className="h-64 flex items-center justify-center bg-black/20 rounded-md">
              <div className="text-center">
                <GitBranch className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-gray-400">
                  Open the workflow builder to view and edit the workflow diagram.
                </p>
                <Link to={`/workflows/builder?id=${workflow.id}`}>
                  <Button variant="outline" className="mt-4">
                    Open Workflow Builder
                  </Button>
                </Link>
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="executions">
          <GlassCard
            title="Execution History"
            subtitle="View the history of workflow executions."
            gradient="blue"
          >
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-gray-400">
                No executions yet. Execute the workflow to see results here.
              </p>
              <Button variant="primary" className="mt-4">
                <Play className="h-4 w-4 mr-2" />
                Execute Workflow
              </Button>
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="settings">
          <GlassCard
            title="Workflow Settings"
            subtitle="Configure settings for this workflow."
            gradient="purple"
          >
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-white mb-1">Execution Mode</h3>
                <select
                  id="execution-mode"
                  aria-label="Execution Mode"
                  className="w-full p-2 border border-white/10 rounded-md bg-black/20 text-white"
                >
                  <option value="sequential">Sequential</option>
                  <option value="parallel">Parallel</option>
                </select>
              </div>

              <div>
                <h3 className="text-sm font-medium text-white mb-1">Error Handling</h3>
                <select
                  id="error-handling"
                  aria-label="Error Handling"
                  className="w-full p-2 border border-white/10 rounded-md bg-black/20 text-white"
                >
                  <option value="stop">Stop on Error</option>
                  <option value="continue">Continue on Error</option>
                  <option value="retry">Retry on Error</option>
                </select>
              </div>

              <div>
                <h3 className="text-sm font-medium text-white mb-1">Timeout (seconds)</h3>
                <input
                  id="timeout"
                  type="number"
                  aria-label="Timeout in seconds"
                  className="w-full p-2 border border-white/10 rounded-md bg-black/20 text-white"
                  defaultValue={300}
                  min={1}
                />
              </div>

              <div className="pt-4">
                <Button variant="primary">Save Settings</Button>
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <WorkflowAnalytics workflowId={workflow?.id || ''} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkflowDetail;
