// @ts-nocheck
import { Label } from '@/components/ui';
import { Sidebar } from '@/components/layout/Sidebar';
import {
  ActionCard,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  GlassCard,
  PremiumButton,
  PremiumInput,
  PremiumTextarea,
} from '@/components/ui';
import { useWorkflow } from '@/hooks';
import {
  Activity,
  Calendar,
  Clock,
  Edit,
  MoreHorizontal,
  Play,
  Plus,
  Search,
  Trash2,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

/**
 * Workflows page component
 */
const WorkflowsPage: React.FC = () => {
  const navigate = useNavigate();
  const { workflows, loading, error, loadWorkflows, createWorkflow, deleteWorkflow } =
    useWorkflow();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowDescription, setNewWorkflowDescription] = useState('');

  // Load workflows on mount
  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  // Filter workflows based on search query
  const filteredWorkflows = workflows.filter(
    (workflow) =>
      workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (workflow.description &&
        workflow.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handle create workflow
  const handleCreateWorkflow = () => {
    if (!newWorkflowName.trim()) return;

    const workflow = createWorkflow(newWorkflowName, newWorkflowDescription);
    setIsCreateDialogOpen(false);
    setNewWorkflowName('');
    setNewWorkflowDescription('');

    // Navigate to the workflow builder
    navigate(`/workflows/builder?id=${workflow.id}`);
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="container mx-auto py-6 space-y-6 animate-fade-in">
          <div className="flex justify-between items-center animate-slide-in-down">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Intelligence Orchestration
              </h1>
              <p className="text-slate-300 mt-2">Create and manage your intelligent workflows</p>
            </div>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <PremiumButton size="lg" variant="gradient">
                  <Zap className="h-4 w-4 mr-2" />
                  Orchestrate New Intelligence
                </PremiumButton>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-2xl text-white">Create New Workflow</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Create a new workflow to automate your tasks.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">
                      Name
                    </Label>
                    <PremiumInput
                      id="name"
                      value={newWorkflowName}
                      onChange={(e) => setNewWorkflowName(e.target.value)}
                      placeholder="My Workflow"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-white">
                      Description
                    </Label>
                    <PremiumTextarea
                      id="description"
                      value={newWorkflowDescription}
                      onChange={(e) => setNewWorkflowDescription(e.target.value)}
                      placeholder="Describe what this workflow does"
                      rows={3}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <PremiumButton variant="secondary" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </PremiumButton>
                  <PremiumButton variant="gradient" onClick={handleCreateWorkflow}>
                    Create
                  </PremiumButton>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <GlassCard className="animate-slide-in-up">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <PremiumInput
                  icon={<Search className="h-4 w-4" />}
                  placeholder="Search workflows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </GlassCard>

          {loading ? (
            <GlassCard className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </GlassCard>
          ) : error ? (
            <GlassCard className="bg-red-500/10 border-red-500/30">
              <div className="text-red-300 px-4 py-2">{error.message}</div>
            </GlassCard>
          ) : filteredWorkflows.length === 0 ? (
            <GlassCard className="flex flex-col items-center justify-center h-64 text-center">
              <div className="text-slate-400 mb-4">
                {searchQuery ? 'No workflows match your search' : 'No workflows yet'}
              </div>
              {!searchQuery && (
                <PremiumButton onClick={() => setIsCreateDialogOpen(true)} variant="gradient">
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first workflow
                </PremiumButton>
              )}
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-slide-in-up">
              {filteredWorkflows.map((workflow) => (
                <ActionCard
                  key={workflow.id}
                  title={workflow.name}
                  description={workflow.description || 'No description'}
                  icon={<Activity className="w-5 h-5" />}
                  gradient="from-purple-500 to-pink-500"
                >
                  <div className="space-y-3 mt-4">
                    <div className="flex items-center text-sm text-slate-400">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Created: {formatDate(workflow.createdAt)}</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-400">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>Updated: {formatDate(workflow.updatedAt)}</span>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <PremiumButton variant="secondary" size="sm" className="flex-1" asChild>
                        <Link to={`/workflows/builder?id=${workflow.id}`}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Link>
                      </PremiumButton>

                      <PremiumButton variant="gradient" size="sm" className="flex-1">
                        <Play className="h-4 w-4 mr-1" />
                        Run
                      </PremiumButton>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <PremiumButton variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </PremiumButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
                          <DropdownMenuLabel className="text-white">Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-slate-700" />
                          <DropdownMenuItem className="text-slate-300 hover:bg-slate-800">
                            <Link
                              to={`/workflows/builder?id=${workflow.id}`}
                              className="flex items-center w-full"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-slate-300 hover:bg-slate-800">
                            <Play className="h-4 w-4 mr-2" />
                            Run
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-slate-300 hover:bg-slate-800">
                            <Calendar className="h-4 w-4 mr-2" />
                            View History
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-700" />
                          <DropdownMenuItem
                            className="text-red-400 hover:bg-red-500/10"
                            onClick={() => deleteWorkflow(workflow.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </ActionCard>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default WorkflowsPage;
