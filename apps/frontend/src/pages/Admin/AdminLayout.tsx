import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Folders, Activity, Settings, Bell, Layers } from 'lucide-react';
import { Button } from '@/components/core';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu';
const AdminLayout = () => {
    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', to: 'dashboard' },
        { icon: Users, label: 'Users', to: 'users' },
        { icon: Folders, label: 'Workspaces', to: 'workspaces' },
        { icon: Layers, label: 'Onboarding', to: 'onboarding' },
        { icon: Activity, label: 'System Health', to: 'system-health' },
        { icon: Settings, label: 'Settings', to: 'settings' },
    ];
    return (<div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5"/>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-muted">
                      A
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <nav className="flex space-x-4">
            {navItems.map(({ icon: Icon, label, to }) => (<NavLink key={to} to={to} className={({ isActive }) => `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground'}`}>
                <Icon className="mr-2 h-4 w-4"/>
                {label}
              </NavLink>))}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>);
};
export default AdminLayout;
//# sourceMappingURL=AdminLayout.js.map