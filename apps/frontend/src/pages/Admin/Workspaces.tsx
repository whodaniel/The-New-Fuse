import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, } from '@/components/core';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Search, Users, Brain } from 'lucide-react';
const Workspaces = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const workspaces = [
        {
            id: '1',
            name: 'Research Lab',
            owner: 'John Doe',
            members: 12,
            neuralNetworks: 5,
            storageUsed: '45.2 GB',
            status: 'active',
            lastActive: '2 hours ago',
        },
    ];
    return (<div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Workspaces</h1>
        <p className="text-muted-foreground mt-2">
          Monitor and manage all workspaces
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Workspaces</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"/>
                <Input placeholder="Search workspaces..." className="pl-8" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <div className="grid grid-cols-7 gap-4 p-4 text-sm font-medium text-muted-foreground">
              <div>Name</div>
              <div>Owner</div>
              <div>Members</div>
              <div>Neural Networks</div>
              <div>Storage Used</div>
              <div>Status</div>
              <div>Last Active</div>
            </div>
            {workspaces.map((workspace) => (<div key={workspace.id} className="grid grid-cols-7 gap-4 p-4 border-t items-center">
                <div className="font-medium">{workspace.name}</div>
                <div className="text-muted-foreground">{workspace.owner}</div>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4"/>
                  <span>{workspace.members}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Brain className="h-4 w-4"/>
                  <span>{workspace.neuralNetworks}</span>
                </div>
                <div>{workspace.storageUsed}</div>
                <div>
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${workspace.status === 'active'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'}`}>
                    {workspace.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {workspace.lastActive}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4"/>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>View Members</DropdownMenuItem>
                      <DropdownMenuItem>View Analytics</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Deactivate Workspace
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Resource Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] flex items-center justify-center border rounded-lg">
              Chart: Resource Usage by Workspace
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] flex items-center justify-center border rounded-lg">
              Chart: Workspace Activity
            </div>
          </CardContent>
        </Card>
      </div>
    </div>);
};
export default Workspaces;
//# sourceMappingURL=Workspaces.js.map