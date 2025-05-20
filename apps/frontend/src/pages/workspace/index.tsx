import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { WorkspaceLayout } from './WorkspaceLayout.js';
import { useWorkspace } from '@/hooks/useWorkspace';
import WorkspaceOverview from './Overview.js';
import WorkspaceSettings from './Settings.js';
import WorkspaceMembers from './Members.js';
import WorkspaceAnalytics from './Analytics.js';
const WorkspaceRoutes = () => {
    const { workspaces, createWorkspace } = useWorkspace();
    if (!(workspaces === null || workspaces === void 0 ? void 0 : workspaces.length)) {
        return (<div className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Create your first workspace</h1>
            <p className="text-muted-foreground">
              Get started by creating a workspace to organize your agents and tasks.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>No workspaces found</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={createWorkspace} className="w-full">
                <Plus className="mr-2 h-4 w-4"/>
                Create Workspace
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>);
    }
    return (<Routes>
      <Route path="/" element={<Navigate to={workspaces[0].id} replace/>}/>
      <Route path=":workspaceId" element={<WorkspaceLayout />}>
        <Route index element={<Navigate to="overview" replace/>}/>
        <Route path="overview" element={<WorkspaceOverview />}/>
        <Route path="members" element={<WorkspaceMembers />}/>
        <Route path="analytics" element={<WorkspaceAnalytics />}/>
        <Route path="settings" element={<WorkspaceSettings />}/>
      </Route>
    </Routes>);
};
export default WorkspaceRoutes;
//# sourceMappingURL=index.js.map