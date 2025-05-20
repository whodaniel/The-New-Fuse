import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/core';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
const agentData = [
    {
        id: 1,
        name: 'Agent Smith',
        type: 'Task Manager',
        status: 'Active',
        tasks: 12,
    },
    {
        id: 2,
        name: 'Agent Johnson',
        type: 'Data Processor',
        status: 'Idle',
        tasks: 8,
    },
    {
        id: 3,
        name: 'Agent Brown',
        type: 'Communication',
        status: 'Active',
        tasks: 15,
    },
];
const Agents = () => {
    const navigate = useNavigate();
    return (<div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Agents</h2>
        <Button onClick={() => navigate('/dashboard/agents/new')}>
          <Plus className="mr-2 h-4 w-4"/> Add Agent
        </Button>
      </div>

      <div className="grid gap-6">
        {agentData.map((agent) => (<Card key={agent.id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate(`/dashboard/agents/${agent.id}`)}>
            <CardHeader>
              <CardTitle>{agent.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <p className="text-sm font-medium">{agent.type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <p className="text-sm font-medium">{agent.status}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Tasks</p>
                  <p className="text-sm font-medium">{agent.tasks}</p>
                </div>
              </div>
            </CardContent>
          </Card>))}
      </div>
    </div>);
};
export default Agents;
//# sourceMappingURL=Agents.js.map