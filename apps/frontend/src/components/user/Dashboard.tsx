import { Card } from '@/components/ui/card';
import { useEffect } from 'react';
import { AgentCollaborationDashboard } from '../agent-collaboration-dashboard';
import { AgentNetwork } from '../agent-network';
import { PerformanceMetrics } from '../performance-metrics';
import { useRoute } from '../route-context';
import { SystemMetrics } from '../system-metrics';
import { TaskBoard } from '../task-board';

export default function Dashboard() {
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
          <AgentNetwork agents={[]} tasks={[]} onNodeClick={() => {}} />
        </Card>
      </div>
    </div>
  );
}
