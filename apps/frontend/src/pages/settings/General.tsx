// @ts-nocheck
import { WorkspaceApiService, type WorkspaceProject } from '@/api/workspace';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useEffect, useMemo, useState } from 'react';

function formatDate(value?: string): string {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

export default function General() {
  const workspaceApi = useMemo(() => new WorkspaceApiService(), []);
  const { loading, error, currentWorkspace, workspaces } = useWorkspace();
  const [projects, setProjects] = useState<WorkspaceProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    async function loadProjects() {
      if (!currentWorkspace?.id) {
        setProjects([]);
        return;
      }
      setProjectsLoading(true);
      const response = await workspaceApi.getWorkspaceProjects(currentWorkspace.id);
      if (!isCancelled) {
        setProjects(response.success && Array.isArray(response.data) ? response.data : []);
        setProjectsLoading(false);
      }
    }
    loadProjects();
    return () => {
      isCancelled = true;
    };
  }, [currentWorkspace?.id, workspaceApi]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">General Settings</h3>
        <p className="text-sm text-muted-foreground">Configure your general preferences</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Your name" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="Your email" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal Workspaces</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && (
            <p className="text-sm text-muted-foreground">
              Loading your workspace and project data...
            </p>
          )}
          {!loading && error && (
            <p className="text-sm text-red-500">
              Unable to load personal workspaces: {error.message}
            </p>
          )}
          {!loading && !error && (
            <>
              <div className="rounded-md border border-slate-200 dark:border-slate-800 p-3">
                <p className="text-sm font-medium">Current Workspace</p>
                <p className="text-sm text-muted-foreground">
                  {currentWorkspace?.name || 'No workspace selected'}
                </p>
              </div>
              <div className="rounded-md border border-slate-200 dark:border-slate-800 p-3">
                <p className="text-sm font-medium">
                  Accessible Workspaces ({Array.isArray(workspaces) ? workspaces.length : 0})
                </p>
                {Array.isArray(workspaces) && workspaces.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {workspaces.map((workspace) => (
                      <li key={workspace.id}>
                        {workspace.name}
                        {workspace.id === currentWorkspace?.id ? ' (active)' : ''}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No personal workspaces found yet.
                  </p>
                )}
              </div>
              <div className="rounded-md border border-slate-200 dark:border-slate-800 p-3">
                <p className="text-sm font-medium">Projects in Active Workspace</p>
                {projectsLoading ? (
                  <p className="mt-2 text-sm text-muted-foreground">Loading projects...</p>
                ) : projects.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No projects found in the active workspace.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-2 text-sm">
                    {projects.map((project) => (
                      <li
                        key={project.id}
                        className="rounded border border-slate-200 dark:border-slate-800 p-2"
                      >
                        <p className="font-medium">{project.name}</p>
                        {project.description ? (
                          <p className="text-muted-foreground">{project.description}</p>
                        ) : null}
                        <p className="text-xs text-muted-foreground mt-1">
                          Updated {formatDate(project.updatedAt || project.createdAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
