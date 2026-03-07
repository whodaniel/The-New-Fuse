// @ts-nocheck
import { ActivityFeed } from '../components/ActivityFeed';
import { AgentWorkflowManager } from '../components/AgentWorkflowManager';
import { ConnectionManager } from '../components/ConnectionManager';
import { StatusMonitor } from '../components/StatusMonitor';

export function WorkflowDashboard() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Workflow Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Status Section */}
        <div className="space-y-6">
          <StatusMonitor />
          <ConnectionManager />
        </div>

        {/* Workflow Section */}
        <div className="space-y-6">
          <AgentWorkflowManager />
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
