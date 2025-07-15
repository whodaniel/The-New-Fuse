import React, { useState, useEffect, useCallback, forwardRef } from 'react';
import ReactFlow, {
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Background,
  Controls,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Type definitions
type WorkflowNode = {
  id: string;
  type: 'agent' | 'trigger' | 'action' | 'condition' | 'output';
  data: {
    label: string;
    config: Record<string, any>;
  };
  position: {
    x: number;
    y: number;
  };
};

type Workflow = {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: Array<{
    id: string;
    source: string;
    target: string;
    type?: 'default' | 'success' | 'failure';
    animated?: boolean;
    label?: string;
  }>;
  status: 'draft' | 'active' | 'paused' | 'error';
  createdAt: string;
  updatedAt: string;
};

interface WorkflowEditorProps {
  workflow: Workflow;
  onChange?: (workflow: Workflow) => void;
  onSave?: (workflow: Workflow) => void;
}

interface WorkflowListProps {
  workflows: Workflow[];
  onSelect: (workflow: Workflow) => void;
  onDelete: (workflowId: string) => void;
}

// Node components
const AgentNode: React.FC<{ data: WorkflowNode['data'] }> = ({ data }) => (
  <div className="px-4 py-2 shadow-lg rounded-md bg-white border-2 border-primary">
    <div className="flex items-center">
      <div className="w-3 h-3 rounded-full bg-primary mr-2" />
      <div className="font-bold">{data.label}</div>
    </div>
    {Object.entries(data.config).map(([key, value]) => (
      <div key={key} className="mt-2 text-sm">
        <span className="font-medium">{key}:</span> {String(value)}
      </div>
    ))}
  </div>
);

const TriggerNode: React.FC<{ data: WorkflowNode['data'] }> = ({ data }) => (
  <div className="px-4 py-2 shadow-lg rounded-md bg-white border-2 border-green-500">
    <div className="flex items-center">
      <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />
      <div className="font-bold">{data.label}</div>
    </div>
    <div className="mt-2 text-sm">Event: {data.config.event}</div>
  </div>
);

const ActionNode: React.FC<{ data: WorkflowNode['data'] }> = ({ data }) => (
  <div className="px-4 py-2 shadow-lg rounded-md bg-white border-2 border-blue-500">
    <div className="flex items-center">
      <div className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
      <div className="font-bold">{data.label}</div>
    </div>
    <div className="mt-2 text-sm">Action: {data.config.action}</div>
  </div>
);

const ConditionNode: React.FC<{ data: WorkflowNode['data'] }> = ({ data }) => (
  <div className="px-4 py-2 shadow-lg rounded-md bg-white border-2 border-yellow-500">
    <div className="flex items-center">
      <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2" />
      <div className="font-bold">{data.label}</div>
    </div>
    <div className="mt-2 text-sm">Condition: {data.config.condition}</div>
  </div>
);

const OutputNode: React.FC<{ data: WorkflowNode['data'] }> = ({ data }) => (
  <div className="px-4 py-2 shadow-lg rounded-md bg-white border-2 border-purple-500">
    <div className="flex items-center">
      <div className="w-3 h-3 rounded-full bg-purple-500 mr-2" />
      <div className="font-bold">{data.label}</div>
    </div>
    <div className="mt-2 text-sm">Output: {data.config.output}</div>
  </div>
);

const nodeTypes = {
  agent: AgentNode,
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  output: OutputNode,
};

// Workflow Editor Component
export const WorkflowEditor = forwardRef<HTMLDivElement, WorkflowEditorProps>(
  ({ workflow, onChange, onSave }, ref) => {
    const [nodes, , onNodesChange] = useNodesState(workflow.nodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(workflow.edges);

    const onConnect = useCallback(
      (params: Connection) => setEdges((eds) => addEdge(params, eds)),
      [setEdges]
    );

    const handleSave = async () => {
      try {
        const updatedWorkflow = {
          ...workflow,
          nodes,
          edges,
          updatedAt: new Date().toISOString(),
        };
        
        // In a real app, this would be an API call
        console.log('Saving workflow:', updatedWorkflow);
        
        onSave?.(updatedWorkflow);
      } catch (error) {
        console.error('Failed to save workflow:', error);
      }
    };

    useEffect(() => {
      onChange?.({ ...workflow, nodes, edges });
    }, [nodes, edges, onChange, workflow]);

    return (
      <div ref={ref} className="h-[600px] border rounded-lg">
        <div className="h-12 border-b flex items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                workflow.status === 'active'
                  ? 'bg-green-500'
                  : workflow.status === 'error'
                  ? 'bg-red-500'
                  : 'bg-yellow-500'
              }`}
            />
            <span className="font-medium">{workflow.name}</span>
          </div>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Save Workflow
          </button>
        </div>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    );
  }
);

WorkflowEditor.displayName = 'WorkflowEditor';

// Workflow List Component
export const WorkflowList: React.FC<WorkflowListProps> = ({ workflows, onSelect, onDelete }) => {
  const handleDelete = async (workflow: Workflow) => {
    if (window.confirm(`Are you sure you want to delete "${workflow.name}"?`)) {
      try {
        // In a real app, this would be an API call
        console.log('Deleting workflow:', workflow.id);
        onDelete(workflow.id);
      } catch (error) {
        console.error('Failed to delete workflow:', error);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Workflows</h2>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
          Create New Workflow
        </button>
      </div>
      
      <div className="grid gap-4">
        {workflows.map((workflow) => (
          <div
            key={workflow.id}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onSelect(workflow)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{workflow.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{workflow.description}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-sm text-muted-foreground">
                    {workflow.nodes.length} nodes
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {workflow.edges.length} connections
                  </span>
                  <span
                    className={`text-sm px-2 py-1 rounded-full ${
                      workflow.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : workflow.status === 'error'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {workflow.status}
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(workflow);
                }}
                className="text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Workflow Module Component
export const WorkflowModule: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      setIsLoading(true);
      // In a real app, this would be an API call
      const mockWorkflows: Workflow[] = [
        {
          id: '1',
          name: 'Customer Onboarding',
          description: 'Automated customer onboarding workflow',
          status: 'active',
          nodes: [
            {
              id: '1',
              type: 'trigger',
              data: { label: 'New Customer', config: { event: 'customer_signup' } },
              position: { x: 0, y: 0 },
            },
            {
              id: '2',
              type: 'action',
              data: { label: 'Send Welcome Email', config: { action: 'send_email' } },
              position: { x: 200, y: 0 },
            },
          ],
          edges: [{ id: '1-2', source: '1', target: '2' }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Lead Qualification',
          description: 'Qualify and route new leads',
          status: 'draft',
          nodes: [
            {
              id: '1',
              type: 'trigger',
              data: { label: 'New Lead', config: { event: 'lead_created' } },
              position: { x: 0, y: 0 },
            },
            {
              id: '2',
              type: 'condition',
              data: { label: 'Qualify Lead', config: { condition: 'score > 70' } },
              position: { x: 200, y: 0 },
            },
          ],
          edges: [{ id: '1-2', source: '1', target: '2' }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      
      setWorkflows(mockWorkflows);
    } catch (error) {
      console.error('Failed to load workflows:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkflowUpdate = (updatedWorkflow: Workflow) => {
    setWorkflows((prev) =>
      prev.map((w) => (w.id === updatedWorkflow.id ? updatedWorkflow : w))
    );
  };

  const handleWorkflowDelete = (workflowId: string) => {
    setWorkflows((prev) => prev.filter((w) => w.id !== workflowId));
    if (selectedWorkflow?.id === workflowId) {
      setSelectedWorkflow(null);
    }
  };

  const handleWorkflowSave = (updatedWorkflow: Workflow) => {
    handleWorkflowUpdate(updatedWorkflow);
    setSelectedWorkflow(updatedWorkflow);
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading workflows...</div>;
  }

  return (
    <div className="p-6">
      {selectedWorkflow ? (
        <div>
          <button
            onClick={() => setSelectedWorkflow(null)}
            className="mb-4 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
          >
            ← Back to Workflows
          </button>
          <WorkflowEditor
            workflow={selectedWorkflow}
            onChange={handleWorkflowUpdate}
            onSave={handleWorkflowSave}
          />
        </div>
      ) : (
        <WorkflowList
          workflows={workflows}
          onSelect={setSelectedWorkflow}
          onDelete={handleWorkflowDelete}
        />
      )}
    </div>
  );
};

export default WorkflowModule;
