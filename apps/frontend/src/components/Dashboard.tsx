import { useEffect } from 'react';
import { useRoute } from '@/contexts/route-context';
import { Card } from '@/components/ui/card';
import { AgentCollaborationDashboard } from '@/components/AgentCollaborationDashboard';
import { SystemMetrics } from '@/components/SystemMetrics';
import { PerformanceMetrics } from '@/components/PerformanceMetrics';
import { TaskBoard } from '@/components/TaskBoard';
import { AgentNetwork } from '@/components/AgentNetwork';

export function Dashboard() {
  const { setPageTitle } = useRoute();

  useEffect(() => {
    setPageTitle('Dashboard');
  }, [setPageTitle]);

  return (
    <div className="grid gap-6">
      <Card className="p-6">
        <AgentCollaborationDashboard />
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <SystemMetrics />
        </Card>
        <Card className="p-6">
          <PerformanceMetrics />
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6 md:col-span-2">
          <TaskBoard />
        </Card>
        <Card className="p-6">
          <AgentNetwork />
        </Card>
      </div>
    </div>
  );
}