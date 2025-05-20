import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {agent.name}
            <AgentStatus status={agent.status} className="ml-2" variant={getStatusBadgeVariant(agent.status)}/>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Agent Information</CardTitle>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>
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
        </CardContent>
      </Card>
    </div>);
};
export default AgentDetails;
//# sourceMappingURL=%5Bid%5D.js.map