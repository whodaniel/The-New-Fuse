import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui-components/src/core/card.jsx';
import { useWorkspace } from '@/hooks/useWorkspace';

const WorkspaceOverview = () => {
  const { loading, error } = useWorkspace();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-muted-foreground">Loading workspace...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-red-500">Error loading workspace: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Workspace Overview</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your workspace details
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common workspace operations</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/workspace/settings" className="text-primary hover:underline">
                  Update Workspace Settings
                </a>
              </li>
              <li>
                <a href="/workspace/members" className="text-primary hover:underline">
                  Manage Members
                </a>
              </li>
              <li>
                <a href="/workspace/analytics" className="text-primary hover:underline">
                  View Analytics
                </a>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorkspaceOverview;
