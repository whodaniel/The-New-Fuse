import { GlassCard, PremiumButton } from '@/components/ui/premium';
import { useWorkspace } from '@/hooks/useWorkspace';
import { Plus } from 'lucide-react';
import { Navigate, Route, Routes } from 'react-router-dom';
import WorkspaceAnalytics from './Analytics';
import WorkspaceMembers from './Members';
import WorkspaceOverview from './Overview';
import WorkspaceSettings from './Settings';
import { WorkspaceLayout } from './WorkspaceLayout';
const WorkspaceRoutes = () => {
  const { workspaces, createWorkspace } = useWorkspace();
  if (!(workspaces === null || workspaces === void 0 ? void 0 : workspaces.length)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Create your first workspace</h1>
            <p className="text-muted-foreground">
              Get started by creating a workspace to organize your agents and tasks.
            </p>
          </div>

          <GlassCard title="No workspaces found">
            <PremiumButton onClick={createWorkspace} fullWidth>
              <Plus className="mr-2 h-4 w-4" />
              Create Workspace
            </PremiumButton>
          </GlassCard>
        </div>
      </div>
    );
  }
  return (
    <Routes>
      <Route path="/" element={<Navigate to={workspaces[0].id} replace />} />
      <Route path=":workspaceId" element={<WorkspaceLayout />}>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<WorkspaceOverview />} />
        <Route path="members" element={<WorkspaceMembers />} />
        <Route path="analytics" element={<WorkspaceAnalytics />} />
        <Route path="settings" element={<WorkspaceSettings />} />
      </Route>
    </Routes>
  );
};
export default WorkspaceRoutes;
