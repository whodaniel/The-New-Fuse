import React, { useEffect, useState } from 'react';
import { useWorkflowIntegration } from '../hooks/useWorkflowIntegration.js';
import { useWebSocket } from '../hooks/useWebSocket.js';
import { Agent } from '@the-new-fuse/core/entities/agent.entity';

interface CollaborationSession {
  id: string;
  participants: Agent[];
  activeWorkflows: string[];
  sharedContext: Record<string, any>;
}

export function CollaborativeWorkflow() {
  const [session, setSession] = useState<CollaborationSession | null>(null);
  const { subscribe, send } = useWebSocket();
  const { startWorkflow, stopWorkflow } = useWorkflowIntegration();

  useEffect(() => {
    const subscriptions = [
      subscribe('session_update', (sessionData: CollaborationSession) => {
        setSession(sessionData);
      }),

      subscribe('participant_joined', (agent: Agent) => {
        setSession((prev: any) => prev ? {
          ...prev,
          participants: [...prev.participants, agent]
        } : null);
      }),

      subscribe('participant_left', (agentId: string) => {
        setSession((prev: any) => prev ? {
          ...prev,
          participants: prev.participants.filter(p => p.id !== agentId)
        } : null);
      })
    ];

    // Initialize session
    send('join_session', {
      capabilities: ['data-analysis', 'visualization', 'statistics']
    });

    return () => {
      subscriptions.forEach(unsubscrib(e: any) => unsubscribe());
      send('leave_session');
    };
  }, [subscribe, send]);

  const handleStartCollaboration = async () => {
    if (!session) return;

    try {
      const workflow = await startWorkflow({
        type: 'collaborative',
        participants: session.participants.map(p => p.id),
        context: session.sharedContext
      });

      send('workflow_started', { workflowId: workflow.id });
    } catch (error) {
      console.error('Failed to start collaborative workflow:', error);
    }
  };

  if (!session) {
    return <div>Connecting to session...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">
          Collaborative Session: {session.id}
        </h2>

        <div className="mb-6">
          <h3 className="font-medium mb-2">Participants</h3>
          <div className="grid grid-cols-2 gap-4">
            {session.participants.map(agent => (
              <div
                key={agent.id}
                className="border rounded p-3 flex items-center"
              >
                <div className="flex-1">
                  <div className="font-medium">{agent.name}</div>
                  <div className="text-sm text-gray-500">
                    {agent.capabilities.join(', ')}
                  </div>
                </div>
                <div className="h-3 w-3 rounded-full bg-green-500" />
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-medium mb-2">Active Workflows</h3>
          <div className="space-y-2">
            {session.activeWorkflows.map(workflowId => (
              <div
                key={workflowId}
                className="flex items-center justify-between border rounded p-3"
              >
                <span>{workflowId}</span>
                <button
                  className="text-red-500 hover:text-red-700"
                  onClick={() => stopWorkflow(workflowId)}
                >
                  Stop
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={handleStartCollaboration}
        >
          Start Collaborative Workflow
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-medium mb-2">Shared Context</h3>
        <pre className="bg-gray-100 p-4 rounded">
          {JSON.stringify(session.sharedContext, null, 2)}
        </pre>
      </div>
    </div>
  );
}