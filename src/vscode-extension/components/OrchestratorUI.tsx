import * as React from 'react';
import { LLMOrchestrator } from '../llm-orchestrator.js';

export interface OrchestratorUIProps {
  orchestrator: LLMOrchestrator;
}

export const OrchestratorUI: React.FC<OrchestratorUIProps> = ({ orchestrator }) => {
  const [agents, setAgents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      setError(null);
      // Would implement agent loading logic here
      const registeredAgents = orchestrator.getRegisteredAgents();
      setAgents(registeredAgents || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading agents...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="orchestrator-ui">
      <h2>AI Agents</h2>
      {agents.length === 0 ? (
        <p>No agents registered</p>
      ) : (
        <ul className="agent-list">
          {agents.map(agent => (
            <li key={agent.id} className="agent-item">
              <span className="agent-name">{agent.name}</span>
              <span className="agent-status">{agent.status}</span>
              <span className="agent-version">v{agent.version}</span>
            </li>
          ))}
        </ul>
      )}
      <button onClick={loadAgents}>Refresh</button>
    </div>
  );
};

export default OrchestratorUI;
