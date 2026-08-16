import { useCallback, useState } from 'react';
import { Agent } from '../../types/federation';

interface AgentOrchestratorProps {
  agents: Map<string, Agent>;
  onExecuteAction: (action: any) => Promise<any>;
  connected: boolean;
}

interface TaskProposal {
  id: string;
  title: string;
  description: string;
  requiredCapabilities: string[];
  priority: 'high' | 'medium' | 'low';
  estimatedTime: string;
}

const COMMON_TASKS: TaskProposal[] = [
  {
    id: 'research-001',
    title: 'Research Query',
    description: 'Conduct research on a given topic using available agents',
    requiredCapabilities: ['researcher', 'contextual-model-implementation-architect'],
    priority: 'medium',
    estimatedTime: '5-10 min',
  },
  {
    id: 'code-001',
    title: 'Code Generation',
    description: 'Generate code for a specific task',
    requiredCapabilities: ['code_generation', 'typescript'],
    priority: 'high',
    estimatedTime: '2-15 min',
  },
  {
    id: 'browser-001',
    title: 'Browser Automation',
    description: 'Automate browser tasks with verification',
    requiredCapabilities: ['browser-control', 'agent-browser'],
    priority: 'high',
    estimatedTime: '1-5 min',
  },
  {
    id: 'analysis-001',
    title: 'Data Analysis',
    description: 'Analyze data and generate insights',
    requiredCapabilities: ['analyst', 'data_analysis'],
    priority: 'medium',
    estimatedTime: '5-20 min',
  },
];

export function AgentOrchestrator({ agents, onExecuteAction, connected }: AgentOrchestratorProps) {
  const [selectedTask, setSelectedTask] = useState<TaskProposal | null>(null);
  const [taskArgs, setTaskArgs] = useState<Record<string, any>>({});

  const handleExecuteTask = useCallback(async () => {
    if (!selectedTask) return;

    try {
      await onExecuteAction({
        type: 'delegate_task',
        task: selectedTask,
        arguments: taskArgs,
        governanceCheck: true,
      });
    } catch (error) {
      console.error('[AgentOrchestrator] Task execution failed:', error);
    }
  }, [selectedTask, taskArgs, onExecuteAction]);

  const agentList = Array.from(agents.values());

  return (
    <div className="tnf-agent-orchestrator">
      <div className="orchestrator-header">
        <h3>🤖 Agent Orchestration</h3>
        <div className="status-badge connected">Online</div>
      </div>

      {connected ? (
        <>
          <div className="connected-agents">
            <h4>Connected Agents ({agentList.length})</h4>
            {agentList.length === 0 ? (
              <p>No agents connected to the federation</p>
            ) : (
              <div className="agent-grid">
                {agentList.map((agent) => (
                  <div key={agent.id} className="agent-card">
                    <div className="agent-avatar">{agent.name.charAt(0)}</div>
                    <div className="agent-info">
                      <h5>{agent.name}</h5>
                      <p className="agent-role">{agent.daccRole}</p>
                      <p className="agent-platform">{agent.platform}</p>
                    </div>
                    <div className="agent-actions">
                      <button
                        onClick={() => navigator.clipboard.writeText(agent.id)}
                        className="btn-icon"
                        title="Copy Agent ID"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="task-proposals">
            <h4>Task Proposals</h4>
            <div className="task-grid">
              {COMMON_TASKS.map((task) => (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className={`task-card ${selectedTask?.id === task.id ? 'selected' : ''}`}
                >
                  <h5>{task.title}</h5>
                  <p>{task.description}</p>
                  <div className="task-meta">
                    <span>⏱️ {task.estimatedTime}</span>
                    <span>Priority: {task.priority}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedTask && (
            <div className="task-config">
              <h4>Configure: {selectedTask.title}</h4>
              <textarea
                placeholder="Enter task arguments as JSON..."
                defaultValue={JSON.stringify({ topic: 'Enter search topic...' }, null, 2)}
                className="task-args-input"
              />
              <div className="task-actions">
                <button onClick={handleExecuteTask} className="btn btn-primary">
                  Execute with Fleet
                </button>
                <button onClick={() => setSelectedTask(null)} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="disconnected-message">
          <p>Connect to the federation relay to use agent orchestration</p>
        </div>
      )}
    </div>
  );
}
