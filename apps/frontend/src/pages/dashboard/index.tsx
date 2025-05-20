import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Bot, Zap, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
const Dashboard = () => {
    const navigate = useNavigate();
    const quickActions = [
        {
            title: 'Create New Agent',
            description: 'Build a new AI agent with custom capabilities',
            icon: Bot,
            action: () => navigate('/agents/new')
        },
        {
            title: 'View Analytics',
            description: 'Monitor your system performance and usage',
            icon: Zap,
            action: () => navigate('/analytics')
        },
        {
            title: 'Manage Team',
            description: 'Add or remove team members and manage permissions',
            icon: Users,
            action: () => navigate('/workspace/members')
        }
    ];
    return (<div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Welcome back!</h1>
              <p className="text-muted-foreground">Here's what's happening with your agents</p>
            </div>
            <Button onClick={() => navigate('/agents/new')}>
              <Plus className="mr-2 h-4 w-4"/> New Agent
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Active Agents</h3>
              <p className="text-3xl font-bold">12</p>
              <p className="text-sm text-muted-foreground">+2 from last week</p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Total Interactions</h3>
              <p className="text-3xl font-bold">1,234</p>
              <p className="text-sm text-muted-foreground">+15% from last month</p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Success Rate</h3>
              <p className="text-3xl font-bold">98.5%</p>
              <p className="text-sm text-muted-foreground">+0.5% from last week</p>
            </Card>
          </div>

          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {quickActions.map((action) => (<Card key={action.title} className="p-6 cursor-pointer hover:bg-accent transition-colors" onClick={action.action}>
                <div className="flex items-center mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <action.icon className="h-6 w-6 text-primary"/>
                  </div>
                </div>
                <h3 className="font-semibold mb-2">{action.title}</h3>
                <p className="text-sm text-muted-foreground">{action.description}</p>
              </Card>))}
          </div>
        </div>
      </main>
    </div>);
};
export default Dashboard;
//# sourceMappingURL=index.js.map