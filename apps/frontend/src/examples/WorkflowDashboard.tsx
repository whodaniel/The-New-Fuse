import React from 'react';
import { ConnectionManager } from '../components/ConnectionManager.js';
import { StatusMonitor } from '../components/StatusMonitor.js';
import { ActivityFeed } from '../components/ActivityFeed.js';
import { AgentWorkflowManager } from '../components/AgentWorkflowManager.js';

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