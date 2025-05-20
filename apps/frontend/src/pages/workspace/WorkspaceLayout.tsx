import React from 'react';
import { Outlet, NavLink, useParams } from 'react-router-dom';
import { BarChart, Settings, Users, Home, ChevronDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorkspace } from '@/hooks/useWorkspace';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, } from '@/components/ui/dropdown-menu';
export const WorkspaceLayout = () => {
    const { workspaceId } = useParams();
    const { workspaces, currentWorkspace, selectWorkspace, createWorkspace } = useWorkspace();
    const navItems = [
        { icon: Home, label: 'Overview', to: 'overview' },
        { icon: Users, label: 'Members', to: 'members' },
        { icon: BarChart, label: 'Analytics', to: 'analytics' },
        { icon: Settings, label: 'Settings', to: 'settings' },
    ];
    React.useEffect(() => {
        if (workspaceId) {
            selectWorkspace(workspaceId);
        }
    }, [workspaceId, selectWorkspace]);
    return (<div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-auto px-2">
                    <span className="font-medium">
                      {(currentWorkspace === null || currentWorkspace === void 0 ? void 0 : currentWorkspace.name) || 'Select Workspace'}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4"/>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {workspaces === null || workspaces === void 0 ? void 0 : workspaces.map((workspace) => (<DropdownMenuItem key={workspace.id} onClick={() => selectWorkspace(workspace.id)}>
                      {workspace.name}
                    </DropdownMenuItem>))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={createWorkspace}>
                    <Plus className="mr-2 h-4 w-4"/>
                    Create Workspace
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <nav className="flex space-x-4">
            {navItems.map(({ icon: Icon, label, to }) => (<NavLink key={to} to={`${workspaceId}/${to}`} className={({ isActive }) => `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-primary'}`}>
                <Icon className="mr-2 h-4 w-4"/>
                {label}
              </NavLink>))}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>);
};
export default WorkspaceLayout;
//# sourceMappingURL=WorkspaceLayout.js.map