import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket.js';
import { Card, CardHeader, CardContent } from './ui/card.js';
import { Button } from './ui/button.js';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select.js';
import { Progress } from './ui/progress.js';
import { Alert } from './ui/alert.js';
import { Badge } from './ui/badge.js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog.js';

interface AgentWorkflow {
  id: string;
  name: string;
  status: 'running' | 'paused' | 'completed' | 'failed';
  progress: number;
  agentCount: number;
  type: 'analysis' | 'trading' | 'security' | 'content';
  metrics: {
    tasksCompleted: number;
    tasksRemaining: number;
    errorRate: number;
  };
  template?: string;
  startTime?: string;
  endTime?: string;
}

interface WorkflowTemplate {
  name: string;
  type: AgentWorkflow['type'];
  description: string;
  defaultAgentCount: number;
}

export function AgentWorkflowManager() {
  const [workflows, setWorkflows] = useState<AgentWorkflow[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedWorkflows, setSelectedWorkflows] = useState<Set<string>>(new Set());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const { subscribe, send } = useWebSocket();

  const templates: WorkflowTemplate[] = [
    {
      name: 'Data Analysis Pipeline',
      type: 'analysis',
      description: 'Standard data processing and analysis workflow',
      defaultAgentCount: 3
    },
    {
      name: 'Trading Strategy',
      type: 'trading',
      description: 'Automated trading workflow with market analysis',
      defaultAgentCount: 2
    },
    {
      name: 'Security Audit',
      type: 'security',
      description: 'Comprehensive security analysis workflow',
      defaultAgentCount: 4
    }
  ];

  useEffect(() => {
    const unsubscribe = subscribe('workflow_updates', (data: AgentWorkflow[]) => {
      setWorkflows(data);
    });

    send('get_workflows');

    return () => unsubscribe();
  }, [subscribe, send]);

  const handleWorkflowAction = (id: string, action: 'pause' | 'resume' | 'stop') => {
    send('workflow_action', { id, action });
  };

  const handleBatchAction = (action: 'pause' | 'resume' | 'stop') => {
    selectedWorkflows.forEach(id => {
      send('workflow_action', { id, action });
    });
    setSelectedWorkflows(new Set());
  };

  const handleCreateWorkflow = () => {
    const template = templates.find(t => t.name === selectedTemplate);
    if (template) {
      send('create_workflow', {
        template: template.name,
        type: template.type,
        agentCount: template.defaultAgentCount
      });
      setShowCreateDialog(false);
      setSelectedTemplate('');
    }
  };

  const toggleWorkflowSelection = (id: string) => {
    setSelectedWorkflows((prev: any) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const filteredWorkflows = selectedType === 'all' 
    ? workflows
    : workflows.filter(w => w.type === selectedType);

  const getStatusColor = (status: AgentWorkflow['status']) => {
    const colors = {
      running: 'bg-green-500',
      paused: 'bg-yellow-500',
      completed: 'bg-blue-500',
      failed: 'bg-red-500'
    };
    return colors[status];
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold">Agent Workflows</h3>
            <Button
              size="sm"
              onClick={() => setShowCreateDialog(true)}
            >
              Create Workflow
            </Button>
          </div>
          <div className="flex items-center space-x-4">
            {selectedWorkflows.size > 0 && (
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBatchAction('pause')}
                >
                  Pause Selected
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBatchAction('resume')}
                >
                  Resume Selected
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleBatchAction('stop')}
                >
                  Stop Selected
                </Button>
              </div>
            )}
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="analysis">Analysis</SelectItem>
                <SelectItem value="trading">Trading</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="content">Content</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredWorkflows.map((workflow) => (
            <div key={workflow.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedWorkflows.has(workflow.id)}
                    onChange={() => toggleWorkflowSelection(workflow.id)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <div>
                    <h4 className="font-medium">{workflow.name}</h4>
                    <div className="flex space-x-2 mt-1">
                      <Badge className={getStatusColor(workflow.status)}>
                        {workflow.status}
                      </Badge>
                      <Badge variant="outline">
                        {workflow.agentCount} agents
                      </Badge>
                      {workflow.template && (
                        <Badge variant="secondary">
                          {workflow.template}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-x-2">
                  {workflow.status === 'running' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleWorkflowAction(workflow.id, 'pause')}
                    >
                      Pause
                    </Button>
                  )}
                  {workflow.status === 'paused' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleWorkflowAction(workflow.id, 'resume')}
                    >
                      Resume
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleWorkflowAction(workflow.id, 'stop')}
                  >
                    Stop
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{workflow.progress}%</span>
                  </div>
                  <Progress value={workflow.progress} />
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {workflow.metrics.tasksCompleted}
                    </div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {workflow.metrics.tasksRemaining}
                    </div>
                    <div className="text-sm text-gray-600">Remaining</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {workflow.metrics.errorRate}%
                    </div>
                    <div className="text-sm text-gray-600">Error Rate</div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredWorkflows.length === 0 && (
            <Alert>No workflows found for the selected type.</Alert>
          )}
        </div>
      </CardContent>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Workflow</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map(templat(e: any) => (
                  <SelectItem key={template.name} value={template.name}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTemplate && (
              <div className="text-sm text-gray-600">
                {templates.find(t => t.name === selectedTemplate)?.description}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateWorkflow}
              disabled={!selectedTemplate}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}