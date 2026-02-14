import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { GlassCard } from '@/components/ui/premium';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAgent } from '@/hooks/useAgent';
import AgentStatus from '@/components/agents/AgentStatus';
import AgentLogs from '@/components/agents/AgentLogs';
import AgentSettings from '@/components/agents/AgentSettings';
import AgentTasks from '@/components/agents/AgentTasks';
const AgentDetails = () => {
    const { id } = useParams();
    const { agent, loading, error } = useAgent(id);
    const [activeTab, setActiveTab] = useState('overview');
    const getStatusBadgeVariant = (status) => {
        switch (status) {
            case "online":
                return "success";
            case "offline":
                return "error";
            case "busy":
                return "warning";
            default:
                return "error";
        }
    };
    if (loading) {
        return <div>Loading...</div>;
    }
    if (error || !agent) {
        return <div>Error loading agent details</div>;
    }
    return (<div className="container mx-auto p-6">
      <GlassCard title={agent.name} className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid gap-4">
                <GlassCard title="Agent Information">
                    <dl className="grid grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Type</dt>
                        <dd className="text-lg">{agent.type}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Created</dt>
                        <dd className="text-lg">
                          {new Date(agent.createdAt).toLocaleDateString()}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Last Active</dt>
                        <dd className="text-lg">
                          {new Date(agent.lastActiveAt).toLocaleDateString()}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Tasks Completed</dt>
                        <dd className="text-lg">{agent.tasksCompleted}</dd>
                      </div>
                    </dl>
                </GlassCard>
              </div>
            </TabsContent>

            <TabsContent value="tasks">
              <AgentTasks agentId={agent.id}/>
            </TabsContent>

            <TabsContent value="logs">
              <AgentLogs agentId={agent.id}/>
            </TabsContent>

            <TabsContent value="settings">
              <AgentSettings agent={agent}/>
            </TabsContent>
          </Tabs>
      </GlassCard>
    </div>);
};
export default AgentDetails;
